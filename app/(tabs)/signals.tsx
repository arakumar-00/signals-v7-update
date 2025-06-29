import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import SignalCard from '../../components/SignalCard';
import { subscribeToSignals } from '../../supabase/signals';
import { Signal } from '../../lib/supabase';
import { Award, ChartBar, DollarSign, Target, TrendingDown, TrendingUp } from 'lucide-react-native';

export default function SignalsScreen() {
  const { colors, fontSizes } = useTheme();
  const { t } = useLanguage();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleSignalsUpdate = useCallback((newSignals: Signal[]) => {
    setSignals(newSignals);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSignals(handleSignalsUpdate);
    return () => unsubscribe?.();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const styles = StyleSheet.create({
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      flexBasis: '48%',
    },
    statValue: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    statCardLarge: {
      flexBasis: '100%',
    },
  });

  // Calculate portfolio stats from signals
  const closedSignals = signals.filter(s => s.status === 'closed');
  const activeSignals = signals.filter(s => s.status === 'active');
  const profitTrades = closedSignals.filter(s => (s.pnl || 0) > 0).length;
  const lossTrades = closedSignals.length - profitTrades;

  const portfolioStats = {
    totalTrades: closedSignals.length,
    activeTrades: activeSignals.length,
    profitTrades,
    lossTrades,
  };

  const filteredSignals = signals.filter(signal =>
    filter === 'all' ? true : signal.status === filter
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 20 }}>
          <Text style={{
            fontSize: fontSizes.title + 4,
            fontWeight: 'bold',
            color: colors.text,
            fontFamily: 'Inter-Bold',
            marginBottom: 12
          }}>{t('signalsTitle')}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Target size={24} color={colors.success} />
              <Text style={styles.statValue}>{portfolioStats.totalTrades}</Text>
              <Text style={styles.statLabel}>{t('totalTrades')}</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color={colors.success} />
              <Text style={styles.statValue}>{portfolioStats.profitTrades}</Text>
              <Text style={styles.statLabel}>{t('profitTrades')}</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingDown size={24} color={colors.error} />
              <Text style={styles.statValue}>{portfolioStats.lossTrades}</Text>
              <Text style={styles.statLabel}>{t('lossTrades')}</Text>
            </View>
            <View style={styles.statCard}>
              <ChartBar size={24} color={colors.primary} />
              <Text style={styles.statValue}>{activeSignals.length}</Text>
              <Text style={styles.statLabel}>{t('activeTrades')}</Text>
            </View>
          </View>

          {/* Filter Buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
            {['all', 'active', 'closed'].map(f => (
              <TouchableOpacity
                key={f}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: filter === f ? colors.primary : colors.surface
                }}
                onPress={() => setFilter(f)}
              >
                <Text style={{
                  color: filter === f ? colors.background : colors.text,
                  fontFamily: 'Inter-Medium',
                  fontSize: fontSizes.medium
                }}>
                  {t(f.toUpperCase().toLowerCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Signal Cards */}
          {filteredSignals.map(signal => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}