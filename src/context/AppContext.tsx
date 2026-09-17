// Single application context. Per the project's "keep it simple" mandate we
// use one React context + useReducer-free plain state instead of Redux /
// Zustand / TanStack Query — this is a personal app with a handful of
// screens, and a single provider is easy for a beginner to follow.
//
// This context is the ONLY place that talks to db/repository.ts. Components
// read state from here and call the exposed action functions; they never
// touch IndexedDB directly.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Commitment, DayRecord, ExportPayload, Settings, TimerState } from '../types';
import * as repo from '../db/repository';
import { todayISO } from '../utils/date';
import { cappedElapsedSeconds, totalElapsedSeconds } from '../timer/engine';

interface AppContextValue {
  loading: boolean;
  error: string | null;
  dismissError: () => void;

  commitments: Commitment[];
  dayRecords: DayRecord[];
  timer: TimerState | null;
  settings: Settings;
  /** Advances every second while a timer is running, forcing consumers that
   *  read elapsed time to re-render. */
  nowMs: number;

  createCommitment: (input: repo.NewCommitmentInput) => Promise<Commitment>;
  deleteCommitment: (id: string) => Promise<void>;

  dayRecordsFor: (commitmentId: string) => DayRecord[];
  dayRecordFor: (commitmentId: string, date: string) => DayRecord | undefined;

