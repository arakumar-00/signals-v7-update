import { createClient } from 'npm:@supabase/supabase-js@2.50.0';





const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface PriceData {
  pair: string;
  current_price: number;
  high_price: number;
  low_price: number;
  open_price: number;
  volume: string;
  change_amount: number;
  change_percent: number;
}

interface Signal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  take_profit_levels: number[];
  stop_loss: number;
  status: string;
  tp_hit: boolean;
  sl_hit: boolean;
  current_price?: number;
  pnl?: number;
}



async function fetchPricesFromTwelveData(apiKey: string, pairs: string[]): Promise<PriceData[]> {
  const results: PriceData[] = [];

  try {
    const formattedSymbols = pairs.join(',');
    const url = `https://api.twelvedata.com/time_series?apikey=${apiKey}&interval=1min&symbol=${encodeURIComponent(formattedSymbols)}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log("📦 Raw API response:", data);

    // CASE 1: Single symbol request (flat structure)
    if (data?.meta && data?.values) {
      const latest = data.values[0];
      const open = parseFloat(latest.open);
      const current = parseFloat(latest.close);

      results.push({
        pair: data.meta.symbol || pairs[0],
        current_price: current,
        high_price: parseFloat(latest.high),
        low_price: parseFloat(latest.low),
        open_price: open,
        volume: latest.volume || '0',
        change_amount: current - open,
        change_percent: ((current - open) / open) * 100,
      });

      console.log(`✅ Fetched ${data.meta.symbol || pairs[0]}: $${current}`);
    }

    // CASE 2: Multi-symbol response (object with keys as symbols)
    else {
      for (const [symbol, result] of Object.entries<any>(data)) {
        if (result.status === 'error') {
          console.error(`❌ API error for ${symbol}:`, result.message);
          continue;
        }

        if (!result?.values?.length) {
          console.warn(`⚠️ No data returned for ${symbol}`);
          continue;
        }

        const latest = result.values[0];
        const open = parseFloat(latest.open);
        const current = parseFloat(latest.close);

        results.push({
          pair: symbol,
          current_price: current,
          high_price: parseFloat(latest.high),
          low_price: parseFloat(latest.low),
          open_price: open,
          volume: latest.volume || '0',
          change_amount: current - open,
          change_percent: ((current - open) / open) * 100,
        });

        console.log(`✅ Fetched ${symbol}: $${current}`);
      }
    }

  } catch (error) {
    console.error('❌ Error fetching from TwelveData:', error);
  }

  return results;
}


async function updateSignalStatuses(supabase: any, priceData: PriceData[]): Promise<void> {
  // Get all active signals
  const { data: signals, error: signalsError } = await supabase
    .from('signals')
    .select('*')
    .in('status', ['active', 'pending']);

  if (signalsError) {
    console.error('Error fetching signals:', signalsError);
    return;
  }

  if (!signals || signals.length === 0) {
    console.log('No active signals to update');
    return;
  }

  console.log(`Processing ${signals.length} active signals`);

  for (const signal of signals) {
    const priceInfo = priceData.find(p => p.pair.toUpperCase() === signal.pair.toUpperCase());
    if (!priceInfo) {
      console.log(`No price data for signal ${signal.id} (${signal.pair})`);
      continue;
    }

    const currentPrice = priceInfo.current_price;
    let statusChanged = false;
    let newStatus = signal.status;
    let tpHit = signal.tp_hit;
    let slHit = signal.sl_hit;
    let pnl = signal.pnl || 0;

    // Check BUY signals
    if (signal.type === 'BUY') {
      // Check take profit levels
      for (const tpLevel of signal.take_profit_levels) {
        if (currentPrice >= tpLevel && !tpHit) {
          tpHit = true;
          newStatus = 'closed';
          pnl = (currentPrice - signal.entry_price) * 100; // Simplified calculation
          statusChanged = true;
          console.log(`🎯 BUY signal ${signal.id} hit TP at ${currentPrice}`);
          break;
        }
      }

      // Check stop loss
      if (currentPrice <= signal.stop_loss && !slHit && !tpHit) {
        slHit = true;
        newStatus = 'closed';
        pnl = (currentPrice - signal.entry_price) * 100; // Simplified calculation
        statusChanged = true;
        console.log(`🛑 BUY signal ${signal.id} hit SL at ${currentPrice}`);
      }
    }

    // Check SELL signals
    else if (signal.type === 'SELL') {
      // Check take profit levels (price goes down for SELL)
      for (const tpLevel of signal.take_profit_levels) {
        if (currentPrice <= tpLevel && !tpHit) {
          tpHit = true;
          newStatus = 'closed';
          pnl = (signal.entry_price - currentPrice) * 100; // Simplified calculation
          statusChanged = true;
          console.log(`🎯 SELL signal ${signal.id} hit TP at ${currentPrice}`);
          break;
        }
      }

      // Check stop loss (price goes up for SELL)
      if (currentPrice >= signal.stop_loss && !slHit && !tpHit) {
        slHit = true;
        newStatus = 'closed';
        pnl = (signal.entry_price - currentPrice) * 100; // Simplified calculation
        statusChanged = true;
        console.log(`🛑 SELL signal ${signal.id} hit SL at ${currentPrice}`);
      }
    }

    // Activate pending signals if price reaches entry
    if (signal.status === 'pending') {
      const entryTolerance = signal.entry_price * 0.001; // 0.1% tolerance
      if (Math.abs(currentPrice - signal.entry_price) <= entryTolerance) {
        newStatus = 'active';
        statusChanged = true;
        console.log(`🚀 Signal ${signal.id} activated at ${currentPrice}`);
      }
    }

    // Update signal if status changed or price updated
    if (statusChanged || currentPrice !== signal.current_price) {
      const { error: updateError } = await supabase
        .from('signals')
        .update({
          current_price: currentPrice,
          status: newStatus,
          tp_hit: tpHit,
          sl_hit: slHit,
          pnl: pnl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', signal.id);

      if (updateError) {
        console.error(`Error updating signal ${signal.id}:`, updateError);
      } else if (statusChanged) {
        console.log(`✅ Updated signal ${signal.id}: ${signal.status} → ${newStatus}`);
      }
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const url = new URL(req.url);
  const clientKey = url.searchParams.get('key');
  const expectedKey = Deno.env.get('EDGE_SECRET_KEY');

  if (!clientKey || clientKey !== expectedKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting signal update process...');

    // Get API configuration
    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('config_key, config_value')
      .in('config_key', ['api_key_twelvedata', 'supported_pairs']);

    if (configError) {
      throw new Error(`Failed to get configuration: ${configError.message}`);
    }

    const apiKey = config?.find(c => c.config_key === 'api_key_twelvedata')?.config_value;
    const supportedPairs = config?.find(c => c.config_key === 'supported_pairs')?.config_value?.split(',') || [];

    if (!apiKey) {
      throw new Error('TwelveData API key not configured');
    }

    console.log(`📊 Fetching prices for pairs: ${supportedPairs.join(', ')}`);

    // Fetch current prices from TwelveData
    const priceData = await fetchPricesFromTwelveData(apiKey, supportedPairs);

    console.log('Fetched priceData:', JSON.stringify(priceData, null, 2));

    if (priceData.length === 0) {
      throw new Error('No price data received from TwelveData');
    }

    // Update price_summary table
    for (const price of priceData) {
      const { error: priceError } = await supabase
        .from('price_summary')
        .update({
          current_price: price.current_price,
          high_price: price.high_price,
          low_price: price.low_price,
          open_price: price.open_price,
          volume: price.volume,
          updated_at: new Date().toISOString(),
        })
        .eq('pair', price.pair);

      if (priceError) {
        console.error(`Error updating price for ${price.pair}:`, priceError);
      }
    }

    // Update market_data table for compatibility
    for (const price of priceData) {
      const { error: marketError } = await supabase
        .from('market_data')
        .update({
          price: price.current_price,
          change: price.change_amount,
          change_percent: price.change_percent,
          high: price.high_price,
          low: price.low_price,
          volume: price.volume,
          updated_at: new Date().toISOString(),
        })
        .eq('pair', price.pair);

      if (marketError) {
        console.error(`Error updating market_data for ${price.pair}:`, marketError);
      }
    }

    // Update signal statuses based on new prices
    await updateSignalStatuses(supabase, priceData);

    // Update last update timestamp
    await supabase
      .from('system_config')
      .update({
        config_value: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('config_key', 'last_price_update');

    console.log('✅ Signal update process completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Signals updated successfully',
        prices_updated: priceData.length,
        timestamp: new Date().toISOString(),
        price_data: priceData,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Signal update error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to update signals',
        details: error.message,
        timestamp: new Date().toISOString(),
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