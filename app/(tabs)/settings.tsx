import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Shield, CircleHelp as HelpCircle, Settings, ChevronRight, Share2, Moon, Sun, Type, Smartphone, Database, Globe, Check, X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationTestPanel from '../../components/NotificationTestPanel';
import BackendMonitor from '../../components/BackendMonitor';
import PushNotificationManager from '../../components/PushNotificationManager';
import SilentNotificationTester from '../../components/SilentNotificationTester';
import { getCurrentDeviceId, getDeviceProfile, DeviceProfile } from '../../lib/fcmManager';
import { silentNotificationHandler } from '../../lib/silentNotificationHandler';
import { backgroundSyncManager } from '../../lib/backgroundSyncManager';

export default function SettingsScreen() {
  const { colors, fontSizes, theme, setTheme, fontSize, setFontSize } = useTheme();
  const { t, currentLanguageInfo, availableLanguages, changeLanguage } = useLanguage();
  const [showNotificationTests, setShowNotificationTests] = useState(false);
  const [showSilentTests, setShowSilentTests] = useState(false);
  const [showBackendMonitor, setShowBackendMonitor] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadDeviceInfo = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading device information...');
      
      const [id, profile] = await Promise.all([
        getCurrentDeviceId(),
        getDeviceProfile()
      ]);
      
      setDeviceId(id);
      setDeviceProfile(profile);
      
      console.log('✅ Device info loaded:', {
        deviceId: id.substring(0, 20) + '...',
        hasProfile: !!profile,
        deviceType: profile?.device_type,
        hasFCMToken: !!profile?.fcm_token
      });
    } catch (error) {
      console.error('❌ Error loading device info:', error);
      Alert.alert(t('error'), t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDeviceInfo();
    
    // Initialize silent notification system
    const initializeSilentSystem = async () => {
      try {
        await silentNotificationHandler.initialize();
        await backgroundSyncManager.initialize();
        console.log('✅ Silent notification system initialized');
      } catch (error) {
        console.error('❌ Error initializing silent system:', error);
      }
    };
    
    initializeSilentSystem();
  }, [loadDeviceInfo]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out this amazing Gold & Silver trading signals app! Get real-time trading opportunities and boost your portfolio.',
        url: 'https://your-app-url.com',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setShowLanguagePicker(false);
    } catch (error) {
      Alert.alert(t('error'), t('networkError'));
    }
  };

  const handleNotificationRegistration = (deviceId: string | null) => {
    if (deviceId) {
      // Refresh device info after successful registration
      loadDeviceInfo();
    }
  };

  const menuItems = [
    {
      id: 'notifications',
      title: t('notificationSettings'),
      icon: Bell,
      color: colors.warning,
      onPress: () => Alert.alert(t('notifications'), t('comingSoon')),
    },
    {
      id: 'security',
      title: t('securityPrivacy'),
      icon: Shield,
      color: colors.success,
      onPress: () => Alert.alert(t('securityPrivacy'), t('comingSoon')),
    },
    {
      id: 'share',
      title: t('shareApp'),
      icon: Share2,
      color: colors.secondary,
      onPress: handleShare,
    },
    {
      id: 'help',
      title: t('helpSupport'),
      icon: HelpCircle,
      color: colors.primary,
      onPress: () => Alert.alert(t('helpSupport'), 'Contact support at help@tradingsignals.com'),
    },
  ];

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
          <item.icon size={20} color={item.color} />
        </View>
        <Text style={styles.menuItemText}>{item.title}</Text>
      </View>
      <ChevronRight size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: colors.text,
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Medium',
      marginTop: 16,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 24,
      marginBottom: 24,
    },
    title: {
      fontSize: fontSizes.title + 4,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    deviceCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    deviceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    deviceTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    deviceInfo: {
      gap: 8,
    },
    deviceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    deviceLabel: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    deviceValue: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
      flex: 1,
      textAlign: 'right',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: `${colors.success}20`,
    },
    statusText: {
      fontSize: fontSizes.small,
      color: colors.success,
      fontFamily: 'Inter-SemiBold',
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    settingText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    settingValue: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    themeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    themeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    themeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeButtonText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    themeButtonTextActive: {
      color: colors.background,
    },
    fontSizeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    fontSizeButton: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fontSizeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    fontSizeButtonText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    fontSizeButtonTextActive: {
      color: colors.background,
    },
    menuContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    menuIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuItemText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    versionText: {
      textAlign: 'center',
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      paddingBottom: 20,
    },
    testToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: `${colors.secondary}15`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: `${colors.secondary}30`,
    },
    testToggleText: {
      fontSize: fontSizes.medium,
      color: colors.secondary,
      fontFamily: 'Inter-SemiBold',
    },
    silentTestToggle: {
      backgroundColor: `${colors.warning}15`,
      borderColor: `${colors.warning}30`,
    },
    silentTestToggleText: {
      color: colors.warning,
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: '90%',
      maxHeight: '70%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageFlag: {
      fontSize: 20,
      marginRight: 12,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    languageNative: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    languageSelected: {
      backgroundColor: `${colors.primary}10`,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('settingsTitle')}</Text>
          <Text style={styles.subtitle}>{t('settingsSubtitle')}</Text>
        </View>

        {/* Push Notification Manager */}
        <PushNotificationManager onRegistrationComplete={handleNotificationRegistration} />

        {/* Device Information */}
        <View style={styles.deviceCard}>
          <View style={styles.deviceHeader}>
            <View style={styles.deviceIcon}>
              <Smartphone size={20} color={colors.primary} />
            </View>
            <Text style={styles.deviceTitle}>{t('deviceInformation')}</Text>
          </View>
          
          <View style={styles.deviceInfo}>
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>{t('deviceId')}:</Text>
              <Text style={styles.deviceValue}>
                {deviceId ? `${deviceId.substring(0, 20)}...` : t('loading')}
              </Text>
            </View>
            
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>{t('deviceType')}:</Text>
              <Text style={styles.deviceValue}>
                {deviceProfile?.device_type || 'Unknown'}
              </Text>
            </View>
            
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>{t('appVersion')}:</Text>
              <Text style={styles.deviceValue}>
                {deviceProfile?.app_version || '1.0.0'}
              </Text>
            </View>
            
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>{t('notifications')}:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {deviceProfile?.fcm_token ? t('enabled') : t('disabled')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Backend Monitor Toggle */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.testToggle}
            onPress={() => setShowBackendMonitor(!showBackendMonitor)}
          >
            <Text style={styles.testToggleText}>
              {showBackendMonitor ? 'Hide' : 'Show'} Backend Monitor
            </Text>
          </TouchableOpacity>
        )}

        {/* Backend Monitor */}
        {showBackendMonitor && Platform.OS === 'web' && <BackendMonitor />}

        {/* Silent Notification Test Panel Toggle */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={[styles.testToggle, styles.silentTestToggle]}
            onPress={() => setShowSilentTests(!showSilentTests)}
          >
            <Text style={[styles.testToggleText, styles.silentTestToggleText]}>
              {showSilentTests ? 'Hide' : 'Show'} Silent Notification Tests
            </Text>
          </TouchableOpacity>
        )}

        {/* Silent Notification Test Panel */}
        {showSilentTests && Platform.OS === 'web' && <SilentNotificationTester />}

        {/* Notification Test Panel Toggle */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.testToggle}
            onPress={() => setShowNotificationTests(!showNotificationTests)}
          >
            <Text style={styles.testToggleText}>
              {showNotificationTests ? 'Hide' : 'Show'} Notification Tests
            </Text>
          </TouchableOpacity>
        )}

        {/* Notification Test Panel */}
        {showNotificationTests && Platform.OS === 'web' && <NotificationTestPanel />}

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences')}</Text>

          {/* Language Selection */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguagePicker(true)}
          >
            <View style={styles.settingLeft}>
              <Globe size={20} color={colors.secondary} />
              <Text style={styles.settingText}>{t('language')}</Text>
            </View>
            <Text style={styles.settingValue}>
              {currentLanguageInfo.flag} {currentLanguageInfo.name}
            </Text>
          </TouchableOpacity>

          {/* Theme Selection */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Moon size={20} color={colors.secondary} />
              <Text style={styles.settingText}>{t('theme')}</Text>
            </View>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'light' && styles.themeButtonActive
                ]}
                onPress={() => setTheme('light')}
              >
                <Sun size={14} color={theme === 'light' ? colors.background : colors.textSecondary} />
                <Text style={[
                  styles.themeButtonText,
                  theme === 'light' && styles.themeButtonTextActive
                ]}>
                  {t('light')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'dark' && styles.themeButtonActive
                ]}
                onPress={() => setTheme('dark')}
              >
                <Moon size={14} color={theme === 'dark' ? colors.background : colors.textSecondary} />
                <Text style={[
                  styles.themeButtonText,
                  theme === 'dark' && styles.themeButtonTextActive
                ]}>
                  {t('dark')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  theme === 'system' && styles.themeButtonActive
                ]}
                onPress={() => setTheme('system')}
              >
                <Settings size={14} color={theme === 'system' ? colors.background : colors.textSecondary} />
                <Text style={[
                  styles.themeButtonText,
                  theme === 'system' && styles.themeButtonTextActive
                ]}>
                  {t('auto')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Font Size Selection */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Type size={20} color={colors.primary} />
              <Text style={styles.settingText}>{t('fontSize')}</Text>
            </View>
            <View style={styles.fontSizeButtons}>
              <TouchableOpacity
                style={[
                  styles.fontSizeButton,
                  fontSize === 'small' && styles.fontSizeButtonActive
                ]}
                onPress={() => setFontSize('small')}
              >
                <Text style={[
                  styles.fontSizeButtonText,
                  fontSize === 'small' && styles.fontSizeButtonTextActive
                ]}>
                  S
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.fontSizeButton,
                  fontSize === 'medium' && styles.fontSizeButtonActive
                ]}
                onPress={() => setFontSize('medium')}
              >
                <Text style={[
                  styles.fontSizeButtonText,
                  fontSize === 'medium' && styles.fontSizeButtonTextActive
                ]}>
                  M
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.fontSizeButton,
                  fontSize === 'large' && styles.fontSizeButtonActive
                ]}
                onPress={() => setFontSize('large')}
              >
                <Text style={[
                  styles.fontSizeButtonText,
                  fontSize === 'large' && styles.fontSizeButtonTextActive
                ]}>
                  L
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>
          <View style={styles.menuContainer}>
            {menuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>{t('version', { version: '1.0.0' })}</Text>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLanguagePicker(false)}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {availableLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    currentLanguageInfo.code === language.code && styles.languageSelected
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{language.name}</Text>
                    <Text style={styles.languageNative}>{language.nativeName}</Text>
                  </View>
                  {currentLanguageInfo.code === language.code && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}