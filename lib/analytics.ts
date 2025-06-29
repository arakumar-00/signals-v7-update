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

export interface UserWatchlist {
  id: string;
  user_id: string;
  pair: string;
  is_active: boolean;
  notification_enabled: boolean;
  price_alert_high?: number;
  price_alert_low?: number;
  created_at: string;
}

export interface SignalComment {
  id: string;
  signal_id: string;
  user_id: string;
  comment: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  is_verified_trader: boolean;
  likes_count: number;
  created_at: string;
}

export interface TradingSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  signals_viewed: number;
  signals_followed: number;
  total_pnl: number;
  device_type?: string;
  app_version?: string;
  created_at: string;
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

// User watchlist functions
export async function getUserWatchlist(userId: string): Promise<UserWatchlist[]> {
  try {
    const { data, error } = await supabase
      .from('user_watchlists')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user watchlist:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Network error fetching user watchlist:', error);
    return [];
  }
}

export async function addToWatchlist(
  userId: string,
  pair: string,
  options: {
    notificationEnabled?: boolean;
    priceAlertHigh?: number;
    priceAlertLow?: number;
  } = {}
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_watchlists')
      .upsert({
        user_id: userId,
        pair,
        notification_enabled: options.notificationEnabled ?? true,
        price_alert_high: options.priceAlertHigh,
        price_alert_low: options.priceAlertLow,
        is_active: true,
      });

    if (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error adding to watchlist:', error);
    return false;
  }
}

export async function removeFromWatchlist(userId: string, pair: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_watchlists')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('pair', pair);

    if (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error removing from watchlist:', error);
    return false;
  }
}

// Signal comments functions
export async function getSignalComments(signalId: string): Promise<SignalComment[]> {
  try {
    const { data, error } = await supabase
      .from('signal_comments')
      .select('*')
      .eq('signal_id', signalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching signal comments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Network error fetching signal comments:', error);
    return [];
  }
}

export async function addSignalComment(
  signalId: string,
  userId: string,
  comment: string,
  sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('signal_comments')
      .insert({
        signal_id: signalId,
        user_id: userId,
        comment,
        sentiment,
      });

    if (error) {
      console.error('Error adding signal comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error adding signal comment:', error);
    return false;
  }
}

// Trading session functions
export async function startTradingSession(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('trading_sessions')
      .insert({
        user_id: userId,
        device_type: 'web', // You can detect this dynamically
        app_version: '1.0.0',
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting trading session:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Network error starting trading session:', error);
    return null;
  }
}

export async function updateTradingSession(
  sessionId: string,
  updates: {
    signalsViewed?: number;
    signalsFollowed?: number;
    totalPnL?: number;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trading_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating trading session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error updating trading session:', error);
    return false;
  }
}

export async function endTradingSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trading_sessions')
      .update({ session_end: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending trading session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error ending trading session:', error);
    return false;
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

// Export all functions
export {
  fetchSignalAnalytics,
  calculatePerformanceMetrics,
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getSignalComments,
  addSignalComment,
  startTradingSession,
  updateTradingSession,
  endTradingSession,
};