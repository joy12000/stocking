export interface Stock {
  id: number
  ticker: string
  name: string
  market: 'US' | 'KR'
  created_at: string
}

export interface StockPrice {
  id: number
  stock_id: number
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  created_at: string
}

export interface News {
  id: number
  stock_id: number
  headline: string
  url: string
  sentiment: number // -1 ~ 1
  published_at: string
  created_at: string
  stock?: Stock
}

export interface Recommendation {
  id: number
  stock_id: number
  score: number
  reason: string
  recommended_date: string
  created_at: string
  stock?: Stock
}

export interface MarketData {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
}

export interface NewsItem {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
  sentiment?: number
}

export interface ChartData {
  date: string
  price: number
  volume?: number
}

export interface AnalysisResult {
  momentum: number
  sentiment: number
  volume: number
  finalScore: number
  recommendation: 'BUY' | 'HOLD' | 'SELL'
}
