-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create stocks table
CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  market VARCHAR(10) CHECK (market IN ('US', 'KR')) NOT NULL,
  sector VARCHAR(50),
  industry VARCHAR(100),
  market_cap BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_prices table
CREATE TABLE stock_prices (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open NUMERIC(10, 4),
  close NUMERIC(10, 4),
  high NUMERIC(10, 4),
  low NUMERIC(10, 4),
  volume BIGINT,
  adjusted_close NUMERIC(10, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stock_id, date)
);

-- Create news table
CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT,
  sentiment NUMERIC(3, 2) CHECK (sentiment >= -1 AND sentiment <= 1),
  confidence NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  source VARCHAR(100),
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stock_id, url)
);

-- Create recommendations table
CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
  score NUMERIC(3, 2) CHECK (score >= 0 AND score <= 1) NOT NULL,
  reason TEXT NOT NULL,
  momentum_score NUMERIC(3, 2),
  sentiment_score NUMERIC(3, 2),
  volume_score NUMERIC(3, 2),
  technical_score NUMERIC(3, 2),
  recommended_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stock_id, recommended_date)
);

-- Create market_data table for caching
CREATE TABLE market_data (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  market VARCHAR(10) CHECK (market IN ('US', 'KR')) NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, market)
);

-- Create indexes for better performance
CREATE INDEX idx_stocks_ticker ON stocks(ticker);
CREATE INDEX idx_stocks_market ON stocks(market);
CREATE INDEX idx_stock_prices_stock_id_date ON stock_prices(stock_id, date DESC);
CREATE INDEX idx_news_stock_id_published_at ON news(stock_id, published_at DESC);
CREATE INDEX idx_news_sentiment ON news(sentiment);
CREATE INDEX idx_recommendations_stock_id_date ON recommendations(stock_id, recommended_date DESC);
CREATE INDEX idx_recommendations_score ON recommendations(score DESC);
CREATE INDEX idx_market_data_symbol_market ON market_data(symbol, market);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_stocks_updated_at BEFORE UPDATE ON stocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables
CREATE POLICY "Allow public read access" ON stocks FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON stock_prices FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON news FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON recommendations FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON market_data FOR SELECT USING (true);

-- Insert some sample data
INSERT INTO stocks (ticker, name, market, sector, industry) VALUES
('AAPL', 'Apple Inc.', 'US', 'Technology', 'Consumer Electronics'),
('MSFT', 'Microsoft Corporation', 'US', 'Technology', 'Software'),
('GOOGL', 'Alphabet Inc.', 'US', 'Technology', 'Internet'),
('TSLA', 'Tesla Inc.', 'US', 'Consumer Discretionary', 'Electric Vehicles'),
('005930', '삼성전자', 'KR', 'Technology', 'Semiconductors'),
('000660', 'SK하이닉스', 'KR', 'Technology', 'Semiconductors'),
('035420', 'NAVER', 'KR', 'Technology', 'Internet'),
('207940', '삼성바이오로직스', 'KR', 'Healthcare', 'Biotechnology');

-- Create a function to get today's recommendations
CREATE OR REPLACE FUNCTION get_todays_recommendations()
RETURNS TABLE (
  recommendation_id INTEGER,
  stock_ticker VARCHAR(20),
  stock_name VARCHAR(100),
  market VARCHAR(10),
  score NUMERIC(3, 2),
  reason TEXT,
  momentum_score NUMERIC(3, 2),
  sentiment_score NUMERIC(3, 2),
  volume_score NUMERIC(3, 2),
  technical_score NUMERIC(3, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    s.ticker,
    s.name,
    s.market,
    r.score,
    r.reason,
    r.momentum_score,
    r.sentiment_score,
    r.volume_score,
    r.technical_score
  FROM recommendations r
  JOIN stocks s ON r.stock_id = s.id
  WHERE r.recommended_date = CURRENT_DATE
  ORDER BY r.score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get stock performance data
CREATE OR REPLACE FUNCTION get_stock_performance(ticker_param VARCHAR(20), days_param INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  open NUMERIC(10, 4),
  close NUMERIC(10, 4),
  high NUMERIC(10, 4),
  low NUMERIC(10, 4),
  volume BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.date,
    sp.open,
    sp.close,
    sp.high,
    sp.low,
    sp.volume
  FROM stock_prices sp
  JOIN stocks s ON sp.stock_id = s.id
  WHERE s.ticker = ticker_param
  AND sp.date >= CURRENT_DATE - INTERVAL '1 day' * days_param
  ORDER BY sp.date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
