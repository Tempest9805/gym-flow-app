/**
 * Exact alarms for the rest timer.
 *
 * `expo-notifications` schedules a local notification through AlarmManager.
 * Its scheduling delegate picks the API by permission:
 *
 *     if (SDK_INT < S || alarmManager.canScheduleExactAlarms())
 *         setExactAndAllowWhileIdle(...)   // fires on time
 *     else
 *         setAndAllowWhileIdle(...)        // Android throttles this to ~1 per 9 min
 *
 * Nobody declares an exact-alarm permission by default: not the library's own
 * AndroidManifest, not its config plugin, not `android.permissions` in app.json.
 * So on Android 12+ the rest notification lands minutes late — measured at
 * 2 min 15 s on a 3:00 rest, which makes the feature useless.
 *
 * `android.permissions` in app.json cannot express `maxSdkVersion`, and that
 * attribute is the whole point of the second entry, hence this plugin:
 *
 *   - USE_EXACT_ALARM      Android 13+. Granted at install, no prompt.
 *   - SCHEDULE_EXACT_ALARM Android 12 only, where USE_EXACT_ALARM does not
 *                          exist yet and this one is granted by default.
 *                          Capped at API 32 so it never reaches Android 13+,
 *                          where it would need a trip to system settings.
 *
 * Play Console note: USE_EXACT_ALARM is restricted to apps whose core function
 * is an alarm, timer or calendar. The rest countdown is that function here, and
 * it must be declared as such when publishing. See docs/decisions.md.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const USE_EXACT_ALARM = 'android.permission.USE_EXACT_ALARM';
const SCHEDULE_EXACT_ALARM = 'android.permission.SCHEDULE_EXACT_ALARM';

/** Last Android version without USE_EXACT_ALARM (Android 12L). */
const LAST_SDK_WITHOUT_USE_EXACT_ALARM = '32';

function withExactAlarm(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const existing = manifest['uses-permission'] ?? [];

    // Drop our own entries first so re-running prebuild cannot duplicate them,
    // and so a stale entry without maxSdkVersion gets replaced rather than kept.
    const kept = existing.filter((entry) => {
      const name = entry?.$?.['android:name'];
      return name !== USE_EXACT_ALARM && name !== SCHEDULE_EXACT_ALARM;
    });

    manifest['uses-permission'] = [
      ...kept,
      { $: { 'android:name': USE_EXACT_ALARM } },
      {
        $: {
          'android:name': SCHEDULE_EXACT_ALARM,
          'android:maxSdkVersion': LAST_SDK_WITHOUT_USE_EXACT_ALARM,
        },
      },
    ];

    return mod;
  });
}

module.exports = withExactAlarm;
