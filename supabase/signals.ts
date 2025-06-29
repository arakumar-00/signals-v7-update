import { supabase, Signal } from '../lib/supabase';

// Fetch all signals with error handling
export async function fetchSignals(): Promise<Signal[]> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('timestamp', { ascending: false });

    console.log('📦 Fetched signals:', data);
    if (error) {
      console.error('❌ Error fetching signals:', error);
      return getMockSignals();
    }

    return data || getMockSignals();
  } catch (error) {
    console.error('❌ Network error fetching signals:', error);
    return getMockSignals();
  }
}


// Subscribe to real-time signals with improved error handling
export function subscribeToSignals(callback: (signals: Signal[]) => void) {
  // First, fetch initial data
  fetchSignals().then(callback).catch((e) => {
    console.log('⚠️ Supabase fetch failed, using mock:', e);
    callback(getMockSignals());
  });

  // Set up real-time subscription with error handling
  try {
    const channel = supabase
      .channel('realtime:signals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signals' },
        async () => {
          try {
            const latest = await fetchSignals();
            callback(latest);
          } catch (error) {
            console.error('Error in real-time update:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to signals updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to signals updates');
        }
      });

    // Return unsubscribe function
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    };
  } catch (error) {
    console.error('Error setting up subscription:', error);
    return () => { }; // Return empty unsubscribe function
  }
}

// Add a new signal with improved error handling
export async function addSignal(signalData: Omit<Signal, 'id' | 'created_at'>): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .insert([{
        ...signalData,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding signal:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Network error adding signal:', error);
    return null;
  }
}

// Get active signals with error handling
export async function getActiveSignals(): Promise<Signal[]> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .eq('status', 'active')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching active signals:', error);
      return getMockSignals().filter(s => s.status === 'active');
    }

    return data || getMockSignals().filter(s => s.status === 'active');
  } catch (error) {
    console.error('Network error fetching active signals:', error);
    return getMockSignals().filter(s => s.status === 'active');
  }
}

// Mock data fallback (for when Supabase is not connected)
function getMockSignals(): Signal[] {
  return [
    {
      id: "1",
      pair: "XAU/USD",
      type: "BUY",
      entry_price: 2345.67,
      current_price: 2352.34,
      take_profit_levels: [2360.00, 2375.00, 2390.00],
      stop_loss: 2330.00,
      status: "active",
      accuracy: 85.2,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      description: "Gold showing strong bullish momentum after Fed dovish comments. Technical breakout above key resistance.",
      risk_reward: "1:3",
      pnl: 245.00,
      created_at: new Date().toISOString()
    },
    {
      id: "2",
      pair: "XAG/USD",
      type: "SELL",
      entry_price: 29.45,
      current_price: 28.92,
      take_profit_levels: [28.20, 27.80, 27.50],
      stop_loss: 30.20,
      status: "active",
      accuracy: 76.8,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      description: "Silver showing bearish divergence on H4. Expecting correction to support levels.",
      risk_reward: "1:2.5",
      pnl: 265.00,
      created_at: new Date().toISOString()
    },
    {
      id: "3",
      pair: "XAU/USD",
      type: "BUY",
      entry_price: 2334.56,
      current_price: 2321.45,
      take_profit_levels: [2350.00, 2365.00],
      stop_loss: 2320.00,
      status: "active",
      accuracy: 68.4,
      timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      description: "Gold consolidation breakout expected. Strong support at current levels.",
      risk_reward: "1:2",
      pnl: -175.00,
      created_at: new Date().toISOString()
    },
    {
      id: "4",
      pair: "XAG/USD",
      type: "SELL",
      entry_price: 30.78,
      take_profit_levels: [30.20, 29.80],
      stop_loss: 31.20,
      status: "closed",
      accuracy: 92.1,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      description: "Silver weakness on industrial demand concerns. Target achieved successfully.",
      risk_reward: "1:1.8",
      pnl: 290.00,
      created_at: new Date().toISOString()
    },
    {
      id: "5",
      pair: "XAU/USD",
      type: "BUY",
      entry_price: 2340.01,
      take_profit_levels: [2355.00, 2370.00],
      stop_loss: 2325.00,
      status: "pending",
      accuracy: 74.3,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      description: "Gold bullish setup forming. Waiting for entry confirmation at key level.",
      risk_reward: "1:2.2",
      created_at: new Date().toISOString()
    },
    {
      id: "6",
      pair: "XAU/USD",
      type: "SELL",
      entry_price: 2380.45,
      take_profit_levels: [2365.00, 2350.00],
      stop_loss: 2395.00,
      status: "closed",
      accuracy: 88.7,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Gold reversal from resistance. Perfect execution to target levels.",
      risk_reward: "1:2.1",
      pnl: 425.00,
      created_at: new Date().toISOString()
    }
  ];
}