import { createClient } from 'npm:@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface IndicatorData {
  pair: string;
  indicator_name: string;
  value: string;
  status: string;
  color: string;
  timeframe: string;
}

function getRSIStatus(rsi: number): { status: string; color: string } {
  if (rsi > 70) return { status: 'Overbought', color: '#FF4757' };
  if (rsi < 30) return { status: 'Oversold', color: '#00C897' };
  return { status: 'Neutral', color: '#888888' };
}

function getMACDStatus(macd: number): { status: string; color: string } {
  if (macd > 0.5) return { status: 'Buy', color: '#00C897' };
  if (macd < -0.5) return { status: 'Sell', color: '#FF4757' };
  return { status: 'Neutral', color: '#888888' };
}

function getATRStatus(atr: number, price: number): { status: string; color: string } {
  const volatilityPercent = (atr / price) * 100;
  if (volatilityPercent > 2) return { status: 'High Volatility', color: '#FF4757' };
  if (volatilityPercent < 0.5) return { status: 'Low Volatility', color: '#888888' };
  return { status: 'Normal Volatility', color: '#FFA500' };
}

async function fetchIndicatorBatch(apiKey: string, indicator: string, pairs: string[], interval: string = '15min') {
  const symbolQuery = pairs.join(',');
  const url = `https://api.twelvedata.com/${indicator.toLowerCase()}?apikey=${apiKey}&interval=${interval}&symbol=${symbolQuery}`;

  try {
    console.log(`📥 Fetching ${indicator.toUpperCase()} for ${symbolQuery}`);
    const response = await fetch(url);
    const data = await response.json();
    console.log(`📦 Raw ${indicator.toUpperCase()} response:`, data);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${indicator.toUpperCase()}:`, error);
    return null;
  }
}

async function fetchCurrentPriceFromDB(supabase: any, pair: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('market_data')
      .select('price')
      .eq('pair', pair)
      .single();

    if (error) {
      console.error(`Error fetching price from DB for ${pair}:`, error);
      return null;
    }

    return data?.price || null;
  } catch (error) {
    console.error(`Network error fetching price from DB for ${pair}:`, error);
    return null;
  }
}

async function processATR(supabase: any, atrResults: Record<string, any>, pairs: string[]): Promise<IndicatorData[]> {
  const indicators: IndicatorData[] = [];
  for (const pair of pairs) {
    const data = atrResults[pair];
    const currentPrice = await fetchCurrentPriceFromDB(supabase, pair);
    if (!data || !data.values || !currentPrice) continue;

    const atr = parseFloat(data.values[0].atr);
    const atrStatus = getATRStatus(atr, currentPrice);
    indicators.push({
      pair,
      indicator_name: 'ATR',
      value: atr.toFixed(4),
      status: atrStatus.status,
      color: atrStatus.color,
      timeframe: '15M',
    });
  }
  return indicators;
}

async function processRSI(rsiResults: Record<string, any>, pairs: string[]): Promise<IndicatorData[]> {
  const indicators: IndicatorData[] = [];
  for (const pair of pairs) {
    const data = rsiResults[pair];
    if (!data || !data.values) continue;

    const rsi = parseFloat(data.values[0].rsi);
    const rsiStatus = getRSIStatus(rsi);
    indicators.push({
      pair,
      indicator_name: 'RSI',
      value: rsi.toFixed(1),
      status: rsiStatus.status,
      color: rsiStatus.color,
      timeframe: '15M',
    });
  }
  return indicators;
}

async function processMACD(macdResults: Record<string, any>, pairs: string[]): Promise<IndicatorData[]> {
  const indicators: IndicatorData[] = [];
  for (const pair of pairs) {
    const data = macdResults[pair];
    if (!data || !data.values) continue;

    const macd = parseFloat(data.values[0].macd);
    const macdStatus = getMACDStatus(macd);
    indicators.push({
      pair,
      indicator_name: 'MACD',
      value: macd > 0 ? `+${macd.toFixed(2)}` : macd.toFixed(2),
      status: macdStatus.status,
      color: macdStatus.color,
      timeframe: '15M',
    });
  }
  return indicators;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📈 Starting technical indicators update...');

    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('config_key, config_value')
      .in('config_key', ['api_key_twelvedata', 'supported_pairs']);

    if (configError) throw new Error(`Failed to get configuration: ${configError.message}`);

    const apiKey = config?.find(c => c.config_key === 'api_key_twelvedata')?.config_value;
    const supportedPairs = config?.find(c => c.config_key === 'supported_pairs')?.config_value?.split(',').map(s => s.trim()) || [];

    if (!apiKey) throw new Error('TwelveData API key not configured');

    const [atrResults, rsiResults, macdResults] = await Promise.all([
      fetchIndicatorBatch(apiKey, 'atr', supportedPairs),
      fetchIndicatorBatch(apiKey, 'rsi', supportedPairs),
      fetchIndicatorBatch(apiKey, 'macd', supportedPairs),
    ]);

    const [atrIndicators, rsiIndicators, macdIndicators] = await Promise.all([
      processATR(supabase, atrResults, supportedPairs),
      processRSI(rsiResults, supportedPairs),
      processMACD(macdResults, supportedPairs),
    ]);

    const allIndicators = [...atrIndicators, ...rsiIndicators, ...macdIndicators];

    if (allIndicators.length === 0) throw new Error('No indicator data was successfully fetched');

    for (const indicator of allIndicators) {
      const { error: updateError } = await supabase
        .from('technical_indicators')
        .update({
          value: indicator.value,
          status: indicator.status,
          color: indicator.color,
          timeframe: indicator.timeframe,
          updated_at: new Date().toISOString(),
        })
        .eq('pair', indicator.pair.toUpperCase())
        .eq('indicator_name', indicator.indicator_name.toUpperCase());

      if (updateError) {
        console.error(`❌ Error updating ${indicator.indicator_name} for ${indicator.pair}:`, updateError);
      } else {
        console.log(`✅ Saved ${indicator.indicator_name} for ${indicator.pair}`);
      }
    }

    await supabase
      .from('system_config')
      .update({
        config_value: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('config_key', 'last_indicator_update');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Technical indicators updated successfully',
        indicators_updated: allIndicators.length,
        timestamp: new Date().toISOString(),
        indicators: allIndicators,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('❌ Indicators update error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update technical indicators',
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
