
// async function fetchCurrentPrice(apiKey: string, pair: string): Promise<number | null> {
//   try {
//     const symbol = pair.replace('/', '');
//     const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`;

//     console.log(`📥 Fetching current price for ${pair}...`);

//     const response = await fetch(url);

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }

//     const data = await response.json();

//     console.log(`📦 Raw price response for ${pair}:`, data);

//     if (data.status === 'error') {
//       throw new Error(data.message);
//     }

//     return parseFloat(data.price);

//   } catch (error) {
//     console.error(`❌ Error fetching price for ${pair}:`, error);
//     return null;
//   }
// }


async function updateIndicatorsForPair(
  supabase: any,
  apiKey: string,
  pair: string,
  timeframe: string = '15min'
): Promise<IndicatorData[]> {
  const indicators: IndicatorData[] = [];

  try {
    console.log(`🔄 Updating indicators for ${pair}...`);

    const [rsiData, macdData, atrData, currentPrice] = await Promise.all([
      fetchIndicatorFromTwelveData(apiKey, pair, 'rsi', timeframe),
      fetchIndicatorFromTwelveData(apiKey, pair, 'macd', timeframe),
      fetchIndicatorFromTwelveData(apiKey, pair, 'atr', timeframe),
      fetchCurrentPriceFromDB(pair),
    ]);

    const [atrData, currentPrice] = await Promise.all([
      fetchIndicatorFromTwelveData(apiKey, pair, 'rsi', timeframe),
      fetchIndicatorFromTwelveData(apiKey, pair, 'macd', timeframe),
      fetchIndicatorFromTwelveData(apiKey, pair, 'atr', timeframe),
      fetchCurrentPriceFromDB(supabase, pair),  // updated
    ]);

    if (rsiData && rsiData.rsi) {
      const rsiValue = parseFloat(rsiData.rsi);
      const rsiStatus = getRSIStatus(rsiValue);

      indicators.push({
        pair,
        indicator_name: 'RSI',
        value: rsiValue.toFixed(1),
        status: rsiStatus.status,
        color: rsiStatus.color,
        timeframe: '15M',
      });

      console.log(`✅ RSI for ${pair}: ${rsiValue.toFixed(1)} (${rsiStatus.status})`);
    }

    if (macdData && macdData.macd) {
      const macdValue = parseFloat(macdData.macd);
      const macdStatus = getMACDStatus(macdValue);

      indicators.push({
        pair,
        indicator_name: 'MACD',
        value: macdValue > 0 ? `+${macdValue.toFixed(2)}` : macdValue.toFixed(2),
        status: macdStatus.status,
        color: macdStatus.color,
        timeframe: '15M',
      });

      console.log(`✅ MACD for ${pair}: ${macdValue.toFixed(2)} (${macdStatus.status})`);
    }

    if (atrData && atrData.atr && currentPrice) {
      const atrValue = parseFloat(atrData.atr);
      const atrStatus = getATRStatus(atrValue, currentPrice);

      indicators.push({
        pair,
        indicator_name: 'ATR',
        value: atrValue.toFixed(4),
        status: atrStatus.status,
        color: atrStatus.color,
        timeframe: '15M',
      });

      console.log(`✅ ATR for ${pair}: ${atrValue.toFixed(4)} (${atrStatus.status})`);
    }

  } catch (error) {
    console.error(`❌ Error processing indicators for ${pair}:`, error);
  }

  return indicators;
}