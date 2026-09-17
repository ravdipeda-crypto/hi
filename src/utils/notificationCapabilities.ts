// Capability detection for reminder settings. Per the product requirement
// to "respect actual Android/browser notification capabilities" and never
// pretend a feature works when the platform can't actually do it, every
// toggle in Settings > Reminders is gated by one of these checks — a
// control is only interactive when its underlying capability is real on
// the current platform, and shows an explanatory note instead of silently
// doing nothing when it isn't.

/** True if the Notification API exists at all (desktop/Android browsers;
 *  false in most in-app WebViews without a native plugin, and in any
 *  environment where the constructor was never defined). */
export function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Current permission state, or 'unsupported' if the API doesn't exist. */
export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!supportsNotifications()) return 'unsupported';
  return Notification.permission;
}

/** Requests permission if supported and not already decided. Resolves to
 *  the resulting (or existing) permission state. Never throws. */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!supportsNotifications()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** True if the Vibration API is available. Widely supported on Android
 *  Chrome/WebView; not implemented on iOS Safari or desktop browsers, so
 *  this is a real feature-detect, not a platform guess. */
export function supportsVibration(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Full-screen alert (an alarm-clock-style takeover that wakes the screen
 * even when locked) is an Android-native capability with no equivalent web
 * API — it requires a native plugin (e.g. a full-screen Intent/Activity)
 * that this build does not include. Always false here rather than
 * pretending a checkbox controls something real; Settings shows this
 * control disabled with an explanatory note instead of hiding it outright,
 * so the roadmap is visible without misrepresenting today's capability.
 */
export function supportsFullScreenAlert(): boolean {
  return false;
}

/** Custom notification sound selection has no standard web API (the old
 *  `sound` field on the Notification constructor was never implemented by
 *  any browser and is not available in a Capacitor WebView without a
 *  native plugin). What IS real: whether a fired notification plays the
 *  platform's own default alert sound, which happens automatically and
 *  isn't something this app can toggle independently of the OS/browser's
 *  own notification settings. This helper reports whether firing a
 *  notification at all is possible — "sound" in Settings is described
 *  accordingly (platform-default sound, not a custom one) rather than
 *  implying independent control. */
export function supportsNotificationSound(): boolean {
  return supportsNotifications();
}

/** Fires a one-off local notification for the "Send test reminder" action
 *  in Settings, honoring the vibration preference if supported. Silently
 *  no-ops if notifications aren't supported/permitted — callers should
 *  check supportsNotifications()/notificationPermission() first to give
 *  the user an accurate reason rather than a silent failure. */
export function fireTestReminder(withVibration: boolean): void {
  if (supportsNotifications() && Notification.permission === 'granted') {
    new Notification('GRIT', {
      body: 'This is what your daily reminder will look like.',
      tag: 'grit-reminder-test',
    });
  }
  if (withVibration && supportsVibration()) {
    navigator.vibrate(200);
  }
}
