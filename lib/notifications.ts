/**
 * Local notifications for the rest timer.
 *
 * The phone goes in a pocket during a two minute rest, so an in-app banner
 * would be missed. A scheduled local notification fires regardless of whether
 * the app is in front.
 *
 * Every function here is best-effort: a denied permission, a simulator with
 * no notification support, or an Expo Go limitation must never stop somebody
 * training. The countdown on screen is the source of truth; this is the
 * nudge on top of it.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_CHANNEL = 'rest-timer';

let configured = false;

/** Show the alert even when the app happens to be in the foreground. */
function configureHandler() {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: false,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Ask for permission the first time a rest starts.
 * Returns false when we may not post notifications; callers carry on anyway.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    configureHandler();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
        name: 'Descansos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 400],
        sound: 'default',
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/**
 * Schedule the "rest is over" notification.
 * Returns its id so it can be cancelled if the rest is stopped early.
 */
export async function scheduleRestFinished(
  exerciseName: string,
  seconds: number,
): Promise<string | null> {
  if (seconds <= 0) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Descanso completo',
        body: `Ya descansaste lo suficiente. Sigue con ${exerciseName}.`,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL : undefined,
      },
    });
  } catch {
    return null;
  }
}

/** Drop a scheduled notification when the rest is cancelled or restarted. */
export async function cancelScheduled(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or already gone — nothing to do.
  }
}
