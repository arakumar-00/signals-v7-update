import { createClient } from '@supabase/supabase-js';

// Use demo values if environment variables are not set
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key';

// Create a safe fetch function that handles missing environment variables
const safeFetch = async (url: string, options: any) => {
  // If using demo values, return mock data instead of making real requests
  if (SUPABASE_URL.includes('demo-project') || SUPABASE_ANON_KEY === 'demo-anon-key') {
    console.log('Using demo mode - no real Supabase connection');
    throw new Error('Demo mode - no real connection');
  }

  // Ensure proper Content-Type header for requests with body
  const headers = {
    ...options.headers,
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Set Content-Type to application/json for requests with body
  if (options.body && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: {
    fetch: safeFetch,
  },
});

// Add connection test function
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // If using demo values, return false
    if (SUPABASE_URL.includes('demo-project') || SUPABASE_ANON_KEY === 'demo-anon-key') {
      return false;
    }

    const { data, error } = await supabase.from('signals').select('count').limit(1);
    return !error;
  } catch (error) {
    console.log('Supabase connection test failed:', error);
    return false;
  }
}

// Database types
export interface Signal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  current_price?: number;
  take_profit_levels: number[];
  stop_loss: number;
  status: 'active' | 'closed' | 'pending';
  accuracy: number;
  timestamp: string;
  description?: string;
  risk_reward?: string;
  pnl?: number;
  created_at: string;
}

export interface MarketData {
  pair: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  volume: string;
}