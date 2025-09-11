const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const yahooFinance = require('yahoo-finance2');
const winston = require('winston');

class StockCollector {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  async initialize() {
    this.logger.info('Stock collector initialized');
  }

  async collectStockPrices(symbols, market) {
    this.logger.info(`Collecting stock prices for ${market} market: ${symbols.length} symbols`);
    
    for (const symbol of symbols) {
      try {
        await this.collectSingleStock(symbol, market);
        // Add delay to avoid rate limiting
        await this.delay(1000);
      } catch (error) {
        this.logger.error(`Error collecting ${symbol}:`, error.message);
      }
    }
  }

  async collectSingleStock(symbol, market) {
    try {
      // Get stock info from database
      const { data: stockData } = await this.supabase
        .from('stocks')
        .select('id')
        .eq('ticker', symbol)
        .single();

      if (!stockData) {
        this.logger.warn(`Stock ${symbol} not found in database`);
        return;
      }

      // Fetch stock data using yahoo-finance2
      const hist = await yahooFinance.historical(symbol, { period1: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), period2: new Date(), interval: '1d' });

      if (!hist || hist.length === 0) {
        this.logger.warn(`No data available for ${symbol}`);
        return;
      }

      // Process each day's data
      for (const row of hist) {
        const priceData = {
          stock_id: stockData.id,
          date: new Date(row.date).toISOString().split('T')[0],
          open: row.open,
          close: row.close,
          high: row.high,
          low: row.low,
          volume: row.volume,
          adjusted_close: row.close
        };

        // Insert or update price data
        const { error } = await this.supabase
          .from('stock_prices')
          .upsert(priceData, { onConflict: 'stock_id,date' });

        if (error) {
          this.logger.error(`Error inserting price data for ${symbol}:`, error);
        }
      }

      this.logger.info(`Successfully collected data for ${symbol}`);
    } catch (error) {
      this.logger.error(`Error collecting single stock ${symbol}:`, error.message);
    }
  }

  async collectStockInfo(symbols, market) {
    this.logger.info(`Collecting stock info for ${market} market: ${symbols.length} symbols`);
    
    for (const symbol of symbols) {
      try {
        await this.collectSingleStockInfo(symbol, market);
        await this.delay(500);
      } catch (error) {
        this.logger.error(`Error collecting info for ${symbol}:`, error.message);
      }
    }
  }

  async collectSingleStockInfo(symbol, market) {
    try {
      // Check if stock already exists
      const { data: existingStock } = await this.supabase
        .from('stocks')
        .select('id')
        .eq('ticker', symbol)
        .single();

      if (existingStock) {
        this.logger.info(`Stock ${symbol} already exists`);
        return;
      }

      // Fetch stock info using yahoo-finance2
      const info = await yahooFinance.quote(symbol);

      if (!info || !info.longName) {
        this.logger.warn(`No info available for ${symbol}`);
        return;
      }

      const stockData = {
        ticker: symbol,
        name: info.longName || info.shortName || symbol,
        market: market,
        sector: info.sector || null,
        industry: info.industry || null,
        market_cap: info.marketCap || null
      };

      // Insert stock info
      const { error } = await this.supabase
        .from('stocks')
        .insert(stockData);

      if (error) {
        this.logger.error(`Error inserting stock info for ${symbol}:`, error);
      } else {
        this.logger.info(`Successfully added stock info for ${symbol}`);
      }
    } catch (error) {
      this.logger.error(`Error collecting stock info for ${symbol}:`, error.message);
    }
  }

  async collectRealTimeData(symbols, market) {
    this.logger.info(`Collecting real-time data for ${market} market: ${symbols.length} symbols`);
    
    for (const symbol of symbols) {
      try {
        await this.collectSingleRealTimeData(symbol, market);
        await this.delay(200);
      } catch (error) {
        this.logger.error(`Error collecting real-time data for ${symbol}:`, error.message);
      }
    }
  }

  async collectSingleRealTimeData(symbol, market) {
    try {
      // Get stock info from database
      const { data: stockData } = await this.supabase
        .from('stocks')
        .select('id')
        .eq('ticker', symbol)
        .single();

      if (!stockData) {
        this.logger.warn(`Stock ${symbol} not found in database`);
        return;
      }

      // Fetch real-time data using yahoo-finance2
      const info = await yahooFinance.quote(symbol);

      if (!info || !info.currentPrice) {
        this.logger.warn(`No real-time data available for ${symbol}`);
        return;
      }

      const realTimeData = {
        symbol: symbol,
        market: market,
        data: {
          current_price: info.currentPrice,
          previous_close: info.previousClose,
          day_high: info.dayHigh,
          day_low: info.dayLow,
          volume: info.volume,
          market_cap: info.marketCap,
          pe_ratio: info.trailingPE,
          updated_at: new Date().toISOString()
        }
      };

      // Update market data cache
      const { error } = await this.supabase
        .from('market_data')
        .upsert(realTimeData, { onConflict: 'symbol,market' });

      if (error) {
        this.logger.error(`Error updating real-time data for ${symbol}:`, error);
      } else {
        this.logger.info(`Successfully updated real-time data for ${symbol}`);
      }
    } catch (error) {
      this.logger.error(`Error collecting real-time data for ${symbol}:`, error.message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = StockCollector;