  startTimer: (commitmentId: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;

  /** Toggles a Completion-type commitment's today record between DONE and
   *  NOT_STARTED. No timer is ever involved for these commitments. */
  toggleTodayCompletion: (commitmentId: string) => Promise<void>;

  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  exportData: () => Promise<ExportPayload>;
  importData: (payload: unknown) => Promise<void>;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [settings, setSettings] = useState<Settings>(repo.DEFAULT_SETTINGS);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const dayRecordsRef = useRef(dayRecords);
  dayRecordsRef.current = dayRecords;
  const timerRef = useRef(timer);
  timerRef.current = timer;

  const reportError = useCallback((err: unknown, fallback: string) => {
    console.error(err);
    setError(err instanceof Error ? err.message : fallback);
  }, []);

  // ---------- initial load ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loadedCommitments, loadedRecords, loadedTimer, loadedSettings] = await Promise.all([
          repo.listCommitments(),
          repo.listAllDayRecords(),
          repo.getTimerState(),
          repo.getSettings(),
        ]);
        if (cancelled) return;
        setCommitments(loadedCommitments);
        setDayRecords(loadedRecords);
        setTimer(loadedTimer ?? null);
        setSettings(loadedSettings);
      } catch (err) {
        if (!cancelled) reportError(err, 'Failed to load your data. Please refresh the page.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportError]);

  // ---------- theme reflected on <html> ----------
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // ---------- ticking clock while a timer runs, + auto-complete ----------
  useEffect(() => {
    if (!timer || timer.status !== 'running') return;

    const interval = setInterval(async () => {
      const currentTimer = timerRef.current;
      if (!currentTimer || currentTimer.status !== 'running') return;

      const now = Date.now();
      setNowMs(now);

      const record = dayRecordsRef.current.find(
        (r) => r.commitmentId === currentTimer.commitmentId && r.date === currentTimer.dayDate,
      );
      if (!record) return;

      if (totalElapsedSeconds(currentTimer, now) >= record.targetSeconds) {
        await completeFromTimer(currentTimer, record, now);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer?.status, timer?.commitmentId, timer?.dayDate]);

  async function completeFromTimer(currentTimer: TimerState, record: DayRecord, now: number) {
    const capped = cappedElapsedSeconds(currentTimer, record.targetSeconds, now);
    const updated: DayRecord = {
      ...record,
      elapsedSeconds: capped,
      status: 'DONE',
      completedAt: record.completedAt ?? now,
    };
    await repo.saveDayRecord(updated);
    await repo.clearTimerState();
    setDayRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setTimer(null);
  }

  // ---------- commitments ----------
  const createCommitment = useCallback(async (input: repo.NewCommitmentInput) => {
    const commitment = await repo.createCommitment(input);
    const records = await repo.listDayRecordsForCommitment(commitment.id);
    setCommitments((prev) => [commitment, ...prev]);
    setDayRecords((prev) => [...prev, ...records]);
    return commitment;
  }, []);

  const deleteCommitment = useCallback(async (id: string) => {
    await repo.deleteCommitment(id);
    setCommitments((prev) => prev.filter((c) => c.id !== id));
    setDayRecords((prev) => prev.filter((r) => r.commitmentId !== id));
    setTimer((prev) => {
      if (prev && prev.commitmentId === id) {
        repo.clearTimerState().catch(() => undefined);
        return null;
      }
      return prev;
    });
  }, []);

  const dayRecordsFor = useCallback(
    (commitmentId: string) => dayRecords.filter((r) => r.commitmentId === commitmentId).sort((a, b) => a.date.localeCompare(b.date)),
    [dayRecords],
  );

  const dayRecordFor = useCallback(
    (commitmentId: string, date: string) => dayRecords.find((r) => r.commitmentId === commitmentId && r.date === date),
    [dayRecords],
  );

  // ---------- timer ----------
  const startTimer = useCallback(
    async (commitmentId: string) => {
      if (timerRef.current) {
        throw new Error('Another timer is already running. Stop it before starting a new one.');
      }
      const date = todayISO();
      const record = dayRecordsRef.current.find((r) => r.commitmentId === commitmentId && r.date === date);
      if (!record) {
        throw new Error('This commitment has no scheduled target for today.');
      }
      if (record.status === 'DONE') {
        throw new Error('Today\u2019s target is already complete.');
      }

      const newTimer: TimerState = {
        id: 'current',
        commitmentId,
        dayDate: date,
        status: 'running',
        baselineSeconds: record.elapsedSeconds,
        accumulatedSeconds: 0,
        runStartedAt: Date.now(),
      };
      await repo.saveTimerState(newTimer);
      setTimer(newTimer);
      setNowMs(Date.now());
    },
    [],
  );

  const pauseTimer = useCallback(async () => {
    const current = timerRef.current;
    if (!current || current.status !== 'running' || current.runStartedAt == null) return;
    const now = Date.now();
    const ranSeconds = Math.max(0, (now - current.runStartedAt) / 1000);
    const updated: TimerState = {
      ...current,
      status: 'paused',
      accumulatedSeconds: current.accumulatedSeconds + ranSeconds,
      runStartedAt: null,
    };
    await repo.saveTimerState(updated);

    const record = dayRecordsRef.current.find(
      (r) => r.commitmentId === updated.commitmentId && r.date === updated.dayDate,
    );
    if (record) {
      const capped = cappedElapsedSeconds(updated, record.targetSeconds, now);
      const updatedRecord: DayRecord = {
        ...record,
        elapsedSeconds: capped,
        status: capped > 0 ? 'PARTIAL' : record.status,
      };
      await repo.saveDayRecord(updatedRecord);
      setDayRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    }

    setTimer(updated);
    setNowMs(now);
  }, []);

  const resumeTimer = useCallback(async () => {
    const current = timerRef.current;
    if (!current || current.status !== 'paused') return;
    const updated: TimerState = { ...current, status: 'running', runStartedAt: Date.now() };
    await repo.saveTimerState(updated);
    setTimer(updated);
    setNowMs(Date.now());
  }, []);

  const stopTimer = useCallback(async () => {
    const current = timerRef.current;
    if (!current) return;
    const now = Date.now();
    const record = dayRecordsRef.current.find(
      (r) => r.commitmentId === current.commitmentId && r.date === current.dayDate,
    );
    if (record) {
      const capped = cappedElapsedSeconds(current, record.targetSeconds, now);
      const reachedTarget = capped >= record.targetSeconds;
      const updatedRecord: DayRecord = {
        ...record,
        elapsedSeconds: capped,
        status: reachedTarget ? 'DONE' : capped > 0 ? 'PARTIAL' : record.status,
        completedAt: reachedTarget ? record.completedAt ?? now : record.completedAt,
      };
      await repo.saveDayRecord(updatedRecord);
      setDayRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    }
    await repo.clearTimerState();
    setTimer(null);
    setNowMs(now);
  }, []);

  // ---------- completion-only habits (no timer involved) ----------
  const toggleTodayCompletion = useCallback(async (commitmentId: string) => {
    const date = todayISO();
    const record = dayRecordsRef.current.find((r) => r.commitmentId === commitmentId && r.date === date);
    if (!record) {
      throw new Error('This commitment has no scheduled day for today.');
    }
    const nowDone = record.status === 'DONE';
    const updated: DayRecord = nowDone
      ? { ...record, status: 'NOT_STARTED', completedAt: undefined }
      : { ...record, status: 'DONE', completedAt: Date.now() };
    await repo.saveDayRecord(updated);
    setDayRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  // ---------- settings ----------
  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    const updated: Settings = { ...settings, ...partial };
    await repo.saveSettings(updated);
    setSettings(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // ---------- export / import / reset ----------
  const exportData = useCallback(() => repo.exportAllData(), []);

  const importData = useCallback(async (payload: unknown) => {
    await repo.importAllData(payload);
    const [loadedCommitments, loadedRecords, loadedTimer, loadedSettings] = await Promise.all([
      repo.listCommitments(),
      repo.listAllDayRecords(),
      repo.getTimerState(),
      repo.getSettings(),
    ]);
    setCommitments(loadedCommitments);
    setDayRecords(loadedRecords);
    setTimer(loadedTimer ?? null);
    setSettings(loadedSettings);
  }, []);

  const resetAllData = useCallback(async () => {
    await repo.resetAllData();
    setCommitments([]);
    setDayRecords([]);
    setTimer(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      error,
      dismissError,
      commitments,
      dayRecords,
      timer,
      settings,
      nowMs,
      createCommitment,
      deleteCommitment,
      dayRecordsFor,
      dayRecordFor,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      toggleTodayCompletion,
      updateSettings,
      exportData,
      importData,
      resetAllData,
    }),
    [
      loading,
      error,
      dismissError,
      commitments,
      dayRecords,
      timer,
      settings,
      nowMs,
      createCommitment,
      deleteCommitment,
      dayRecordsFor,
      dayRecordFor,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      toggleTodayCompletion,
      updateSettings,
      exportData,
      importData,
      resetAllData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
