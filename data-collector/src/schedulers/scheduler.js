const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');

class Scheduler {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
    
    this.aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:8000';
  }

  async triggerDailyAnalysis() {
    this.logger.info('Triggering daily analysis');
    
    try {
      // Call AI server to perform daily analysis
      const response = await axios.post(`${this.aiServerUrl}/api/analyze/daily`, {
        date: new Date().toISOString().split('T')[0]
      }, {
        timeout: 300000, // 5 minutes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        this.logger.info(`Daily analysis completed: ${response.data.message}`);
        this.logger.info(`Generated ${response.data.analysis_count} recommendations`);
      } else {
        this.logger.error('Daily analysis failed:', response.data.error);
      }
    } catch (error) {
      this.logger.error('Error triggering daily analysis:', error.message);
      
      // Try to trigger via Supabase Edge Function as fallback
      try {
        await this.triggerAnalysisViaSupabase();
      } catch (supabaseError) {
        this.logger.error('Supabase fallback also failed:', supabaseError.message);
      }
    }
  }

  async triggerAnalysisViaSupabase() {
    this.logger.info('Triggering analysis via Supabase Edge Function');
    
    try {
      const { data, error } = await this.supabase.functions.invoke('daily-analysis', {
        body: {
          date: new Date().toISOString().split('T')[0]
        }
      });
      
      if (error) {
        throw error;
      }
      
      this.logger.info('Supabase analysis completed:', data);
    } catch (error) {
      this.logger.error('Supabase analysis failed:', error.message);
      throw error;
    }
  }

  async cleanupOldData() {
    this.logger.info('Starting data cleanup');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days of data
      
      // Clean up old news
      const { error: newsError } = await this.supabase
        .from('news')
        .delete()
        .lt('published_at', cutoffDate.toISOString());
      
      if (newsError) {
        this.logger.error('Error cleaning up old news:', newsError);
      } else {
        this.logger.info('Old news cleaned up');
      }
      
      // Clean up old recommendations (keep 30 days)
      const recCutoffDate = new Date();
      recCutoffDate.setDate(recCutoffDate.getDate() - 30);
      
      const { error: recError } = await this.supabase
        .from('recommendations')
        .delete()
        .lt('recommended_date', recCutoffDate.toISOString());
      
      if (recError) {
        this.logger.error('Error cleaning up old recommendations:', recError);
      } else {
        this.logger.info('Old recommendations cleaned up');
      }
      
      // Clean up old market data cache (keep 7 days)
      const cacheCutoffDate = new Date();
      cacheCutoffDate.setDate(cacheCutoffDate.getDate() - 7);
      
      const { error: cacheError } = await this.supabase
        .from('market_data')
        .delete()
        .lt('updated_at', cacheCutoffDate.toISOString());
      
      if (cacheError) {
        this.logger.error('Error cleaning up old market data:', cacheError);
      } else {
        this.logger.info('Old market data cleaned up');
      }
      
    } catch (error) {
      this.logger.error('Error in data cleanup:', error.message);
    }
  }

  async updateStockInfo() {
    this.logger.info('Updating stock information');
    
    try {
      // Get all stocks
      const { data: stocks, error } = await this.supabase
        .from('stocks')
        .select('id, ticker, market');
      
      if (error) {
        throw error;
      }
      
      // Update market cap and other info for each stock
      for (const stock of stocks) {
        try {
          await this.updateSingleStockInfo(stock);
          await this.delay(500); // Rate limiting
        } catch (error) {
          this.logger.error(`Error updating info for ${stock.ticker}:`, error.message);
        }
      }
      
      this.logger.info('Stock information update completed');
    } catch (error) {
      this.logger.error('Error updating stock information:', error.message);
    }
  }

  async updateSingleStockInfo(stock) {
    try {
      // This would typically call an external API to get updated stock info
      // For now, we'll just log the update
      this.logger.info(`Updating info for ${stock.ticker}`);
      
      // In a real implementation, you would:
      // 1. Call Yahoo Finance API or similar
      // 2. Get updated market cap, sector, industry info
      // 3. Update the database
      
    } catch (error) {
      this.logger.error(`Error updating single stock info for ${stock.ticker}:`, error.message);
    }
  }

  async generateMarketReport() {
    this.logger.info('Generating market report');
    
    try {
      // Get market statistics
      const { data: stockCount } = await this.supabase
        .from('stocks')
        .select('market')
        .not('market', 'is', null);
      
      const { data: newsCount } = await this.supabase
        .from('news')
        .select('id')
        .gte('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const { data: recCount } = await this.supabase
        .from('recommendations')
        .select('id')
        .eq('recommended_date', new Date().toISOString().split('T')[0]);
      
      const report = {
        date: new Date().toISOString(),
        stocks_tracked: stockCount.length,
        news_collected_24h: newsCount.length,
        recommendations_today: recCount.length,
        market_breakdown: this.getMarketBreakdown(stockCount)
      };
      
      this.logger.info('Market report generated:', report);
      
      // Store report in database or send to monitoring system
      return report;
    } catch (error) {
      this.logger.error('Error generating market report:', error.message);
    }
  }

  getMarketBreakdown(stocks) {
    const breakdown = {};
    
    for (const stock of stocks) {
      const market = stock.market;
      breakdown[market] = (breakdown[market] || 0) + 1;
    }
    
    return breakdown;
  }

  async healthCheck() {
    this.logger.info('Performing health check');
    
    try {
      // Check database connection
      const { data, error } = await this.supabase
        .from('stocks')
        .select('count')
        .limit(1);
      
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
      
      // Check AI server
      try {
        const response = await axios.get(`${this.aiServerUrl}/health`, { timeout: 5000 });
        if (response.status !== 200) {
          throw new Error('AI server health check failed');
        }
      } catch (aiError) {
        this.logger.warn('AI server health check failed:', aiError.message);
      }
      
      this.logger.info('Health check completed successfully');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error('Health check failed:', error.message);
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = Scheduler;
