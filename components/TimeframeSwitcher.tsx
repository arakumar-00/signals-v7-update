// TimeframeSwitcher.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface TimeframeSwitcherProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export default function TimeframeSwitcher({
  selectedTimeframe,
  onTimeframeChange,
}: TimeframeSwitcherProps) {
  const { colors, fontSizes } = useTheme();

  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D', '1W'];

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    scrollContainer: {
      paddingHorizontal: 20,
    },
    timeframeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    timeframeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeframeText: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    timeframeTextActive: {
      color: colors.background,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {timeframes.map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.timeframeButtonActive,
            ]}
            onPress={() => onTimeframeChange(timeframe)}
          >
            <Text
              style={[
                styles.timeframeText,
                selectedTimeframe === timeframe && styles.timeframeTextActive,
              ]}
            >
              {timeframe}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
