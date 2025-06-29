import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { Bell, Send, TestTube, Award, TrendingUp, CircleAlert as AlertCircle, Users, User } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  sendTestNotification,
  sendSignalNotification,
  sendAchievementNotification,
  sendBroadcastNotification,
  sendTargetedNotification,
  createPushNotification,
} from '../lib/pushNotifications';

export default function NotificationTestPanel() {
  const { colors, fontSizes } = useTheme();
  const { t } = useLanguage();
  const [customTitle, setCustomTitle] = useState('Custom Test Notification');
  const [customMessage, setCustomMessage] = useState('This is a custom test message');
  const [targetUserId, setTargetUserId] = useState('');

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert(t('success'), 'Test notification triggered! Check your device.');
    } catch (error) {
      Alert.alert(t('error'), 'Failed to send test notification');
    }
  };

  const handleSignalNotification = async () => {
    try {
      await sendSignalNotification({
        id: 'test-signal-123',
        pair: 'XAU/USD',
        type: 'BUY',
        entry_price: 2345.67,
        status: 'active',
      });
      Alert.alert(t('success'), 'Signal notification triggered!');
    } catch (error) {
      Alert.alert(t('error'), 'Failed to send signal notification');
    }
  };

  const handleAchievementNotification = async () => {
    try {
      await sendAchievementNotification({
        title: 'Winning Streak',
        description: 'You\'ve achieved a 5-day winning streak!',
        type: 'streak',
      });
      Alert.alert(t('success'), 'Achievement notification triggered!');
    } catch (error) {
      Alert.alert(t('error'), 'Failed to send achievement notification');
    }
  };

  const handleCustomNotification = async () => {
    if (!customTitle.trim() || !customMessage.trim()) {
      Alert.alert(t('error'), 'Please enter both title and message');
      return;
    }

    try {
      await createPushNotification({
        type: 'announcement',
        title: customTitle,
        message: customMessage,
        data: {
          custom: true,
          timestamp: new Date().toISOString(),
        },
      });
      Alert.alert(t('success'), 'Custom notification triggered!');
    } catch (error) {
      Alert.alert(t('error'), 'Failed to send custom notification');
    }
  };

  const handleBroadcastNotification = async () => {
    try {
      await sendBroadcastNotification({
        type: 'announcement',
        title: 'Market Update',
        message: 'Gold showing strong bullish momentum this week!',
        data: {
          market: 'gold',
          sentiment: 'bullish',
        },
      });
      Alert.alert(t('success'), 'Broadcast notification sent to all users!');
    } catch (error) {
      Alert.alert(t('error'), 'Failed to send broadcast notification');
    }
  };

  const handleTargetedNotification = async () => {
    if (!targetUserId.trim()) {
      Alert.alert(t('error'), 'Please enter a target user ID');
      return;
    }

    try {
      await sendTargetedNotification(targetUserId, {
        type: 'alert',
        title: 'Personal Alert',
        message: `This is a targeted message for user ${targetUserId}`,
        data: {
          targeted: true,
          user_id: targetUserId,
        },
      });
      Alert.alert(t('success'), `Targeted notification sent to user: ${targetUserId}`);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to send targeted notification');
    }
  };

  const testButtons = [
    {
      id: 'test',
      title: 'Test Notification',
      description: 'Send a basic test notification',
      icon: TestTube,
      color: colors.secondary,
      onPress: handleTestNotification,
    },
    {
      id: 'signal',
      title: 'Signal Alert',
      description: 'Send a trading signal notification',
      icon: TrendingUp,
      color: colors.success,
      onPress: handleSignalNotification,
    },
    {
      id: 'achievement',
      title: 'Achievement',
      description: 'Send an achievement notification',
      icon: Award,
      color: colors.warning,
      onPress: handleAchievementNotification,
    },
    {
      id: 'broadcast',
      title: 'Broadcast',
      description: 'Send notification to all users',
      icon: Users,
      color: colors.secondary,
      onPress: handleBroadcastNotification,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    subtitle: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    testButtonIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    testButtonContent: {
      flex: 1,
    },
    testButtonTitle: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    testButtonDescription: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    sendIcon: {
      marginLeft: 8,
    },
    customSection: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    customButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    customButtonText: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
      marginRight: 8,
    },
    warning: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.warning}15`,
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
    },
    warningIcon: {
      marginRight: 8,
    },
    warningText: {
      flex: 1,
      fontSize: fontSizes.small,
      color: colors.warning,
      fontFamily: 'Inter-Regular',
    },
    infoBox: {
      backgroundColor: `${colors.primary}10`,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    infoText: {
      fontSize: fontSizes.small,
      color: colors.primary,
      fontFamily: 'Inter-Regular',
      lineHeight: 18,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Bell size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>Notification Testing</Text>
          <Text style={styles.subtitle}>Test push notification system</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ✨ Notifications are automatically triggered when inserted into the database! 
          The system uses Supabase triggers to send push notifications instantly.
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {testButtons.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={styles.testButton}
            onPress={button.onPress}
          >
            <View style={[
              styles.testButtonIcon,
              { backgroundColor: `${button.color}20` }
            ]}>
              <button.icon size={20} color={button.color} />
            </View>
            <View style={styles.testButtonContent}>
              <Text style={styles.testButtonTitle}>{button.title}</Text>
              <Text style={styles.testButtonDescription}>{button.description}</Text>
            </View>
            <Send size={16} color={colors.textSecondary} style={styles.sendIcon} />
          </TouchableOpacity>
        ))}

        {/* Custom Notification Section */}
        <View style={styles.customSection}>
          <Text style={styles.sectionTitle}>Custom Notification</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Notification title"
            placeholderTextColor={colors.textSecondary}
            value={customTitle}
            onChangeText={setCustomTitle}
          />
          
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Notification message"
            placeholderTextColor={colors.textSecondary}
            value={customMessage}
            onChangeText={setCustomMessage}
            multiline
            textAlignVertical="top"
          />
          
          <TouchableOpacity style={styles.customButton} onPress={handleCustomNotification}>
            <Text style={styles.customButtonText}>Send Custom</Text>
            <Send size={16} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Targeted Notification Section */}
        <View style={styles.customSection}>
          <Text style={styles.sectionTitle}>Targeted Notification</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Target user ID (e.g., device_123...)"
            placeholderTextColor={colors.textSecondary}
            value={targetUserId}
            onChangeText={setTargetUserId}
          />
          
          <TouchableOpacity style={styles.customButton} onPress={handleTargetedNotification}>
            <User size={16} color={colors.background} style={{ marginRight: 8 }} />
            <Text style={styles.customButtonText}>Send Targeted</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warning}>
          <AlertCircle size={16} color={colors.warning} style={styles.warningIcon} />
          <Text style={styles.warningText}>
            Notifications are automatically sent via database triggers. Check the notification_logs table 
            in Supabase to monitor delivery status and debug any issues.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}