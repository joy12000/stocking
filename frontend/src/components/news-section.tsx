'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { News } from '@/types'
import { formatRelativeTime, getSentimentColor, getSentimentLabel } from '@/lib/utils'
import { LoadingCard } from './loading-spinner'

export function NewsSection() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      
      // Mock data for development
      const mockNews = [
        {
          id: 1,
          stock_id: 1,
          headline: 'Apple Reports Strong Q4 Earnings, Stock Surges',
          url: 'https://example.com/news1',
          sentiment: 0.8,
          published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          stock: {
            id: 1,
            ticker: 'AAPL',
            name: 'Apple Inc.',
            market: 'US',
            created_at: new Date().toISOString()
          }
        },
        {
          id: 2,
          stock_id: 2,
          headline: 'Microsoft Azure Growth Accelerates in Cloud Market',
          url: 'https://example.com/news2',
          sentiment: 0.6,
          published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          stock: {
            id: 2,
            ticker: 'MSFT',
            name: 'Microsoft Corporation',
            market: 'US',
            created_at: new Date().toISOString()
          }
        }
      ]
      
      setNews(mockNews)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.1) return <TrendingUp className="w-4 h-4" />
    if (sentiment < -0.1) return <TrendingDown className="w-4 h-4" />
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />
  }

  if (loading) {
    return (
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">최신 뉴스</h2>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">최신 뉴스</h2>

      {news.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">뉴스가 없습니다</h3>
          <p className="text-gray-600">
            최근 24시간 내에 수집된 뉴스가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getSentimentIcon(item.sentiment)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {item.stock?.ticker}
                    </span>
                    <span className={getSentimentColor(item.sentiment)}>
                      {getSentimentLabel(item.sentiment)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {item.headline}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatRelativeTime(item.published_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>감성 점수:</span>
                      <span className={getSentimentColor(item.sentiment)}>
                        {(item.sentiment * 100).toFixed(1)}점
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
