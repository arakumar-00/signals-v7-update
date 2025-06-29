import { createClient } from 'npm:@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface MarketDataUpdate {
  pair: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  volume: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Simulate fetching live market data (replace with actual API calls)
    const marketUpdates: MarketDataUpdate[] = [
      {
        pair: 'XAU/USD',
        price: 2345.67 + (Math.random() - 0.5) * 20,
        change: (Math.random() - 0.5) * 30,
        change_percent: (Math.random() - 0.5) * 2,
        high: 2356.89 + (Math.random() - 0.5) * 10,
        low: 2334.12 + (Math.random() - 0.5) * 10,
        volume: `${(2.4 + Math.random()).toFixed(1)}M`,
      },
      {
        pair: 'XAG/USD',
        price: 29.45 + (Math.random() - 0.5) * 2,
        change: (Math.random() - 0.5) * 1,
        change_percent: (Math.random() - 0.5) * 3,
        high: 29.78 + (Math.random() - 0.5) * 1,
        low: 29.12 + (Math.random() - 0.5) * 1,
        volume: `${(1.8 + Math.random()).toFixed(1)}M`,
      },
      // Add more pairs as needed
    ];

    // Update market data in database
    for (const update of marketUpdates) {
      const { error } = await supabase
        .from('market_data')
        .upsert({
          pair: update.pair,
          price: update.price,
          change: update.change,
          change_percent: update.change_percent,
          high: update.high,
          low: update.low,
          volume: update.volume,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`Error updating ${update.pair}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: marketUpdates.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Market data sync error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to sync market data',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});