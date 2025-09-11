const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');
const FeedParser = require('feedparser');
const winston = require('winston');

class NewsCollector {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
    
    // News sources configuration
    this.newsSources = {
      US: [
        {
          name: 'Yahoo Finance',
          url: 'https://feeds.finance.yahoo.com/rss/2.0/headline',
          params: { s: 'AAPL,MSFT,GOOGL,AMZN,TSLA' }
        },
        {
          name: 'MarketWatch',
          url: 'https://feeds.marketwatch.com/marketwatch/marketpulse/',
          type: 'rss'
        },
        {
          name: 'Reuters Business',
          url: 'https://feeds.reuters.com/reuters/businessNews',
          type: 'rss'
        }
      ],
      KR: [
        {
          name: 'Naver Finance',
          url: 'https://finance.naver.com/news/news_list.naver',
          type: 'scrape'
        },
        {
          name: 'Daum Finance',
          url: 'https://finance.daum.net/news',
          type: 'scrape'
        }
      ]
    };
  }

  async initialize() {
    this.logger.info('News collector initialized');
  }

  async collectNews(symbols, market) {
    this.logger.info(`Collecting news for ${market} market: ${symbols.length} symbols`);
    
    try {
      const sources = this.newsSources[market] || [];
      
      for (const source of sources) {
        try {
          if (source.type === 'rss') {
            await this.collectRSSNews(source, symbols, market);
          } else if (source.type === 'scrape') {
            await this.collectScrapedNews(source, symbols, market);
          } else {
            await this.collectAPINews(source, symbols, market);
          }
          
          await this.delay(2000); // Delay between sources
        } catch (error) {
          this.logger.error(`Error collecting from ${source.name}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error(`Error in news collection for ${market}:`, error.message);
    }
  }

  async collectRSSNews(source, symbols, market) {
    try {
      const response = await axios.get(source.url, { timeout: 10000 });
      const feed = response.data;
      
      // Parse RSS feed
      const items = await this.parseRSSFeed(feed);
      
      for (const item of items) {
        await this.processNewsItem(item, symbols, market, source.name);
      }
    } catch (error) {
      this.logger.error(`Error collecting RSS news from ${source.name}:`, error.message);
    }
  }

  async parseRSSFeed(feed) {
    return new Promise((resolve, reject) => {
      const items = [];
      const feedparser = new FeedParser();
      
      feedparser.on('error', reject);
      feedparser.on('readable', function() {
        let stream = this;
        let item;
        
        while (item = stream.read()) {
          items.push({
            title: item.title,
            description: item.description,
            link: item.link,
            pubDate: item.pubDate,
            guid: item.guid
          });
        }
      });
      
      feedparser.on('end', () => resolve(items));
      feedparser.write(feed);
      feedparser.end();
    });
  }

  async collectScrapedNews(source, symbols, market) {
    try {
      const response = await axios.get(source.url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const newsItems = [];
      
      // Parse news items based on source structure
      if (source.name === 'Naver Finance') {
        $('.newsList li').each((i, element) => {
          const $el = $(element);
          const title = $el.find('a').text().trim();
          const link = $el.find('a').attr('href');
          const time = $el.find('.time').text().trim();
          
          if (title && link) {
            newsItems.push({
              title,
              link: link.startsWith('http') ? link : `https://finance.naver.com${link}`,
              pubDate: new Date(),
              source: source.name
            });
          }
        });
      }
      
      for (const item of newsItems) {
        await this.processNewsItem(item, symbols, market, source.name);
      }
    } catch (error) {
      this.logger.error(`Error scraping news from ${source.name}:`, error.message);
    }
  }

  async collectAPINews(source, symbols, market) {
    try {
      // Use Google News API or similar
      const apiKey = process.env.GOOGLE_NEWS_API_KEY;
      if (!apiKey) {
        this.logger.warn('Google News API key not configured');
        return;
      }
      
      const query = symbols.join(' OR ');
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}&language=en&sortBy=publishedAt&pageSize=20`;
      
      const response = await axios.get(url, { timeout: 10000 });
      const articles = response.data.articles || [];
      
      for (const article of articles) {
        await this.processNewsItem({
          title: article.title,
          description: article.description,
          link: article.url,
          pubDate: article.publishedAt,
          source: article.source.name
        }, symbols, market, 'Google News');
      }
    } catch (error) {
      this.logger.error(`Error collecting API news:`, error.message);
    }
  }

  async processNewsItem(item, symbols, market, sourceName) {
    try {
      // Check if news item is relevant to any of our symbols
      const relevantSymbols = this.findRelevantSymbols(item.title + ' ' + (item.description || ''), symbols);
      
      if (relevantSymbols.length === 0) {
        return;
      }
      
      // Get stock IDs for relevant symbols
      const { data: stocks } = await this.supabase
        .from('stocks')
        .select('id, ticker')
        .in('ticker', relevantSymbols);
      
      if (!stocks || stocks.length === 0) {
        return;
      }
      
      // Process each relevant stock
      for (const stock of stocks) {
        const newsData = {
          stock_id: stock.id,
          headline: item.title,
          url: item.link,
          content: item.description || '',
          source: sourceName,
          published_at: new Date(item.pubDate || Date.now()).toISOString(),
          sentiment: 0, // Will be updated by AI analysis
          confidence: 0
        };
        
        // Insert news item
        const { error } = await this.supabase
          .from('news')
          .upsert(newsData, { onConflict: 'stock_id,url' });
        
        if (error) {
          this.logger.error(`Error inserting news for ${stock.ticker}:`, error);
        } else {
          this.logger.info(`Successfully added news for ${stock.ticker}: ${item.title.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing news item:`, error.message);
    }
  }

  findRelevantSymbols(text, symbols) {
    const relevantSymbols = [];
    const lowerText = text.toLowerCase();
    
    for (const symbol of symbols) {
      // Check if symbol appears in text
      if (lowerText.includes(symbol.toLowerCase())) {
        relevantSymbols.push(symbol);
      }
      
      // Check for company name variations
      const companyNames = this.getCompanyNameVariations(symbol);
      for (const name of companyNames) {
        if (lowerText.includes(name.toLowerCase())) {
          relevantSymbols.push(symbol);
          break;
        }
      }
    }
    
    return [...new Set(relevantSymbols)]; // Remove duplicates
  }

  getCompanyNameVariations(symbol) {
    // Map symbols to common company name variations
    const variations = {
      'AAPL': ['Apple', 'iPhone', 'iPad', 'Mac'],
      'MSFT': ['Microsoft', 'Windows', 'Office', 'Azure'],
      'GOOGL': ['Google', 'Alphabet', 'YouTube', 'Android'],
      'AMZN': ['Amazon', 'AWS', 'Prime'],
      'TSLA': ['Tesla', 'Elon Musk', 'Model S', 'Model 3', 'Model X', 'Model Y'],
      'META': ['Facebook', 'Meta', 'Instagram', 'WhatsApp'],
      'NVDA': ['NVIDIA', 'Nvidia', 'GPU', 'AI'],
      '005930': ['삼성전자', 'Samsung', 'Galaxy'],
      '000660': ['SK하이닉스', 'SK Hynix', '메모리'],
      '035420': ['네이버', 'Naver', '라인']
    };
    
    return variations[symbol] || [];
  }

  async collectTrendingNews() {
    this.logger.info('Collecting trending news');
    
    try {
      // Collect from multiple sources
      const sources = [
        'https://feeds.finance.yahoo.com/rss/2.0/headline',
        'https://feeds.reuters.com/reuters/businessNews',
        'https://feeds.marketwatch.com/marketwatch/marketpulse/'
      ];
      
      for (const sourceUrl of sources) {
        try {
          const response = await axios.get(sourceUrl, { timeout: 10000 });
          const items = await this.parseRSSFeed(response.data);
          
          for (const item of items) {
            await this.processTrendingNewsItem(item);
          }
          
          await this.delay(1000);
        } catch (error) {
          this.logger.error(`Error collecting trending news from ${sourceUrl}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('Error in trending news collection:', error.message);
    }
  }

  async processTrendingNewsItem(item) {
    try {
      // Store trending news without specific stock association
      const newsData = {
        stock_id: null, // No specific stock association
        headline: item.title,
        url: item.link,
        content: item.description || '',
        source: 'Trending',
        published_at: new Date(item.pubDate || Date.now()).toISOString(),
        sentiment: 0,
        confidence: 0
      };
      
      const { error } = await this.supabase
        .from('news')
        .upsert(newsData, { onConflict: 'stock_id,url' });
      
      if (error) {
        this.logger.error('Error inserting trending news:', error);
      }
    } catch (error) {
      this.logger.error('Error processing trending news item:', error.message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NewsCollector;
