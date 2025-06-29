import { supabase } from './supabase';

// Analytics interfaces
export interface SignalAnalytics {
  id: string;
  signal_id: string;
  entry_time: string;
  exit_time?: string;
  duration_minutes?: number;
  max_profit: number;
  max_drawdown: number;
  final_pnl: number;
  pips_gained: number;
  win_rate_contribution: number;
  risk_reward_actual?: number;
  slippage: number;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetrics {
  totalSignals: number;
  winRate: number;
  totalPnL: number;
  averagePnL: number;
  bestSignal: number;
  worstSignal: number;
  averageDuration: number;
  riskRewardRatio: number;
}

// Fetch signal analytics
export async function fetchSignalAnalytics(signalId?: string): Promise<SignalAnalytics[]> {
  try {
    let query = supabase
      .from('signal_analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (signalId) {
      query = query.eq('signal_id', signalId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching signal analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Network error fetching signal analytics:', error);
    return [];
  }
}

// Calculate performance metrics
export async function calculatePerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    const { data: analytics, error } = await supabase
      .from('signal_analytics')
      .select('*')
      .not('final_pnl', 'is', null);

    if (error) {
      console.error('Error calculating performance metrics:', error);
      return getDefaultMetrics();
    }

    if (!analytics || analytics.length === 0) {
      return getDefaultMetrics();
    }

    const totalSignals = analytics.length;
    const winningSignals = analytics.filter(a => a.final_pnl > 0);
    const winRate = (winningSignals.length / totalSignals) * 100;
    const totalPnL = analytics.reduce((sum, a) => sum + a.final_pnl, 0);
    const averagePnL = totalPnL / totalSignals;
    const bestSignal = Math.max(...analytics.map(a => a.final_pnl));
    const worstSignal = Math.min(...analytics.map(a => a.final_pnl));
    const averageDuration = analytics
      .filter(a => a.duration_minutes)
      .reduce((sum, a) => sum + (a.duration_minutes || 0), 0) / analytics.length;
    
    const validRRSignals = analytics.filter(a => a.risk_reward_actual);
    const riskRewardRatio = validRRSignals.length > 0
      ? validRRSignals.reduce((sum, a) => sum + (a.risk_reward_actual || 0), 0) / validRRSignals.length
      : 0;

    return {
      totalSignals,
      winRate,
      totalPnL,
      averagePnL,
      bestSignal,
      worstSignal,
      averageDuration,
      riskRewardRatio,
    };
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return getDefaultMetrics();
  }
}

// Helper function for default metrics
function getDefaultMetrics(): PerformanceMetrics {
  return {
    totalSignals: 0,
    winRate: 0,
    totalPnL: 0,
    averagePnL: 0,
    bestSignal: 0,
    worstSignal: 0,
    averageDuration: 0,
    riskRewardRatio: 0,
  };
}