const cron = require('node-cron');
const winston = require('winston');
const StockCollector = require('./collectors/stock-collector');
const NewsCollector = require('./collectors/news-collector');
const Scheduler = require('./schedulers/scheduler');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'data-collector' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize collectors
const stockCollector = new StockCollector();
const newsCollector = new NewsCollector();
const scheduler = new Scheduler();

// Stock symbols to track
const US_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
  'CRM', 'ADBE', 'PYPL', 'UBER', 'LYFT', 'SQ', 'ROKU', 'ZM', 'DOCU', 'SNOW'
];

const KR_STOCKS = [
  '005930', '000660', '035420', '207940', '006400', '051910', '068270', '323410',
  '035720', '000270', '012330', '066570', '003550', '017670', '030200', '086280',
  '003490', '034730', '015760', '128940'
];

// Schedule data collection
function scheduleDataCollection() {
  // Collect stock prices every hour during market hours
  cron.schedule('0 9-16 * * 1-5', async () => {
    logger.info('Starting hourly stock price collection');
    try {
      await stockCollector.collectStockPrices(US_STOCKS, 'US');
      await stockCollector.collectStockPrices(KR_STOCKS, 'KR');
      logger.info('Hourly stock price collection completed');
    } catch (error) {
      logger.error('Error in hourly stock price collection:', error);
    }
  });

  // Collect news every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Starting news collection');
    try {
      await newsCollector.collectNews(US_STOCKS, 'US');
      await newsCollector.collectNews(KR_STOCKS, 'KR');
      logger.info('News collection completed');
    } catch (error) {
      logger.error('Error in news collection:', error);
    }
  });

  // Daily analysis at 7 AM
  cron.schedule('0 7 * * *', async () => {
    logger.info('Starting daily analysis');
    try {
      await scheduler.triggerDailyAnalysis();
      logger.info('Daily analysis completed');
    } catch (error) {
      logger.error('Error in daily analysis:', error);
    }
  });

  // Cleanup old data at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Starting data cleanup');
    try {
      await scheduler.cleanupOldData();
      logger.info('Data cleanup completed');
    } catch (error) {
      logger.error('Error in data cleanup:', error);
    }
  });
}

// Start the data collector
async function start() {
  logger.info('Starting StockPulse Data Collector');
  
  try {
    // Initialize collectors
    await stockCollector.initialize();
    await newsCollector.initialize();
    
    // Schedule data collection
    scheduleDataCollection();
    
    logger.info('Data collector started successfully');
    
    // Keep the process running
    process.on('SIGINT', () => {
      logger.info('Shutting down data collector');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start data collector:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  start();
}

module.exports = { start };
