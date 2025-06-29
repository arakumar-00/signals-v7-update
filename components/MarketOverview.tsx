import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchMarketData, subscribeToMarketData, MarketData } from '../lib/database';

export default function MarketOverview() {
  const { colors, fontSizes } = useTheme();
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchMarketData().then((data) => {
      setMarketData(data);
      setLoading(false);
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToMarketData((data) => {
      setMarketData(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const renderMarketItem = (item: MarketData) => (
    <View key={item.id} style={styles.marketItem}>
      <Text style={styles.pairText}>{item.pair}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>
          {item.pair.includes('XAU') || item.pair.includes('XAG')
            ? item.price.toFixed(2)
            : item.price.toFixed(4)}
        </Text>
        <View style={styles.changeContainer}>
          {item.change >= 0 ? (
            <TrendingUp size={12} color={colors.success} />
          ) : (
            <TrendingDown size={12} color={colors.error} />
          )}
          <Text style={[
            styles.changeText,
            item.change >= 0 ? styles.profitText : styles.lossText
          ]}>
            {item.change >= 0 ? '+' : ''}{item.change_percent.toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    title: {
      fontSize: fontSizes.medium,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    scrollContent: {
      paddingHorizontal: 20,
      gap: 12,
    },
    marketItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      minWidth: 120,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pairText: {
      fontSize: fontSizes.medium,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 6,
    },
    priceContainer: {
      gap: 4,
    },
    priceText: {
      fontSize: fontSizes.small,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    changeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    changeText: {
      fontSize: fontSizes.small - 2,
      fontFamily: 'Inter-SemiBold',
    },
    profitText: {
      color: colors.success,
    },
    lossText: {
      color: colors.error,
    },
    loadingContainer: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Market Overview</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market Overview</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {marketData.map(renderMarketItem)}
      </ScrollView>
    </View>
  );
}