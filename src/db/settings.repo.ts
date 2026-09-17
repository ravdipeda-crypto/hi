// Typed data-access functions for app Settings.

import { STORES, getById, put } from './db';
import type { Settings } from '../types';

const SETTINGS_KEY = 'app';

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_KEY,
  // Deep is the default theme for a new installation / first launch.
  theme: 'dark',
  notificationsEnabled: false,
  hasOnboarded: false,
  reminderSound: true,
  reminderVibration: true,
  reminderFullScreenAlert: false,
  reminderFrequency: 'ONCE_DAILY',
  dailyResetHour: 0,
};

/**
 * Back-fills any reminder/reset fields missing from a previously-saved
 * Settings record (pre-existing users upgrading from an older version that
 * didn't have them yet) with their defaults, without touching fields the
 * user already set (theme, notificationsEnabled, hasOnboarded stay exactly
 * as persisted). Centralizing this here means every read path — including
 * import — gets the same backward-compatible shape.
 */
export function withSettingsDefaults(settings: Settings): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
  };
}

export async function getSettings(): Promise<Settings> {
  const existing = await getById<Settings>(STORES.settings, SETTINGS_KEY);
  return existing ? withSettingsDefaults(existing) : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await put(STORES.settings, settings);
}
