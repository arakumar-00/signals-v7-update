import { supabase } from './supabase';

// Backend API functions for manual testing and monitoring

export interface SystemStatus {
  last_price_update: string;
  last_indicator_update: string;
  api_calls_today: number;
  system_health: 'healthy' | 'warning' | 'error';
}

export interface PriceSummary {
  id: string;
  pair: string;
  current_price: number;
  high_price: number;
  low_price: number;
  open_price: number;
  volume: string;
  change_amount: number;
  change_percent: number;
  updated_at: string;
}

// Get system status and configuration
export async function getSystemStatus(): Promise<SystemStatus | null> {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('config_key, config_value, updated_at')
      .in('config_key', ['last_price_update', 'last_indicator_update']);

    if (error) {
      console.error('Error fetching system status:', error);
      return null;
    }

    const lastPriceUpdate = data?.find(c => c.config_key === 'last_price_update')?.config_value || '';
    const lastIndicatorUpdate = data?.find(c => c.config_key === 'last_indicator_update')?.config_value || '';

    // Calculate system health based on last updates
    const now = new Date();
    const priceUpdateTime = lastPriceUpdate ? new Date(lastPriceUpdate) : new Date(0);
    const indicatorUpdateTime = lastIndicatorUpdate ? new Date(lastIndicatorUpdate) : new Date(0);

    const priceAge = (now.getTime() - priceUpdateTime.getTime()) / (1000 * 60); // minutes
    const indicatorAge = (now.getTime() - indicatorUpdateTime.getTime()) / (1000 * 60); // minutes

    let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (priceAge > 10 || indicatorAge > 30) {
      systemHealth = 'warning';
    }
    
    if (priceAge > 30 || indicatorAge > 60) {
      systemHealth = 'error';
    }

    return {
      last_price_update: lastPriceUpdate,
      last_indicator_update: lastIndicatorUpdate,
      api_calls_today: 0, // This would need to be tracked separately
      system_health: systemHealth,
    };
  } catch (error) {
    console.error('Network error fetching system status:', error);
    return null;
  }
}

// Get live price summary
export async function getPriceSummary(): Promise<PriceSummary[]> {
  try {
    const { data, error } = await supabase
      .from('price_summary')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching price summary:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Network error fetching price summary:', error);
    return [];
  }
}

// Manually trigger updates (for testing)
export async function triggerManualUpdate(type: 'signals' | 'indicators' | 'both' = 'both'): Promise<boolean> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl.includes('demo-project')) {
      console.log('Demo mode - manual trigger not available');
      return false;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/manual-trigger?action=${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Manual trigger failed:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    console.log('Manual trigger result:', result);
    
    return result.success;
  } catch (error) {
    console.error('Error triggering manual update:', error);
    return false;
  }
}

// Get active signals with current status
export async function getActiveSignalsWithStatus() {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select(`
        *,
        price_summary!inner(current_price, updated_at)
      `)
      .in('status', ['active', 'pending'])
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching active signals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Network error fetching active signals:', error);
    return [];
  }
}

// Get recent signal performance
export async function getSignalPerformance(days: number = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .eq('status', 'closed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching signal performance:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Network error fetching signal performance:', error);
    return [];
  }
}

// Update system configuration
export async function updateSystemConfig(key: string, value: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('system_config')
      .upsert({
        config_key: key,
        config_value: value,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating system config:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error updating system config:', error);
    return false;
  }
}