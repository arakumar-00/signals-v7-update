import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Database, RefreshCw, TrendingUp, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Play, ChartBar as BarChart3 } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  getSystemStatus,
  getPriceSummary,
  triggerManualUpdate,
  SystemStatus,
  PriceSummary,
} from '../lib/backend';

export default function BackendMonitor() {
  const { colors, fontSizes } = useTheme();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [priceSummary, setPriceSummary] = useState<PriceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [status, prices] = await Promise.all([
        getSystemStatus(),
        getPriceSummary(),
      ]);

      setSystemStatus(status);
      setPriceSummary(prices);
    } catch (error) {
      console.error('Error loading backend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualTrigger = async (type: 'signals' | 'indicators' | 'both') => {
    setTriggering(type);
    
    try {
      const success = await triggerManualUpdate(type);
      
      if (success) {
        Alert.alert('Success', `${type} update triggered successfully`);
        // Refresh data after a short delay
        setTimeout(loadData, 2000);
      } else {
        Alert.alert('Error', `Failed to trigger ${type} update`);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setTriggering(null);
    }
  };

  const getStatusColor = (health: string) => {
    switch (health) {
      case 'healthy': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (health: string) => {
    switch (health) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Clock;
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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
    refreshButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusTitle: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      flex: 1,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    statusText: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Medium',
      textTransform: 'capitalize',
    },
    statusDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    statusLabel: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    statusValue: {
      fontSize: fontSizes.small,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    triggerSection: {
      marginBottom: 16,
    },
    triggerTitle: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 12,
    },
    triggerButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    triggerButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 6,
    },
    triggerButtonDisabled: {
      opacity: 0.6,
    },
    triggerButtonText: {
      fontSize: fontSizes.small,
      color: colors.background,
      fontFamily: 'Inter-SemiBold',
    },
    pricesSection: {
      marginTop: 16,
    },
    pricesTitle: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 12,
    },
    priceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pairName: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    priceValue: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    priceChange: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Medium',
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
    loadingText: {
      color: colors.text,
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Medium',
      marginTop: 8,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading backend status...</Text>
        </View>
      </View>
    );
  }

  const StatusIcon = systemStatus ? getStatusIcon(systemStatus.system_health) : Clock;
  const statusColor = systemStatus ? getStatusColor(systemStatus.system_health) : colors.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Database size={18} color={colors.primary} />
        </View>
        <Text style={styles.title}>Backend Monitor</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <RefreshCw size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* System Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>System Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <StatusIcon size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {systemStatus?.system_health || 'Unknown'}
              </Text>
            </View>
          </View>

          {systemStatus && (
            <>
              <View style={styles.statusDetail}>
                <Text style={styles.statusLabel}>Last Price Update:</Text>
                <Text style={styles.statusValue}>
                  {formatTime(systemStatus.last_price_update)}
                </Text>
              </View>
              <View style={styles.statusDetail}>
                <Text style={styles.statusLabel}>Last Indicator Update:</Text>
                <Text style={styles.statusValue}>
                  {formatTime(systemStatus.last_indicator_update)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Manual Triggers */}
        <View style={styles.triggerSection}>
          <Text style={styles.triggerTitle}>Manual Triggers</Text>
          <View style={styles.triggerButtons}>
            <TouchableOpacity
              style={[
                styles.triggerButton,
                triggering === 'signals' && styles.triggerButtonDisabled,
              ]}
              onPress={() => handleManualTrigger('signals')}
              disabled={!!triggering}
            >
              {triggering === 'signals' ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <TrendingUp size={14} color={colors.background} />
              )}
              <Text style={styles.triggerButtonText}>Signals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.triggerButton,
                triggering === 'indicators' && styles.triggerButtonDisabled,
              ]}
              onPress={() => handleManualTrigger('indicators')}
              disabled={!!triggering}
            >
              {triggering === 'indicators' ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <BarChart3 size={14} color={colors.background} />
              )}
              <Text style={styles.triggerButtonText}>Indicators</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.triggerButton,
                triggering === 'both' && styles.triggerButtonDisabled,
              ]}
              onPress={() => handleManualTrigger('both')}
              disabled={!!triggering}
            >
              {triggering === 'both' ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Play size={14} color={colors.background} />
              )}
              <Text style={styles.triggerButtonText}>Both</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Prices */}
        {priceSummary.length > 0 && (
          <View style={styles.pricesSection}>
            <Text style={styles.pricesTitle}>Live Prices</Text>
            {priceSummary.map((price) => (
              <View key={price.id} style={styles.priceItem}>
                <Text style={styles.pairName}>{price.pair}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.priceValue}>
                    ${price.current_price.toFixed(price.pair.includes('XAU') ? 2 : 4)}
                  </Text>
                  <Text style={[
                    styles.priceChange,
                    { color: price.change_percent >= 0 ? colors.success : colors.error }
                  ]}>
                    {price.change_percent >= 0 ? '+' : ''}{price.change_percent.toFixed(2)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}