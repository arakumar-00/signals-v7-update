import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { createNotification } from './database';

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
export async function getDeviceId(): Promise<string> {
  try {
    const deviceInfo = Device.osInternalBuildId || 
                      Device.deviceName || 
                      Device.modelName || 
                      'unknown-device';
    
    const cleanId = deviceInfo.replace(/\s+/g, '-').toLowerCase();
    const timestamp = Date.now();
    return `device_${cleanId}_${timestamp}`;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `device_fallback_${Date.now()}`;
  }
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    console.log('📱 Requesting notification permissions...');
    
    if (Platform.OS === 'web') {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('🌐 Web notification permission:', permission);
        return permission === 'granted';
      }
      console.log('⚠️ Web notifications not supported');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log('📱 Mobile notification permission:', finalStatus);
    return finalStatus === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}

// Get push notification token
async function getPushToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform - FCM tokens not supported in this demo');
      return null;
    }

    if (!Device.isDevice) {
      console.log('⚠️ Must use physical device for push notifications');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '8ce373b5-978a-43ad-a4cb-3ad8feb6e149';
    if (!projectId) {
      console.warn('⚠️ EAS project ID not configured');
      return null;
    }

    console.log('🔑 Getting Expo push token...');
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('✅ Expo push token obtained');
    return token.data;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    return null;
  }
}

// Register device for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    console.log('🚀 Starting push notification registration...');

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('❌ Notification permissions not granted');
      return null;
    }

    const pushToken = await getPushToken();
    const deviceId = await getDeviceId();
    
    console.log('✅ Device registered for push notifications');
    return deviceId;
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
}

// Setup notification listeners
export function setupNotificationListeners() {
  const listeners: (() => void)[] = [];

  console.log('🔔 Setting up notification listeners...');

  if (Platform.OS !== 'web') {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification.request.content.title);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response.notification.request.content.title);
    });

    listeners.push(() => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    });
  }

  console.log('✅ Notification listeners set up');

  return () => {
    console.log('🧹 Cleaning up notification listeners');
    listeners.forEach(cleanup => cleanup());
  };
}

// Send a local notification
export async function sendLocalNotification(data: PushNotificationData): Promise<void> {
  try {
    console.log('📤 Sending local notification:', data.title);

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/assets/images/icon.png',
          data: data.data,
        });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.message,
          data: data.data,
        },
        trigger: null,
      });
    }

    console.log('✅ Local notification sent');
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
  }
}

// Create notification in database
export async function createPushNotification(data: PushNotificationData & { target_user?: string }): Promise<string | null> {
  try {
    console.log('📝 Creating push notification in database:', data.title);

    const notificationId = await createNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      target_user: data.target_user,
    });

    if (notificationId) {
      console.log('✅ Notification created:', notificationId);
    }

    return notificationId;
  } catch (error) {
    console.error('❌ Error creating push notification:', error);
    return null;
  }
}

// Predefined notification functions
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
      test: true,
    },
  });
}

export async function sendTargetedNotification(
  userId: string,
  data: PushNotificationData
): Promise<void> {
  await createPushNotification({
    ...data,
    target_user: userId,
  });
}

export async function sendBroadcastNotification(data: PushNotificationData): Promise<void> {
  await createPushNotification({
    ...data,
    target_user: null,
  });
}