import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { upsertUserProfile, createNotification } from './database';
import { getFCMToken, onForegroundMessage } from './firebase';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushNotificationData {
  type: 'signal' | 'achievement' | 'announcement' | 'alert';
  title: string;
  message: string;
  data?: any;
}

// Generate unique device ID
function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create device ID
async function getDeviceId(): Promise<string> {
  try {
    let deviceId: string | null = null;

    if (Platform.OS === 'web') {
      deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem('device_id', deviceId);
      }
    } else {
      const { getItemAsync, setItemAsync } = await import('expo-secure-store');
      deviceId = await getItemAsync('device_id');
      if (!deviceId) {
        deviceId = generateDeviceId();
        await setItemAsync('device_id', deviceId);
      }
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return generateDeviceId();
  }
}

// Get device information
function getDeviceInfo() {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isDevice: Device.isDevice,
    deviceName: Device.deviceName,
    osName: Device.osName,
    osVersion: Device.osVersion,
  };
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // Web notification permissions
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }

    // Mobile notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Get push notification token
async function getPushToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await getFCMToken();
    }

    // For mobile platforms
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '8ce373b5-978a-43ad-a4cb-3ad8feb6e149';
    if (!projectId) {
      console.warn('EAS project ID not configured');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Register device for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return null;
    }

    const deviceId = await getDeviceId();
    const pushToken = await getPushToken();

    if (!pushToken) {
      console.log('Could not get push token');
      return null;
    }

    // Save device profile to database
    const success = await upsertUserProfile({
      user_id: deviceId,
      fcm_token: pushToken,
      device_type: Platform.OS as 'ios' | 'android' | 'web',
      app_version: '1.0.0',
    });

    if (success) {
      console.log('Device registered for push notifications:', deviceId);
      return deviceId;
    } else {
      console.error('Failed to save device profile');
      return null;
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Send a local notification (for testing and immediate feedback)
export async function sendLocalNotification(data: PushNotificationData): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/assets/images/icon.png',
          data: data.data,
        });
      }
    } else {
      // Mobile notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.message,
          data: data.data,
        },
        trigger: null, // Send immediately
      });
    }

    // Also save to database - this will trigger the automatic push notification
    await createNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
}

// Create notification in database (triggers automatic push)
export async function createPushNotification(data: PushNotificationData & { target_user?: string }): Promise<string | null> {
  try {
    // Insert into notifications table - this will automatically trigger the push notification
    const notificationId = await createNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      target_user: data.target_user,
    });

    if (notificationId) {
      console.log('Notification created and push triggered:', notificationId);
    }

    return notificationId;
  } catch (error) {
    console.error('Error creating push notification:', error);
    return null;
  }
}

// Log notification response
export async function logNotificationResponse(
  notificationId: string,
  action: 'clicked' | 'dismissed' | 'opened',
  deviceInfo?: any
): Promise<void> {
  try {
    const deviceId = await getDeviceId();

    // In a real app, you'd send this to your notification_responses table
    console.log('Notification response logged:', {
      notificationId,
      deviceId,
      action,
      deviceInfo: deviceInfo || getDeviceInfo(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging notification response:', error);
  }
}

// Setup notification listeners
export function setupNotificationListeners() {
  const listeners: (() => void)[] = [];

  if (Platform.OS === 'web') {
    // Web foreground message listener
    const unsubscribeForeground = onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);
      // Handle foreground message
    });
    listeners.push(unsubscribeForeground);
  } else {
    // Mobile notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);

      const notificationId = response.notification.request.identifier;
      logNotificationResponse(notificationId, 'clicked');

      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.type === 'signal' && data?.signal_id) {
        console.log('Navigate to signal:', data.signal_id);
        // Add navigation logic here
      }
    });

    listeners.push(() => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    });
  }

  // Return cleanup function
  return () => {
    listeners.forEach(cleanup => cleanup());
  };
}

// Send test notification (now uses automatic trigger)
export async function sendTestNotification(): Promise<void> {
  await createPushNotification({
    type: 'signal',
    title: 'Test Signal Alert',
    message: 'XAU/USD BUY signal activated! Entry: $2,345.67',
    data: {
      signal_id: 'test-123',
      pair: 'XAU/USD',
      type: 'BUY',
      entry_price: 2345.67,
    },
  });
}

// Send signal notification (now uses automatic trigger)
export async function sendSignalNotification(signal: {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  status: string;
}): Promise<void> {
  await createPushNotification({
    type: 'signal',
    title: `${signal.status === 'active' ? 'New' : 'Updated'} Signal Alert`,
    message: `${signal.pair} ${signal.type} signal ${signal.status}! Entry: $${signal.entry_price.toFixed(2)}`,
    data: {
      signal_id: signal.id,
      pair: signal.pair,
      type: signal.type,
      entry_price: signal.entry_price,
      status: signal.status,
    },
  });
}

// Send achievement notification (now uses automatic trigger)
export async function sendAchievementNotification(achievement: {
  title: string;
  description: string;
  type: string;
}): Promise<void> {
  await createPushNotification({
    type: 'achievement',
    title: `Achievement Unlocked: ${achievement.title}`,
    message: achievement.description,
    data: {
      achievement_type: achievement.type,
    },
  });
}

// Send targeted notification to specific user
export async function sendTargetedNotification(
  userId: string,
  data: PushNotificationData
): Promise<void> {
  await createPushNotification({
    ...data,
    target_user: userId,
  });
}

// Send broadcast notification to all users
export async function sendBroadcastNotification(data: PushNotificationData): Promise<void> {
  await createPushNotification({
    ...data,
    target_user: null, // null means broadcast to all users
  });
}