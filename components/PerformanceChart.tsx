import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { calculatePerformanceMetrics, PerformanceMetrics } from '../lib/analytics';

const screenWidth = Dimensions.get('window').width;

export default function PerformanceChart() {
  const { colors, fontSizes } = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await calculatePerformanceMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample chart data (replace with real data from analytics)
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [1200, 1450, 1380, 1650, 1820, 2100],
        color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const winRateData = {
    labels: ['Win', 'Loss'],
    datasets: [
      {
        data: [metrics?.winRate || 0, 100 - (metrics?.winRate || 0)],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
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
    title: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 16,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    metricCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricValue: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginTop: 8,
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    chartContainer: {
      marginVertical: 16,
      borderRadius: 16,
      overflow: 'hidden',
    },
    loadingText: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Regular',
      padding: 20,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading performance data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Performance Analytics</Text>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Target size={24} color={colors.primary} />
          <Text style={styles.metricValue}>{metrics?.totalSignals || 0}</Text>
          <Text style={styles.metricLabel}>Total Signals</Text>
        </View>

        <View style={styles.metricCard}>
          <Award size={24} color={colors.success} />
          <Text style={styles.metricValue}>{(metrics?.winRate || 0).toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>Win Rate</Text>
        </View>

        <View style={styles.metricCard}>
          <TrendingUp size={24} color={colors.secondary} />
          <Text style={styles.metricValue}>${(metrics?.totalPnL || 0).toFixed(0)}</Text>
          <Text style={styles.metricLabel}>Total P&L</Text>
        </View>

        <View style={styles.metricCard}>
          <TrendingDown size={24} color={colors.warning} />
          <Text style={styles.metricValue}>{(metrics?.riskRewardRatio || 0).toFixed(1)}</Text>
          <Text style={styles.metricLabel}>Avg R:R</Text>
        </View>
      </View>

      {/* P&L Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 80}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            borderRadius: 16,
          }}
        />
      </View>

      {/* Win Rate Chart */}
      <View style={styles.chartContainer}>
        <BarChart
          data={winRateData}
          width={screenWidth - 80}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => colors.primary,
          }}
          style={{
            borderRadius: 16,
          }}
        />
      </View>
    </ScrollView>
  );
}