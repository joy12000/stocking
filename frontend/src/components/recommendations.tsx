'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Recommendation, Stock } from '@/types'
import { formatCurrency, formatPercent, getRecommendationColor, getRecommendationLabel, cn } from '@/lib/utils'
import { LoadingCard } from './loading-spinner'
import { StockDetailModal } from './stock-detail-modal'
import { getCachedStockPrice } from '@/lib/stockApi'

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'US' | 'KR'>('US')
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(3)
  const [stockPrices, setStockPrices] = useState<Record<string, any>>({})
  const [priceLoading, setPriceLoading] = useState<Record<string, boolean>>({})
  const itemsPerLoad = 3

  const fetchStockPrices = async (recs: Recommendation[]) => {
    const prices: Record<string, any> = {}
    const loadingStates: Record<string, boolean> = {}
    
    for (const rec of recs) {
      if (!rec.stock) continue
      
      const cacheKey = `${rec.stock.market}:${rec.stock.ticker}`
      loadingStates[cacheKey] = true
      
      try {
        const priceData = await getCachedStockPrice(rec.stock.ticker, rec.stock.market)
        if (priceData) {
          prices[cacheKey] = {
            current: priceData.close,
            previousClose: priceData.open, 
            change: priceData.close - priceData.open,
            changePercent: ((priceData.close - priceData.open) / priceData.open) * 100
          }
        }
      } catch (error) {
        console.error(`Error fetching price for ${rec.stock.ticker}:`, error)
      } finally {
        loadingStates[cacheKey] = false
      }
    }
    
    setStockPrices(prev => ({ ...prev, ...prices }))
    setPriceLoading(prev => ({ ...prev, ...loadingStates }))
  }

  useEffect(() => {
    fetchRecommendations()
  }, [activeTab])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      
      const mockRecommendations: Recommendation[] = [
        {
          id: 1,
          stock_id: 1,
          score: 0.85,
          reason: '강한 상승 모멘텀과 긍정적 뉴스 감성. AI 칩 수요 증가로 인한 성장 전망이 밝으며, 최근 실적 발표에서 예상을 상회하는 결과를 보였습니다.',
          recommended_date: new Date().toISOString().split('T')[0],
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
          score: 0.78,
          reason: '기술적 지표 양호 및 거래량 증가. 클라우드 서비스 부문의 지속적인 성장과 AI 기술 투자 확대로 인한 장기적 성장 동력이 확보되었습니다.',
          recommended_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          stock: {
            id: 2,
            ticker: 'MSFT',
            name: 'Microsoft Corporation',
            market: 'US',
            created_at: new Date().toISOString()
          }
        },
        {
          id: 3,
          stock_id: 3,
          score: 0.72,
          reason: 'GPU 시장 독점적 지위 유지. 데이터센터 및 AI 훈련용 칩 수요 급증으로 매출 성장세가 지속되고 있으며, 향후 전망도 긍정적입니다.',
          recommended_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          stock: {
            id: 3,
            ticker: 'NVDA',
            name: 'NVIDIA Corporation',
            market: 'US',
            created_at: new Date().toISOString()
          }
        }
      ] : [
        {
          id: 4,
          stock_id: 4,
          score: 0.82,
          reason: '반도체 업황 회복 신호와 메모리 가격 상승. 글로벌 메모리 반도체 시장에서의 기술 우위를 바탕으로 수익성 개선이 기대됩니다.',
          recommended_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          stock: {
            id: 4,
            ticker: '005930',
            name: '삼성전자',
            market: 'KR',
            created_at: new Date().toISOString()
          }
        },
        {
          id: 5,
          stock_id: 5,
          score: 0.75,
          reason: '2차전지 시장 성장과 ESS 사업 확장. 전기차 시장 성장에 따른 배터리 수요 증가와 에너지저장시스템 사업의 본격적인 성장이 예상됩니다.',
          recommended_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          stock: {
            id: 5,
            ticker: '373220',
            name: 'LG에너지솔루션',
            market: 'KR',
            created_at: new Date().toISOString()
          }
        },
        {
          id: 6,
          stock_id: 6,
          score: 0.69,
          reason: '바이오 신약 개발 파이프라인 강화. 항암제 및 면역치료제 개발 진전으로 장기적 성장 가능성이 높아지고 있습니다.',
          recommended_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          stock: {
            id: 6,
            ticker: '207940',
            name: '삼성바이오로직스',
            market: 'KR',
            created_at: new Date().toISOString()
          }
        }
      ]
      
      setRecommendations(mockRecommendations)
      await fetchStockPrices(mockRecommendations)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDetailClick = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedRecommendation(null)
  }

  const getTrendIcon = (score: number) => {
    if (score >= 0.7) return <TrendingUp className="w-4 h-4" />
    if (score >= 0.4) return <Minus className="w-4 h-4" />
    return <TrendingDown className="w-4 h-4" />
  }

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + itemsPerLoad)
  }

  const renderPriceInfo = (stock: Stock) => {
    if (!stock) return null
    
    const cacheKey = `${stock.market}:${stock.ticker}`
    const priceData = stockPrices[cacheKey]
    const isLoading = priceLoading[cacheKey]
    
    if (isLoading) {
      return (
        <div className="h-6 flex items-center">
          <div className="animate-pulse h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      )
    }
    
    if (!priceData) {
      return (
        <div className="text-sm text-gray-500">가격 정보 없음</div>
      )
    }
    
    const isPositive = priceData.change >= 0
    const priceColor = isPositive ? 'text-green-600' : 'text-red-600'
    const ChangeIcon = isPositive ? ArrowUp : ArrowDown
    
    return (
      <div className="space-y-1">
        <div className="flex items-baseline space-x-2">
          <span className="text-lg font-semibold">
            {formatCurrency(priceData.current, stock.market === 'KR' ? 'KRW' : 'USD')}
          </span>
          <span className={`text-sm ${priceColor} flex items-center`}>
            <ChangeIcon className="w-3 h-3 mr-0.5" />
            {formatPercent(priceData.changePercent / 100)}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          전일대비: {formatCurrency(priceData.change, stock.market === 'KR' ? 'KRW' : 'USD', true)}
        </div>
      </div>
    )
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {recommendations.slice(0, visibleCount).map((rec) => (
              <div key={rec.id} className="card hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {activeTab === 'KR' ? rec.stock?.name : rec.stock?.ticker}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {activeTab === 'KR' ? rec.stock?.ticker : rec.stock?.name}
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
                  {rec.stock && renderPriceInfo(rec.stock)}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">추천 점수</span>
                    <span className="font-semibold text-gray-900">
                      {(rec.score * 100).toFixed(1)}점
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {rec.reason}
                    </p>
                  </div>

                  <button 
                    onClick={() => handleDetailClick(rec)}
                    className="w-full btn-primary text-sm hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                  >
                    상세 분석 보기
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {visibleCount < recommendations.length && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                + 더보기 ({recommendations.length - visibleCount}개 더)
              </button>
            </div>
          )}
        </>
      )}

      {selectedRecommendation && (
        <StockDetailModal
          recommendation={selectedRecommendation}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </section>
  )
}
