import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calculator, TrendingUp, DollarSign, Target, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getForexPrice,
  calculatePips,
  calculateLotSize,
  calculatePnL,
  SUPPORTED_PAIRS,
  PipCalculatorResult,
  LotSizeResult,
  PnLResult,
} from '../../lib/forex';

type CalculatorTab = 'pip' | 'lot' | 'pnl';

export default function CalculatorScreen() {
  const { colors, fontSizes } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<CalculatorTab>('pip');
  const [selectedPair, setSelectedPair] = useState('XAU/USD');
  const [showPairPicker, setShowPairPicker] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Pip Calculator State
  const [pipData, setPipData] = useState({
    entryPrice: '',
    exitPrice: '',
    type: 'BUY' as 'BUY' | 'SELL',
  });
  const [pipResult, setPipResult] = useState<PipCalculatorResult | null>(null);

  // Lot Size Calculator State
  const [lotData, setLotData] = useState({
    accountBalance: '',
    riskPercent: '',
    stopLossPips: '',
  });
  const [lotResult, setLotResult] = useState<LotSizeResult | null>(null);

  // PnL Calculator State
  const [pnlData, setPnlData] = useState({
    lotSize: '',
    entryPrice: '',
    exitPrice: '',
    type: 'BUY' as 'BUY' | 'SELL',
  });
  const [pnlResult, setPnlResult] = useState<PnLResult | null>(null);

  // Fetch live price when pair changes
  useEffect(() => {
    fetchLivePrice();
  }, [selectedPair]);

  const fetchLivePrice = async () => {
    setLoading(true);
    try {
      console.log('Fetching price for:', selectedPair);
      const price = await getForexPrice(selectedPair);
      console.log('Fetched price:', price);
      setLivePrice(price);
    } catch (error) {
      console.error('Error fetching live price:', error);
      setLivePrice(null);
    } finally {
      setLoading(false);
    }
  };

  const calculatePipValue = () => {
    const entry = parseFloat(pipData.entryPrice);
    const exit = parseFloat(pipData.exitPrice);

    if (isNaN(entry) || isNaN(exit)) {
      Alert.alert(t('error'), 'Please enter valid prices');
      return;
    }

    try {
      const result = calculatePips(selectedPair, entry, exit, pipData.type);
      setPipResult(result);
    } catch (error) {
      console.error('Error calculating pips:', error);
      Alert.alert(t('error'), 'Failed to calculate pip value');
    }
  };

  const calculateLotSizeValue = () => {
    const balance = parseFloat(lotData.accountBalance);
    const risk = parseFloat(lotData.riskPercent);
    const stopLoss = parseFloat(lotData.stopLossPips);

    if (isNaN(balance) || isNaN(risk) || isNaN(stopLoss)) {
      Alert.alert(t('error'), 'Please enter valid values');
      return;
    }

    try {
      const pipValue = selectedPair.includes('JPY') ? 10 : 10;
      const result = calculateLotSize(balance, risk, stopLoss, pipValue);
      setLotResult(result);
    } catch (error) {
      console.error('Error calculating lot size:', error);
      Alert.alert(t('error'), 'Failed to calculate lot size');
    }
  };

  const calculatePnLValue = () => {
    const lotSize = parseFloat(pnlData.lotSize);
    const entry = parseFloat(pnlData.entryPrice);
    const exit = parseFloat(pnlData.exitPrice);

    if (isNaN(lotSize) || isNaN(entry) || isNaN(exit)) {
      Alert.alert(t('error'), 'Please enter valid values');
      return;
    }

    try {
      const result = calculatePnL(selectedPair, lotSize, entry, exit, pnlData.type);
      setPnlResult(result);
    } catch (error) {
      console.error('Error calculating P&L:', error);
      Alert.alert(t('error'), 'Failed to calculate P&L');
    }
  };

  const tabs = [
    { id: 'pip' as CalculatorTab, title: t('pipCalculator'), icon: Target },
    { id: 'lot' as CalculatorTab, title: t('lotSize'), icon: Calculator },
    { id: 'pnl' as CalculatorTab, title: t('pnlCalculator'), icon: TrendingUp },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    title: {
      fontSize: fontSizes.title + 4,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 16,
    },
    pairSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    pairText: {
      flex: 1,
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    livePrice: {
      fontSize: fontSizes.medium,
      color: colors.primary,
      fontFamily: 'Inter-Medium',
      marginRight: 8,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
      gap: 6,
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
      textAlign: 'center',
    },
    tabTextActive: {
      color: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    calculatorCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
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
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    typeSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    typeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeButtonText: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    typeButtonTextActive: {
      color: colors.background,
    },
    calculateButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    calculateButtonText: {
      fontSize: fontSizes.medium,
      fontWeight: 'bold',
      color: colors.background,
      fontFamily: 'Inter-Bold',
    },
    resultCard: {
      backgroundColor: `${colors.primary}10`,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    resultTitle: {
      fontSize: fontSizes.medium,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: 'Inter-Bold',
      marginBottom: 12,
    },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    resultLabel: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    resultValue: {
      fontSize: fontSizes.medium,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    resultCardNegative: {
      backgroundColor: `${colors.error}10`,
      borderColor: `${colors.error}30`,
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
      width: '90%',
      maxHeight: '70%',
      overflow: 'hidden',
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
    },
    pairOption: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pairOptionText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
  });

  const renderPipCalculator = () => (
    <View style={styles.calculatorCard}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('tradeType')}</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              pipData.type === 'BUY' && styles.typeButtonActive,
            ]}
            onPress={() => setPipData(prev => ({ ...prev, type: 'BUY' }))}
          >
            <Text style={[
              styles.typeButtonText,
              pipData.type === 'BUY' && styles.typeButtonTextActive,
            ]}>
              {t('buy')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              pipData.type === 'SELL' && styles.typeButtonActive,
            ]}
            onPress={() => setPipData(prev => ({ ...prev, type: 'SELL' }))}
          >
            <Text style={[
              styles.typeButtonText,
              pipData.type === 'SELL' && styles.typeButtonTextActive,
            ]}>
              {t('sell')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('entryPrice')}</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter entry price"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={pipData.entryPrice}
          onChangeText={(text) => setPipData(prev => ({ ...prev, entryPrice: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Exit Price</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter exit price"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={pipData.exitPrice}
          onChangeText={(text) => setPipData(prev => ({ ...prev, exitPrice: text }))}
        />
      </View>

      <TouchableOpacity style={styles.calculateButton} onPress={calculatePipValue}>
        <Text style={styles.calculateButtonText}>{t('calculatePips')}</Text>
      </TouchableOpacity>

      {pipResult && (
        <View style={[styles.resultCard, pipResult.totalPips < 0 && styles.resultCardNegative]}>
          <Text style={styles.resultTitle}>Pip Calculation Result</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('totalPips')}:</Text>
            <Text style={[styles.resultValue, pipResult.totalPips < 0 && { color: colors.error }]}>
              {pipResult.totalPips}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('pipValue')}:</Text>
            <Text style={styles.resultValue}>{pipResult.pipValue}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('priceDifference')}:</Text>
            <Text style={[styles.resultValue, pipResult.profit < 0 && { color: colors.error }]}>
              ${pipResult.profit.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderLotSizeCalculator = () => (
    <View style={styles.calculatorCard}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Account Balance ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter account balance"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={lotData.accountBalance}
          onChangeText={(text) => setLotData(prev => ({ ...prev, accountBalance: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Risk Percentage (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter risk percentage"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={lotData.riskPercent}
          onChangeText={(text) => setLotData(prev => ({ ...prev, riskPercent: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Stop Loss (Pips)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter stop loss in pips"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={lotData.stopLossPips}
          onChangeText={(text) => setLotData(prev => ({ ...prev, stopLossPips: text }))}
        />
      </View>

      <TouchableOpacity style={styles.calculateButton} onPress={calculateLotSizeValue}>
        <Text style={styles.calculateButtonText}>{t('calculateLotSize')}</Text>
      </TouchableOpacity>

      {lotResult && (
        <View style={[styles.resultCard, lotResult.lotSize < 0 && styles.resultCardNegative]}>
          <Text style={styles.resultTitle}>Lot Size Calculation</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('recommendedLotSize')}:</Text>
            <Text style={styles.resultValue}>{lotResult.lotSize}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('positionSize')}:</Text>
            <Text style={styles.resultValue}>{lotResult.positionSize.toLocaleString()}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('riskAmount')}:</Text>
            <Text style={styles.resultValue}>${lotResult.margin.toFixed(2)}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderPnLCalculator = () => (
    <View style={styles.calculatorCard}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('tradeType')}</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              pnlData.type === 'BUY' && styles.typeButtonActive,
            ]}
            onPress={() => setPnlData(prev => ({ ...prev, type: 'BUY' }))}
          >
            <Text style={[
              styles.typeButtonText,
              pnlData.type === 'BUY' && styles.typeButtonTextActive,
            ]}>
              {t('buy')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              pnlData.type === 'SELL' && styles.typeButtonActive,
            ]}
            onPress={() => setPnlData(prev => ({ ...prev, type: 'SELL' }))}
          >
            <Text style={[
              styles.typeButtonText,
              pnlData.type === 'SELL' && styles.typeButtonTextActive,
            ]}>
              {t('sell')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Lot Size</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter lot size"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={pnlData.lotSize}
          onChangeText={(text) => setPnlData(prev => ({ ...prev, lotSize: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('entryPrice')}</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter entry price"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={pnlData.entryPrice}
          onChangeText={(text) => setPnlData(prev => ({ ...prev, entryPrice: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Exit Price</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter exit price"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={pnlData.exitPrice}
          onChangeText={(text) => setPnlData(prev => ({ ...prev, exitPrice: text }))}
        />
      </View>

      <TouchableOpacity style={styles.calculateButton} onPress={calculatePnLValue}>
        <Text style={styles.calculateButtonText}>{t('calculatePnl')}</Text>
      </TouchableOpacity>

      {pnlResult && (
        <View style={[styles.resultCard, pnlResult.profitPercent < 0 && styles.resultCardNegative]}>
          <Text style={styles.resultTitle}>P&L Calculation Result</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('profitLoss')}:</Text>
            <Text style={[
              styles.resultValue,
              { color: pnlResult.profit >= 0 ? colors.success : colors.error }
            ]}>
              ${pnlResult.profit}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('profitPercent')}:</Text>
            <Text style={[
              styles.resultValue,
              { color: pnlResult.profitPercent >= 0 ? colors.success : colors.error }
            ]}>
              {pnlResult.profitPercent}%
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{t('pips')}:</Text>
            <Text style={styles.resultValue}>{pnlResult.pips}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('calculatorTitle')}</Text>

        <TouchableOpacity
          style={styles.pairSelector}
          onPress={() => setShowPairPicker(true)}
        >
          <Text style={styles.pairText}>{selectedPair}</Text>

          {loading ? (
            <Text style={styles.livePrice}>{t('loading')}</Text>
          ) : livePrice !== null ? (
            <Text style={styles.livePrice}>
              ${livePrice.toFixed(2)}
            </Text>
          ) : (
            <Text style={[styles.livePrice, { color: colors.textSecondary }]}>
              {t('priceUnavailable')}
            </Text>
          )}

          <ChevronDown size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <tab.icon
              size={16}
              color={activeTab === tab.id ? colors.background : colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'pip' && renderPipCalculator()}
        {activeTab === 'lot' && renderLotSizeCalculator()}
        {activeTab === 'pnl' && renderPnLCalculator()}
      </ScrollView>

      {/* Pair Picker Modal */}
      {showPairPicker && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Trading Pair</Text>
            </View>
            <ScrollView>
              {SUPPORTED_PAIRS.map((pair) => (
                <TouchableOpacity
                  key={pair}
                  style={styles.pairOption}
                  onPress={() => {
                    setSelectedPair(pair);
                    setShowPairPicker(false);
                  }}
                >
                  <Text style={styles.pairOptionText}>{pair}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}