import { Stock, StockPrice } from '@/types';

const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'YOUR_ALPHA_VANTAGE_API_KEY';

interface AlphaVantageQuote {
  'Global Quote'?: {
    '01. symbol'?: string;
    '02. open'?: string;
    '03. high'?: string;
    '04. low'?: string;
    '05. price'?: string;
    '06. volume'?: string;
    '07. latest trading day'?: string;
    '08. previous close'?: string;
    '09. change'?: string;
    '10. change percent'?: string;
  };
  'Note'?: string; // Rate limit message
  'Information'?: string; // API key or subscription message
}

export async function fetchStockPrice(
  symbol: string, 
  market: 'US' | 'KR' = 'US',
  retryCount = 0
): Promise<StockPrice | null> {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000; // 1 second
  
  try {
    if (!symbol) {
      throw new Error('Stock symbol is required');
    }

    // For Korean stocks, we need to add .KS for KOSPI or .KQ for KOSDAQ
    const formattedSymbol = market === 'KR' ? `${symbol}.KS` : symbol;
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${formattedSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch stock data: ${response.statusText}`);
    }
    
    const data: AlphaVantageQuote = await response.json();
    
    // Log the full response for debugging
    console.log('API Response for', formattedSymbol, ':', JSON.stringify(data, null, 2));
    
    // Check for rate limit or subscription messages
    if (data.Note || data.Information) {
      console.warn('API Limit/Subscription Note:', data.Note || data.Information);
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return fetchStockPrice(symbol, market, retryCount + 1);
      }
      throw new Error(data.Note || data.Information || 'API limit reached');
    }
    
    if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
      throw new Error('Invalid stock data received from API');
    }
    
    const quote = data['Global Quote'];
    const now = new Date().toISOString().split('T')[0];
    
    return {
      id: 0,
      stock_id: 0,
      date: now,
      open: parseFloat(quote['02. open'] || '0'),
      close: parseFloat(quote['05. price'] || '0'),
      high: parseFloat(quote['03. high'] || '0'),
      low: parseFloat(quote['04. low'] || '0'),
      volume: parseInt(quote['06. volume'] || '0', 10),
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol} (${market}):`, error);
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return fetchStockPrice(symbol, market, retryCount + 1);
    }
    return null;
  }
}

// Cache for storing stock prices to avoid too many API calls
const stockPriceCache: Record<string, { price: StockPrice | null; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export async function getCachedStockPrice(
  symbol: string, 
  market: 'US' | 'KR' = 'US'
): Promise<StockPrice | null> {
  const cacheKey = `${market}:${symbol}`;
  const now = Date.now();
  
  // Return cached price if it's still valid
  if (stockPriceCache[cacheKey] && now - stockPriceCache[cacheKey].timestamp < CACHE_DURATION) {
    return stockPriceCache[cacheKey].price;
  }
  
  // Otherwise fetch new price
  try {
    const price = await fetchStockPrice(symbol, market);
    stockPriceCache[cacheKey] = {
      price,
      timestamp: now
    };
    return price;
  } catch (error) {
    console.error('Error in getCachedStockPrice:', error);
    return null;
  }
}
