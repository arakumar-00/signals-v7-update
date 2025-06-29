import { supabase } from './supabase';

// Market Data Functions
export interface MarketData {
  id: string;
  pair: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  volume: string;
  updated_at: string;
  created_at: string;
}

export async function fetchMarketData(): Promise<MarketData[]> {
  try {
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .order('pair');

    if (error) {
      console.error('Error fetching market data:', error);
      return getMockMarketData();
    }

    return data || getMockMarketData();
  } catch (error) {
    console.error('Network error fetching market data:', error);
    return getMockMarketData();
  }
}

// Price Summary Types
export interface PriceSummary {
  pair: string;
  current_price: number;
  high_price: number;
  low_price: number;
  volume: string;
  change_amount: number;
  change_percent: number;
  updated_at: string;
}

export async function fetchPriceSummary(pair: string): Promise<PriceSummary | null> {
  try {
    const { data, error } = await supabase
      .from('price_summary')
      .select('*')
      .eq('pair', pair)
      .single();

    if (error) {
      console.error(`Error fetching price summary for ${pair}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Network error fetching price summary for ${pair}:`, error);
    return null;
  }
}


export function subscribeToMarketData(callback: (data: MarketData[]) => void) {
  // Initial fetch
  fetchMarketData().then(callback).catch(() => {
    callback(getMockMarketData());
  });

  // Real-time subscription
  const channel = supabase
    .channel('market_data_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'market_data' },
      async () => {
        const data = await fetchMarketData();
        callback(data);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// Setup Steps Functions
export interface SetupStep {
  id: string;
  title: string;
  description: string;
  action_text: string;
  code_sample?: string;
  step_order: number;
  is_active: boolean;
  created_at: string;
}

export async function fetchSetupSteps(): Promise<SetupStep[]> {
  try {
    const { data, error } = await supabase
      .from('setup_steps')
      .select('*')
      .eq('is_active', true)
      .order('step_order');

    if (error) {
      console.error('Error fetching setup steps:', error);
      return getMockSetupSteps();
    }

    return data || getMockSetupSteps();
  } catch (error) {
    console.error('Network error fetching setup steps:', error);
    return getMockSetupSteps();
  }
}

// Technical Indicators Functions
export interface TechnicalIndicator {
  id: string;
  pair: string;
  indicator_name: string;
  value: string;
  status: string;
  color: string;
  timeframe: string;
  updated_at: string;
  created_at: string;
}

export async function fetchTechnicalIndicators(pair: string = 'XAU/USD'): Promise<TechnicalIndicator[]> {
  try {
    const { data, error } = await supabase
      .from('technical_indicators')
      .select('*')
      .eq('pair', pair)
      .order('indicator_name');

    if (error) {
      console.error('Error fetching technical indicators:', error);
      return getMockTechnicalIndicators();
    }

    return data || getMockTechnicalIndicators();
  } catch (error) {
    console.error('Network error fetching technical indicators:', error);
    return getMockTechnicalIndicators();
  }
}

// Economic Events Functions
export interface EconomicEvent {
  id: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  currency: string;
  event_name: string;
  forecast: string;
  previous: string;
  actual?: string;
  event_date: string;
  created_at: string;
}

export async function fetchEconomicEvents(date: string = new Date().toISOString().split('T')[0]): Promise<EconomicEvent[]> {
  try {
    const { data, error } = await supabase
      .from('economic_events')
      .select('*')
      .eq('event_date', date)
      .order('time');

    if (error) {
      console.error('Error fetching economic events:', error);
      return getMockEconomicEvents();
    }

    return data || getMockEconomicEvents();
  } catch (error) {
    console.error('Network error fetching economic events:', error);
    return getMockEconomicEvents();
  }
}

// Notifications Functions
export interface NotificationData {
  id: string;
  type: 'signal' | 'achievement' | 'announcement' | 'alert';
  title: string;
  message: string;
  data?: any;
  target_user?: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
}

export async function fetchNotifications(): Promise<NotificationData[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return getMockNotifications();
    }

    return data || getMockNotifications();
  } catch (error) {
    console.error('Network error fetching notifications:', error);
    return getMockNotifications();
  }
}

export async function createNotification(notification: Omit<NotificationData, 'id' | 'status' | 'created_at' | 'sent_at'>): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Network error creating notification:', error);
    return null;
  }
}

// User Profile Functions
export interface UserProfile {
  id: string;
  user_id: string;
  fcm_token?: string;
  device_type?: 'ios' | 'android' | 'web';
  app_version?: string;
  last_active: string;
  created_at: string;
}

export async function upsertUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'last_active'>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        ...profile,
        last_active: new Date().toISOString(),
      });

    if (error) {
      console.error('Error upserting user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error upserting user profile:', error);
    return false;
  }
}

// Mock data fallbacks
function getMockMarketData(): MarketData[] {
  return [
    {
      id: '1',
      pair: 'XAU/USD',
      price: 2345.67,
      change: 12.34,
      change_percent: 0.53,
      high: 2356.89,
      low: 2334.12,
      volume: '2.4M',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      pair: 'XAG/USD',
      price: 29.45,
      change: -0.23,
      change_percent: -0.77,
      high: 29.78,
      low: 29.12,
      volume: '1.8M',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];
}

function getMockSetupSteps(): SetupStep[] {
  return [
    {
      id: '1',
      title: 'Create Supabase Project',
      description: 'Sign up at supabase.com and create a new project',
      action_text: 'Visit supabase.com',
      step_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];
}

function getMockTechnicalIndicators(): TechnicalIndicator[] {
  return [
    {
      id: '1',
      pair: 'XAU/USD',
      indicator_name: 'RSI',
      value: '61.2',
      status: 'Neutral',
      color: '#888888',
      timeframe: '1H',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];
}

function getMockEconomicEvents(): EconomicEvent[] {
  return [
    {
      id: '1',
      time: '10:30 AM',
      impact: 'high',
      currency: 'USD',
      event_name: 'Non-Farm Payrolls',
      forecast: '250K',
      previous: '200K',
      event_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    },
  ];
}

function getMockNotifications(): NotificationData[] {
  return [
    {
      id: '1',
      type: 'signal',
      title: 'Signal Closed - Profit!',
      message: 'XAU/USD BUY signal closed with +$245 profit',
      status: 'sent',
      sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
  ];
}