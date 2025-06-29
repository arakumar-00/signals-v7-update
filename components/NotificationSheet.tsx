import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Bell, TrendingUp, TrendingDown, Award, CircleAlert as AlertCircle, Eye as EyeIcon } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchNotifications, NotificationData } from '../lib/database';

interface NotificationSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationSheet({ visible, onClose }: NotificationSheetProps) {
  const { colors, fontSizes } = useTheme();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signal':
        return <TrendingUp size={20} color={colors.primary} />;
      case 'achievement':
        return <Award size={20} color={colors.warning} />;
      case 'announcement':
        return <Bell size={20} color={colors.secondary} />;
      case 'alert':
        return <AlertCircle size={20} color={colors.error} />;
      default:
        return <Bell size={20} color={colors.textSecondary} />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diff = now.getTime() - notificationTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: fontSizes.title,
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
    content: {
      flex: 1,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      color: colors.text,
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Medium',
      marginTop: 16,
    },
    notificationItem: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    notificationItemUnread: {
      backgroundColor: `${colors.primary}10`,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginBottom: 4,
    },
    notificationTime: {
      fontSize: fontSizes.small - 2,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginLeft: 8,
      marginTop: 4,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginTop: 16,
    },
    sheetWrapper: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
      maxHeight: '80%',
      width: '100%',
      flex: 1,
    },
    sheetContainer: {
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    notificationTimeContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 4,
    },
    reached: {
      fontSize: fontSizes.small,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    }
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheetWrapper}>
          <SafeAreaView style={styles.sheetContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Notifications</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading notifications...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {notifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Bell size={48} color={colors.textSecondary} />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                  </View>
                ) : (
                  notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notificationItem,
                        notification.status === 'pending' && styles.notificationItemUnread,
                      ]}
                    >
                      <View style={styles.iconContainer}>
                        {getNotificationIcon(notification.type)}
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                        <View style={styles.notificationTimeContainer}>
                          <Text style={styles.notificationTime}>
                            {getTimeAgo(notification.created_at)}
                          </Text>
                          <Text style={styles.reached}>
                            {Math.floor(Math.random() * 50) + 10} <EyeIcon size={16} color={colors.textSecondary} />
                          </Text>
                        </View>
                      </View>
                      {notification.status === 'pending' && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}