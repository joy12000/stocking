'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Recommendation, Stock } from '@/types'
import { formatCurrency, formatPercent, getRecommendationColor, getRecommendationLabel, cn } from '@/lib/utils'
import { LoadingCard } from './loading-spinner'

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'US' | 'KR'>('US')

  useEffect(() => {
    fetchRecommendations()
  }, [activeTab])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      
      // Mock data for development
      const mockRecommendations = [
        {
          id: 1,
          stock_id: 1,
          score: 0.85,
          reason: '강한 상승 모멘텀과 긍정적 뉴스 감성',
          recommended_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          stock: {
            id: 1,
            ticker: 'AAPL',
            name: 'Apple Inc.',
            market: activeTab,
            created_at: new Date().toISOString()
          }
        },
        {
          id: 2,
          stock_id: 2,
          score: 0.78,
          reason: '기술적 지표 양호 및 거래량 증가',
          recommended_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          stock: {
            id: 2,
            ticker: 'MSFT',
            name: 'Microsoft Corporation',
            market: activeTab,
            created_at: new Date().toISOString()
          }
        }
      ]
      
      setRecommendations(mockRecommendations)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (score: number) => {
    if (score >= 0.7) return <TrendingUp className="w-4 h-4" />
    if (score >= 0.4) return <Minus className="w-4 h-4" />
    return <TrendingDown className="w-4 h-4" />
  }

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">오늘의 추천 종목</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">오늘의 추천 종목</h2>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('US')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
              activeTab === 'US'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            🇺🇸 미국
          </button>
          <button
            onClick={() => setActiveTab('KR')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
              activeTab === 'KR'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            🇰🇷 한국
          </button>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">추천 종목이 없습니다</h3>
          <p className="text-gray-600">
            매일 아침 7시에 새로운 추천 종목이 업데이트됩니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div key={rec.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {rec.stock?.ticker}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {rec.stock?.name}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(rec.score)}
                  <span className={cn(
                    'text-sm font-medium',
                    getRecommendationColor(rec.score)
                  )}>
                    {getRecommendationLabel(rec.score)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">추천 점수</span>
                  <span className="font-semibold text-gray-900">
                    {(rec.score * 100).toFixed(1)}점
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    {rec.reason}
                  </p>
                </div>

                <button className="w-full btn-primary text-sm">
                  상세 분석 보기
                  <ExternalLink className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
