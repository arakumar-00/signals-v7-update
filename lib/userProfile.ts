import { supabase } from './supabase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  user_id: string;
  name?: string;
  dob?: string;
  language: string;
  fcm_token?: string;
  device_type?: 'ios' | 'android' | 'web';
  app_version?: string;
  onboarding_completed: boolean;
  last_active: string;
  created_at: string;
}

export interface OnboardingData {
  name: string;
  dob: string;
  language: string;
}

// Get or create device ID
async function getDeviceId(): Promise<string> {
  try {
    let deviceId: string | null = null;

    if (Platform.OS === 'web') {
      deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('device_id', deviceId);
      }
    } else {
      const { getItemAsync, setItemAsync } = await import('expo-secure-store');
      deviceId = await getItemAsync('device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await setItemAsync('device_id', deviceId);
      }
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Add this temporary limiter
// let didFetchProfile = false;

export async function getUserProfile(): Promise<UserProfile | null> {
  // if (didFetchProfile) return null;
  // didFetchProfile = true;

  try {
    const deviceId = await getDeviceId();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', deviceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Network error fetching user profile:', error);
    return null;
  }
}


export async function createUserProfile(onboardingData: OnboardingData): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: deviceId,
        name: onboardingData.name,
        dob: onboardingData.dob,
        language: onboardingData.language,
        device_type: Platform.OS as 'ios' | 'android' | 'web',
        app_version: '1.0.0',
        onboarding_completed: true,
        last_active: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error creating user profile:', error);
    return false;
  }
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        last_active: new Date().toISOString(),
      })
      .eq('user_id', deviceId);

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error updating user profile:', error);
    return false;
  }
}

export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    const profile = await getUserProfile();
    return profile?.onboarding_completed || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

// Cache onboarding status locally for faster checks
export async function cacheOnboardingStatus(completed: boolean): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('onboarding_completed', completed.toString());
    } else {
      await AsyncStorage.setItem('onboarding_completed', completed.toString());
    }
  } catch (error) {
    console.error('Error caching onboarding status:', error);
  }
}

export async function getCachedOnboardingStatus(): Promise<boolean | null> {
  try {
    let status: string | null = null;

    if (Platform.OS === 'web') {
      status = localStorage.getItem('onboarding_completed');
    } else {
      status = await AsyncStorage.getItem('onboarding_completed');
    }

    return status ? status === 'true' : null;
  } catch (error) {
    console.error('Error getting cached onboarding status:', error);
    return null;
  }
}