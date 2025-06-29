// Forex trading utilities and constants

import { useEffect } from "react";
import { supabase } from "./supabase";

export interface ForexPair {
  symbol: string;
  name: string;
  pipValue: number;
  digits: number;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface PipCalculatorResult {
  totalPips: number;
  pipValue: number;
  profit: number;
}

export interface LotSizeResult {
  lotSize: number;
  positionSize: number;
  margin: number;
}

export interface PnLResult {
  profit: number;
  profitPercent: number;
  pips: number;
}

// Supported trading pairs
export const SUPPORTED_PAIRS = [
  'XAU/USD', // Gold
  'BTC/USD', // Bitcoin
  // 'XAU/USD', 'XAG/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY',
  // 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP', 'GBP/JPY',
  // 'EUR/JPY', 'AUD/JPY', 'CHF/JPY', 'CAD/JPY', 'USD/CHF'
];

// Language options
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

// Forex pair configurations
const FOREX_PAIRS: Record<string, ForexPair> = {
  'XAU/USD': { symbol: 'XAU/USD', name: 'Gold', pipValue: 0.01, digits: 2 },
  'XAG/USD': { symbol: 'XAG/USD', name: 'Silver', pipValue: 0.001, digits: 3 },
  'EUR/USD': { symbol: 'EUR/USD', name: 'Euro/US Dollar', pipValue: 0.0001, digits: 4 },
  'GBP/USD': { symbol: 'GBP/USD', name: 'British Pound/US Dollar', pipValue: 0.0001, digits: 4 },
  'USD/JPY': { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', pipValue: 0.01, digits: 2 },
  'AUD/USD': { symbol: 'AUD/USD', name: 'Australian Dollar/US Dollar', pipValue: 0.0001, digits: 4 },
  'USD/CAD': { symbol: 'USD/CAD', name: 'US Dollar/Canadian Dollar', pipValue: 0.0001, digits: 4 },
  'NZD/USD': { symbol: 'NZD/USD', name: 'New Zealand Dollar/US Dollar', pipValue: 0.0001, digits: 4 },
  'EUR/GBP': { symbol: 'EUR/GBP', name: 'Euro/British Pound', pipValue: 0.0001, digits: 4 },
  'GBP/JPY': { symbol: 'GBP/JPY', name: 'British Pound/Japanese Yen', pipValue: 0.01, digits: 2 },
};


useEffect(() => {
  supabase
    .from('price_summary')
    .select('pair, current_price')
    .then(({ data, error }) => {
      if (error) console.error('Error loading pairs:', error);
      else console.log('Pairs in DB:', data);
    });
}, []);


export async function getForexPrice(pair: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('price_summary')
      .select('current_price')
      .eq('pair', pair) // Exact match: "XAU/USD"
      .maybeSingle();   // Avoid throwing error if row is not found

    if (error) {
      console.error(`Supabase error fetching price for ${pair}:`, error);
      return null;
    }

    if (!data) {
      console.warn(`No price data found for ${pair}`);
      return null;
    }

    return data.current_price ?? null;
  } catch (err) {
    console.error(`Unexpected error fetching ${pair} price:`, err);
    return null;
  }
}




// Calculate pips between two prices
export function calculatePips(
  pair: string,
  entryPrice: number,
  exitPrice: number,
  type: 'BUY' | 'SELL'
): PipCalculatorResult {
  const pairConfig = FOREX_PAIRS[pair];
  if (!pairConfig) {
    throw new Error(`Unsupported pair: ${pair}`);
  }

  const priceDiff = type === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
  const totalPips = Math.round(priceDiff / pairConfig.pipValue);
  const pipValue = pairConfig.pipValue;
  const profit = priceDiff;

  return {
    totalPips,
    pipValue,
    profit,
  };
}

// Calculate lot size based on risk management
export function calculateLotSize(
  accountBalance: number,
  riskPercent: number,
  stopLossPips: number,
  pipValue: number
): LotSizeResult {
  const riskAmount = (accountBalance * riskPercent) / 100;
  const lotSize = riskAmount / (stopLossPips * pipValue);
  const positionSize = lotSize * 100000; // Standard lot size
  const margin = riskAmount;

  return {
    lotSize: Math.round(lotSize * 100) / 100,
    positionSize: Math.round(positionSize),
    margin: Math.round(margin * 100) / 100,
  };
}

// Calculate profit and loss
export function calculatePnL(
  pair: string,
  lotSize: number,
  entryPrice: number,
  exitPrice: number,
  type: 'BUY' | 'SELL'
): PnLResult {
  const pairConfig = FOREX_PAIRS[pair];
  if (!pairConfig) {
    throw new Error(`Unsupported pair: ${pair}`);
  }

  const priceDiff = type === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
  const pips = Math.round(priceDiff / pairConfig.pipValue);
  const profit = priceDiff * lotSize * 100000; // Standard lot calculation
  const profitPercent = (profit / (entryPrice * lotSize * 100000)) * 100;

  return {
    profit: Math.round(profit * 100) / 100,
    profitPercent: Math.round(profitPercent * 100) / 100,
    pips,
  };
}

// Format currency based on pair
export function formatPrice(pair: string, price: number): string {
  const pairConfig = FOREX_PAIRS[pair];
  if (!pairConfig) {
    return price.toFixed(4);
  }
  return price.toFixed(pairConfig.digits);
}

// Get pair configuration
export function getPairConfig(pair: string): ForexPair | null {
  return FOREX_PAIRS[pair] || null;
}

// Validate trading pair
export function isValidPair(pair: string): boolean {
  return SUPPORTED_PAIRS.includes(pair);
}