import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Bell, BellOff, Smartphone, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  requestNotificationPermissions,
} from '../lib/pushNotifications';

interface PushNotificationManagerProps {
  onRegistrationComplete?: (deviceId: string | null) => void;
}

export default function PushNotificationManager({ onRegistrationComplete }: PushNotificationManagerProps) {
  const { colors, fontSizes } = useTheme();
  const { t } = useLanguage();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    checkRegistrationStatus();
    
    const cleanup = setupNotificationListeners();
    
    return cleanup;
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      // For demo purposes, assume not registered initially
      setIsRegistered(false);
      setDeviceId(null);
      
      console.log('📊 Push notification status: not registered');
    } catch (error) {
      console.error('❌ Error checking registration status:', error);
      setIsRegistered(false);
    }
  };

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      
      const deviceId = await registerForPushNotifications();
      
      if (deviceId) {
        setIsRegistered(true);
        setDeviceId(deviceId);
        onRegistrationComplete?.(deviceId);
        
        Alert.alert(
          t('success'),
          t('notificationsEnabled'),
          [{ text: t('ok'), style: 'default' }]
        );
      } else {
        Alert.alert(
          t('error'),
          t('notificationRegistrationFailed'),
          [{ text: t('ok'), style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      Alert.alert(t('error'), t('networkError'));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const granted = await requestNotificationPermissions();
      
      if (granted) {
        await handleRegister();
      } else {
        Alert.alert(
          t('permissionRequired'),
          t('notificationPermissionMessage'),
          [
            { text: t('cancel'), style: 'cancel' },
            { text: 'Settings', onPress: () => {
              console.log('Open device settings for notifications');
            }}
          ]
        );
      }
    } catch (error) {
      console.error('❌ Permission request error:', error);
    }
  };

  const getStatusInfo = () => {
    if (isRegistered === null) {
      return {
        icon: Smartphone,
        color: colors.textSecondary,
        title: t('checkingStatus'),
        subtitle: t('pleaseWait'),
        action: null,
      };
    }

    if (isRegistered) {
      return {
        icon: CheckCircle,
        color: colors.success,
        title: t('notificationsEnabled'),
        subtitle: t('deviceRegistered'),
        action: null,
      };
    }

    return {
      icon: AlertCircle,
      color: colors.warning,
      title: t('notificationsDisabled'),
      subtitle: t('enableNotificationsMessage'),
      action: {
        text: t('enableNotifications'),
        onPress: handleRequestPermissions,
      },
    };
  };

  const statusInfo = getStatusInfo();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${statusInfo.color}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: statusInfo.color,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    subtitle: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginTop: 12,
      alignItems: 'center',
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionButtonText: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
    },
    deviceInfo: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    deviceText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <statusInfo.icon size={20} color={statusInfo.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{statusInfo.title}</Text>
          <Text style={styles.subtitle}>{statusInfo.subtitle}</Text>
        </View>
      </View>

      {statusInfo.action && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            isRegistering && styles.actionButtonDisabled
          ]}
          onPress={statusInfo.action.onPress}
          disabled={isRegistering}
        >
          <Text style={styles.actionButtonText}>
            {isRegistering ? t('registering') : statusInfo.action.text}
          </Text>
        </TouchableOpacity>
      )}

      {deviceId && (
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceText}>
            {t('deviceId')}: {deviceId.substring(0, 20)}...
          </Text>
        </View>
      )}
    </View>
  );
}