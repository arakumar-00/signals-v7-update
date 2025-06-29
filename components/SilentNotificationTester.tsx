import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Bell, Play, Settings, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { silentNotificationHandler, SilentNotificationType } from '../lib/silentNotificationHandler';
import { backgroundSyncManager } from '../lib/backgroundSyncManager';
import { createPushNotification } from '../lib/pushNotifications';

export default function SilentNotificationTester() {
  const { colors, fontSizes } = useTheme();
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const silentNotificationTypes: { type: SilentNotificationType; label: string; description: string }[] = [
    {
      type: 'background-sync',
      label: 'Background Sync',
      description: 'Sync all data in background without UI'
    },
    {
      type: 'price-update',
      label: 'Price Update',
      description: 'Update market prices silently'
    },
    {
      type: 'signal-refresh',
      label: 'Signal Refresh',
      description: 'Refresh trading signals cache'
    },
    {
      type: 'cache-invalidate',
      label: 'Cache Invalidate',
      description: 'Clear and refresh app cache'
    },
    {
      type: 'system-maintenance',
      label: 'System Maintenance',
      description: 'Perform system maintenance tasks'
    },
    {
      type: 'market-data-sync',
      label: 'Market Data Sync',
      description: 'Sync market data from external sources'
    },
  ];

  const handleTestSilentNotification = async (type: SilentNotificationType) => {
    setTesting(type);
    
    try {
      console.log(`🧪 Testing silent notification: ${type}`);
      
      // Test local silent handling
      const result = await silentNotificationHandler.handleSilentNotification({
        type,
        silent: true,
        timestamp: new Date().toISOString(),
        payload: {
          action: 'test',
          data: { test: true },
        },
      });

      // Add result to results list
      setResults(prev => [{
        type,
        timestamp: new Date().toISOString(),
        success: result.success,
        result: result.result,
        error: result.error,
      }, ...prev.slice(0, 9)]); // Keep last 10 results

      console.log(`✅ Silent notification test completed:`, result);
      
    } catch (error) {
      console.error(`❌ Silent notification test failed:`, error);
      Alert.alert('Test Failed', `Error testing ${type}: ${error}`);
    } finally {
      setTesting(null);
    }
  };

  const handleTestPushSilentNotification = async (type: SilentNotificationType) => {
    setTesting(`push-${type}`);
    
    try {
      console.log(`🧪 Testing push silent notification: ${type}`);
      
      // Send actual push notification with silent flag
      await createPushNotification({
        type: 'alert',
        title: `Silent Test: ${type}`,
        message: 'This should be processed silently',
        data: {
          type,
          silent: true,
          test: true,
          timestamp: new Date().toISOString(),
        },
      });

      Alert.alert('Push Sent', `Silent push notification sent for ${type}. Check console for processing logs.`);
      
    } catch (error) {
      console.error(`❌ Push silent notification test failed:`, error);
      Alert.alert('Push Failed', `Error sending push for ${type}: ${error}`);
    } finally {
      setTesting(null);
    }
  };

  const handleTestBackgroundSync = async () => {
    setTesting('background-sync-manager');
    
    try {
      console.log('🧪 Testing background sync manager...');
      
      await backgroundSyncManager.triggerManualSync();
      
      Alert.alert('Background Sync', 'Manual background sync triggered successfully!');
      
    } catch (error) {
      console.error('❌ Background sync test failed:', error);
      Alert.alert('Sync Failed', `Error: ${error}`);
    } finally {
      setTesting(null);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

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
      flex: 1,
    },
    subtitle: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 12,
    },
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    testButtonContent: {
      flex: 1,
      marginRight: 12,
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
    testButtonActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      minWidth: 60,
      alignItems: 'center',
    },
    actionButtonSecondary: {
      backgroundColor: colors.secondary,
    },
    actionButtonText: {
      fontSize: fontSizes.small,
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
    },
    syncButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.warning,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    syncButtonText: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 8,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    clearButton: {
      backgroundColor: colors.error,
      borderRadius: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    clearButtonText: {
      fontSize: fontSizes.small,
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
    },
    resultItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    resultType: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    resultStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    resultStatusText: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Medium',
    },
    resultTime: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    resultData: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
    },
    emptyResults: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Regular',
      padding: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Bell size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Silent Notification Tester</Text>
          <Text style={styles.subtitle}>Test background processing without UI alerts</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Background Sync Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Sync Manager</Text>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleTestBackgroundSync}
            disabled={testing === 'background-sync-manager'}
          >
            {testing === 'background-sync-manager' ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Settings size={20} color={colors.background} />
            )}
            <Text style={styles.syncButtonText}>
              {testing === 'background-sync-manager' ? 'Testing...' : 'Test Background Sync'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Silent Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Silent Notification Types</Text>
          {silentNotificationTypes.map((item) => (
            <View key={item.type} style={styles.testButton}>
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>{item.label}</Text>
                <Text style={styles.testButtonDescription}>{item.description}</Text>
              </View>
              <View style={styles.testButtonActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleTestSilentNotification(item.type)}
                  disabled={testing === item.type}
                >
                  {testing === item.type ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={styles.actionButtonText}>Local</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => handleTestPushSilentNotification(item.type)}
                  disabled={testing === `push-${item.type}`}
                >
                  {testing === `push-${item.type}` ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={styles.actionButtonText}>Push</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Test Results */}
        <View style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            {results.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {results.length === 0 ? (
            <Text style={styles.emptyResults}>No test results yet</Text>
          ) : (
            results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultType}>{result.type}</Text>
                  <View style={styles.resultStatus}>
                    {result.success ? (
                      <CheckCircle size={16} color={colors.success} />
                    ) : (
                      <AlertCircle size={16} color={colors.error} />
                    )}
                    <Text style={[
                      styles.resultStatusText,
                      { color: result.success ? colors.success : colors.error }
                    ]}>
                      {result.success ? 'Success' : 'Failed'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.resultTime}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </Text>
                {result.result && (
                  <Text style={styles.resultData}>
                    Result: {JSON.stringify(result.result, null, 2)}
                  </Text>
                )}
                {result.error && (
                  <Text style={[styles.resultData, { color: colors.error }]}>
                    Error: {result.error}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}