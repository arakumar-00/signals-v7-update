import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Plus, X, Bell, BellOff, Star, StarOff } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import {
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  UserWatchlist,
} from '../lib/analytics';

interface WatchlistManagerProps {
  userId: string;
  onWatchlistChange?: (watchlist: UserWatchlist[]) => void;
}

export default function WatchlistManager({ userId, onWatchlistChange }: WatchlistManagerProps) {
  const { colors, fontSizes } = useTheme();
  const [watchlist, setWatchlist] = useState<UserWatchlist[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPair, setNewPair] = useState('');
  const [priceAlertHigh, setPriceAlertHigh] = useState('');
  const [priceAlertLow, setPriceAlertLow] = useState('');
  const [loading, setLoading] = useState(true);

  const availablePairs = [
    'XAU/USD', 'XAG/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY',
    'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP', 'GBP/JPY'
  ];

  useEffect(() => {
    loadWatchlist();
  }, [userId]);

  const loadWatchlist = async () => {
    try {
      const data = await getUserWatchlist(userId);
      setWatchlist(data);
      onWatchlistChange?.(data);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!newPair.trim()) {
      Alert.alert('Error', 'Please select a trading pair');
      return;
    }

    const success = await addToWatchlist(userId, newPair, {
      notificationEnabled: true,
      priceAlertHigh: priceAlertHigh ? parseFloat(priceAlertHigh) : undefined,
      priceAlertLow: priceAlertLow ? parseFloat(priceAlertLow) : undefined,
    });

    if (success) {
      setShowAddModal(false);
      setNewPair('');
      setPriceAlertHigh('');
      setPriceAlertLow('');
      loadWatchlist();
    } else {
      Alert.alert('Error', 'Failed to add pair to watchlist');
    }
  };

  const handleRemoveFromWatchlist = async (pair: string) => {
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to remove ${pair} from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFromWatchlist(userId, pair);
            if (success) {
              loadWatchlist();
            } else {
              Alert.alert('Error', 'Failed to remove pair from watchlist');
            }
          },
        },
      ]
    );
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
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4,
    },
    addButtonText: {
      color: colors.background,
      fontSize: fontSizes.small,
      fontFamily: 'Inter-SemiBold',
    },
    watchlistItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pairInfo: {
      flex: 1,
    },
    pairName: {
      fontSize: fontSizes.medium,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    alertInfo: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginTop: 16,
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
      padding: 20,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    pairSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pairOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pairOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pairOptionText: {
      fontSize: fontSizes.small,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    pairOptionTextSelected: {
      color: colors.background,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-SemiBold',
    },
    cancelButtonText: {
      color: colors.text,
    },
    confirmButtonText: {
      color: colors.background,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Loading watchlist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Watchlist</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={16} color={colors.background} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {watchlist.length === 0 ? (
        <View style={styles.emptyState}>
          <Star size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            No pairs in your watchlist yet.{'\n'}Add some to get started!
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {watchlist.map((item) => (
            <View key={item.id} style={styles.watchlistItem}>
              <View style={styles.pairInfo}>
                <Text style={styles.pairName}>{item.pair}</Text>
                {(item.price_alert_high || item.price_alert_low) && (
                  <Text style={styles.alertInfo}>
                    Alerts: {item.price_alert_low && `Low ${item.price_alert_low}`}
                    {item.price_alert_low && item.price_alert_high && ' • '}
                    {item.price_alert_high && `High ${item.price_alert_high}`}
                  </Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                  {item.notification_enabled ? (
                    <Bell size={16} color={colors.primary} />
                  ) : (
                    <BellOff size={16} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemoveFromWatchlist(item.pair)}
                >
                  <X size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add to Watchlist Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Watchlist</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Trading Pair</Text>
              <View style={styles.pairSelector}>
                {availablePairs
                  .filter(pair => !watchlist.some(w => w.pair === pair))
                  .map((pair) => (
                    <TouchableOpacity
                      key={pair}
                      style={[
                        styles.pairOption,
                        newPair === pair && styles.pairOptionSelected,
                      ]}
                      onPress={() => setNewPair(pair)}
                    >
                      <Text
                        style={[
                          styles.pairOptionText,
                          newPair === pair && styles.pairOptionTextSelected,
                        ]}
                      >
                        {pair}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>High Price Alert (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter high price alert"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={priceAlertHigh}
                onChangeText={setPriceAlertHigh}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Low Price Alert (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter low price alert"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={priceAlertLow}
                onChangeText={setPriceAlertLow}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddToWatchlist}
              >
                <Text style={[styles.buttonText, styles.confirmButtonText]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}