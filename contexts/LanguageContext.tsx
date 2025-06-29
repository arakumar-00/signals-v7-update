import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { 
  initializeI18n, 
  changeLanguage as changeI18nLanguage, 
  getCurrentLanguageInfo,
  isRTL,
  LANGUAGE_OPTIONS,
  t
} from '../lib/i18n';

interface LanguageContextType {
  currentLanguage: string;
  currentLanguageInfo: typeof LANGUAGE_OPTIONS[0];
  availableLanguages: typeof LANGUAGE_OPTIONS;
  changeLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, options?: { [key: string]: any }) => string;
  isRTL: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    try {
      setIsLoading(true);
      const languageCode = await initializeI18n();
      setCurrentLanguage(languageCode);
      
      // Handle RTL layout if needed
      const rtl = isRTL();
      if (I18nManager.isRTL !== rtl) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
        // Note: In a real app, you might want to restart the app here
        // for RTL changes to take full effect
      }
    } catch (error) {
      console.error('❌ Error initializing language:', error);
      setCurrentLanguage('en'); // Fallback to English
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeI18nLanguage(languageCode);
      setCurrentLanguage(languageCode);
      
      // Handle RTL layout change
      const rtl = isRTL();
      if (I18nManager.isRTL !== rtl) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
        // In a production app, you might want to show a message
        // asking the user to restart the app for RTL changes
      }
      
      console.log('✅ Language changed successfully to:', languageCode);
    } catch (error) {
      console.error('❌ Error changing language:', error);
    }
  };

  const currentLanguageInfo = getCurrentLanguageInfo();

  const value: LanguageContextType = {
    currentLanguage,
    currentLanguageInfo,
    availableLanguages: LANGUAGE_OPTIONS,
    changeLanguage: handleLanguageChange,
    t,
    isRTL: isRTL(),
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}