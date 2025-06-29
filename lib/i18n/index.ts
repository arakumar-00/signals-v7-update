import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './en';
import ta from './ta';
import hi from './hi';
import ar from './ar';

// Create i18n instance
const i18n = new I18n({
  en,
  ta,
  hi,
  ar,
});

// Set fallback locale
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Language options with metadata
export const LANGUAGE_OPTIONS = [
  { 
    code: 'en', 
    name: 'English', 
    flag: '🇺🇸',
    nativeName: 'English',
    rtl: false
  },
  { 
    code: 'ta', 
    name: 'Tamil', 
    flag: '🇮🇳',
    nativeName: 'தமிழ்',
    rtl: false
  },
  { 
    code: 'hi', 
    name: 'Hindi', 
    flag: '🇮🇳',
    nativeName: 'हिन्दी',
    rtl: false
  },
  { 
    code: 'ar', 
    name: 'Arabic', 
    flag: '🇸🇦',
    nativeName: 'العربية',
    rtl: true
  },
];

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'app_language';

// Get device locale
export function getDeviceLocale(): string {
  const deviceLocale = Localization.locale;
  const languageCode = deviceLocale.split('-')[0]; // Get language code without region
  
  // Check if we support this language
  const supportedLanguage = LANGUAGE_OPTIONS.find(lang => lang.code === languageCode);
  return supportedLanguage ? languageCode : 'en';
}

// Load saved language from storage
export async function loadSavedLanguage(): Promise<string> {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && LANGUAGE_OPTIONS.find(lang => lang.code === savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
  
  // Fallback to device locale or English
  return getDeviceLocale();
}

// Save language preference
export async function saveLanguagePreference(languageCode: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    console.log('✅ Language preference saved:', languageCode);
  } catch (error) {
    console.error('❌ Error saving language preference:', error);
  }
}

// Initialize i18n with saved or device language
export async function initializeI18n(): Promise<string> {
  const languageCode = await loadSavedLanguage();
  i18n.locale = languageCode;
  
  console.log('🌍 i18n initialized with language:', languageCode);
  return languageCode;
}

// Change language
export async function changeLanguage(languageCode: string): Promise<void> {
  if (!LANGUAGE_OPTIONS.find(lang => lang.code === languageCode)) {
    console.warn('⚠️ Unsupported language code:', languageCode);
    return;
  }
  
  i18n.locale = languageCode;
  await saveLanguagePreference(languageCode);
  console.log('🔄 Language changed to:', languageCode);
}

// Get current language info
export function getCurrentLanguageInfo() {
  return LANGUAGE_OPTIONS.find(lang => lang.code === i18n.locale) || LANGUAGE_OPTIONS[0];
}

// Translation function with interpolation support
export function t(key: string, options?: { [key: string]: any }): string {
  return i18n.t(key, options);
}

// Check if current language is RTL
export function isRTL(): boolean {
  const currentLang = getCurrentLanguageInfo();
  return currentLang?.rtl || false;
}

export default i18n;