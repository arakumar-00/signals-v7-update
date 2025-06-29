import { Tabs } from 'expo-router';
import { TrendingUp, Wallet, ChartBar as BarChart3, User, PhoneIncoming as HomeIcon, Calculator as CalculatorIcon, View, Settings2, Bell } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import NotificationSheet from '@/components/NotificationSheet';
import SetupGuide from '@/components/SetupGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors, isDark, fontSizes } = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ size, color }) => (
            <HomeIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="signals"
        options={{
          title: t('signals'),
          tabBarIcon: ({ size, color }) => (
            <TrendingUp size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: t('calculator'),
          tabBarIcon: ({ size, color }) => (
            <CalculatorIcon size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ size, color }) => (
            <Settings2 size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}