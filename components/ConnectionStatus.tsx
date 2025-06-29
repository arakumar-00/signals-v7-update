import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Wifi, WifiOff, RefreshCw, Database, Globe } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { testSupabaseConnection } from '../lib/supabase';

export default function ConnectionStatus() {
  const { colors, fontSizes } = useTheme();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const rotateAnim = new Animated.Value(0);

  const checkConnection = async () => {
    setIsChecking(true);
    
    // Animate refresh icon
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });

    try {
      const connected = await testSupabaseConnection();
      setIsConnected(connected);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return null; // Still checking initial connection
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusInfo = () => {
    if (isConnected) {
      return {
        icon: Database,
        color: colors.success,
        title: 'Live Data Connected',
        subtitle: 'Real-time signals from Supabase',
        bgColor: `${colors.success}15`,
      };
    } else {
      return {
        icon: Globe,
        color: colors.warning,
        title: 'Demo Mode Active',
        subtitle: 'Using sample data - Connect Supabase for live signals',
        bgColor: `${colors.warning}15`,
      };
    }
  };

  const statusInfo = getStatusInfo();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: statusInfo.bgColor,
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: `${statusInfo.color}30`,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
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
      fontFamily: 'Inter-SemiBold',
      color: statusInfo.color,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    retryButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailsButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.surface,
    },
    detailsButtonText: {
      fontSize: fontSizes.small - 2,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    details: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderTopWidth: 1,
      borderTopColor: `${statusInfo.color}20`,
    },
    detailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    detailLabel: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setShowDetails(!showDetails)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <statusInfo.icon size={18} color={statusInfo.color} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{statusInfo.title}</Text>
          <Text style={styles.subtitle}>{statusInfo.subtitle}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={checkConnection}
            disabled={isChecking}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={16} color={colors.textSecondary} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>
              {isConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Data Source:</Text>
            <Text style={styles.detailValue}>
              {isConnected ? 'Supabase Database' : 'Local Mock Data'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Last Check:</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}