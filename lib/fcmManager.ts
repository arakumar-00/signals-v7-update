import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { getFCMToken } from './firebase';

export interface DeviceProfile {
  id?: string;
  user_id: string;         // device_id
  fcm_token?: string;
  device_type?: 'ios' | 'android' | 'web';
  app_version?: string;
  last_active: string;
  created_at?: string;
}

// Generate unique device ID
export async function getDeviceId(): Promise<string> {
  try {
    // Check if we already have a stored device ID
    const existingId = await AsyncStorage.getItem('device_id');
    if (existingId) {
      console.log('📱 Using existing device ID:', existingId.substring(0, 20) + '...');
      return existingId;
    }

    // Generate new device ID
    const deviceInfo = Device.osInternalBuildId || 
                      Device.deviceName || 
                      Device.modelName || 
                      'unknown-device';
    
    // Clean and format the ID
    const cleanId = deviceInfo.replace(/\s+/g, '-').toLowerCase();
    const timestamp = Date.now();
    const finalId = `device_${cleanId}_${timestamp}`;
    
    // Store for future use
    await AsyncStorage.setItem('device_id', finalId);
    console.log('📱 Generated new device ID:', finalId.substring(0, 20) + '...');
    
    return finalId;
  } catch (error) {
    console.error('❌ Error getting device ID:', error);
    // Fallback to timestamp-based ID
    const fallbackId = `device_fallback_${Date.now()}`;
    try {
      await AsyncStorage.setItem('device_id', fallbackId);
    } catch (storageError) {
      console.error('❌ Error storing fallback device ID:', storageError);
    }
    return fallbackId;
  }
}

// Get current device type
function getDeviceType(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

// Get FCM token based on platform
async function getPlatformFCMToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await getFCMToken();
    } else {
      // For mobile, you would use Expo push tokens
      // This is handled in the push notification registration
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting platform FCM token:', error);
    return null;
  }
}

// Register device for FCM
export async function registerDevice(fcmToken?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const deviceId = await getDeviceId();
    const deviceType = getDeviceType();
    
    // Get FCM token if not provided
    let finalFcmToken = fcmToken;
    if (!finalFcmToken) {
      finalFcmToken = await getPlatformFCMToken();
    }

    const deviceData = {
      user_id: deviceId,
      fcm_token: finalFcmToken,
      device_type: deviceType,
      app_version: '1.0.0',
      last_active: new Date().toISOString(),
    };

    console.log('💾 Registering device:', { 
      user_id: deviceId.substring(0, 20) + '...',
      device_type: deviceData.device_type,
      has_fcm_token: !!finalFcmToken
    });

    // Check if device already exists
    const { data: existingDevice, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, user_id')
      .eq('user_id', deviceId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error checking existing device:', fetchError);
      return { success: false, error: fetchError.message };
    }

    let result;
    if (existingDevice) {
      // Device exists, update it
      console.log('🔄 Updating existing device');
      result = await supabase
        .from('user_profiles')
        .update({
          fcm_token: deviceData.fcm_token,
          device_type: deviceData.device_type,
          app_version: deviceData.app_version,
          last_active: deviceData.last_active,
        })
        .eq('user_id', deviceId);
    } else {
      // Device doesn't exist, create it
      console.log('➕ Creating new device');
      result = await supabase
        .from('user_profiles')
        .insert(deviceData);
    }

    if (result.error) {
      console.error('❌ Supabase operation error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('✅ Device registered successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error registering device:', error);
    return { success: false, error: 'Failed to register device' };
  }
}

// Update FCM token
export async function updateFCMToken(fcmToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const deviceId = await getDeviceId();
    
    console.log('🔄 Updating FCM token for device:', deviceId.substring(0, 20) + '...');

    const { error } = await supabase
      .from('user_profiles')
      .update({
        fcm_token: fcmToken,
        last_active: new Date().toISOString(),
      })
      .eq('user_id', deviceId);

    if (error) {
      console.error('❌ Error updating FCM token:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ FCM token updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating FCM token:', error);
    return { success: false, error: 'Failed to update FCM token' };
  }
}

// Get device profile
export async function getDeviceProfile(): Promise<DeviceProfile | null> {
  try {
    const deviceId = await getDeviceId();
    
    console.log('📖 Loading device profile for:', deviceId.substring(0, 20) + '...');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', deviceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found, create one
        console.log('📝 Creating new device profile...');
        const registerResult = await registerDevice();
        if (registerResult.success) {
          // Try to fetch again
          const { data: newData, error: newError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', deviceId)
            .single();
          
          if (!newError) {
            console.log('✅ Device profile created and loaded');
            return newData;
          }
        }
      }
      console.error('❌ Error loading device profile:', error);
      return null;
    }

    console.log('✅ Device profile loaded');
    return data;
  } catch (error) {
    console.error('❌ Error loading device profile:', error);
    return null;
  }
}

// Get current device ID (for display purposes)
export async function getCurrentDeviceId(): Promise<string> {
  return await getDeviceId();
}

// Clear device data (for testing/reset)
export async function clearDeviceData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(['device_id']);
    console.log('🗑️ Device data cleared');
  } catch (error) {
    console.error('❌ Error clearing device data:', error);
  }
}