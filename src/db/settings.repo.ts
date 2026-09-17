// Typed data-access functions for app Settings.

import { STORES, getById, put } from './db';
import type { Settings } from '../types';

const SETTINGS_KEY = 'app';

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_KEY,
  // Daylight is the primary Aqua Lens identity; Deep is the dark alternative.
  theme: 'light',
  notificationsEnabled: false,
  hasOnboarded: false,
};

export async function getSettings(): Promise<Settings> {
  const existing = await getById<Settings>(STORES.settings, SETTINGS_KEY);
  return existing ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await put(STORES.settings, settings);
}
