'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, BarChart3, Calendar, Target } from 'lucide-react'
import { Recommendation } from '@/types'
import { formatPercent, getRecommendationColor, getRecommendationLabel, cn } from '@/lib/utils'

interface StockDetailModalProps {
  recommendation: Recommendation
  isOpen: boolean
  onClose: () => void
}

export function StockDetailModal({ recommendation, isOpen, onClose }: StockDetailModalProps) {
  const [analysisData, setAnalysisData] = useState({
    technicalScore: 0.75,
    sentimentScore: 0.82,
    volumeScore: 0.68,
    priceTarget: recommendation.stock?.market === 'KR' ? 85000 : 180.50,
    currentPrice: recommendation.stock?.market === 'KR' ? 78500 : 175.20,
    expectedReturn: 8.3
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const currency = recommendation.stock?.market === 'KR' ? '원' : '$'
  const priceChange = analysisData.priceTarget - analysisData.currentPrice
  const priceChangePercent = (priceChange / analysisData.currentPrice) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {recommendation.stock?.ticker}
            </h2>
            <p className="text-gray-600">{recommendation.stock?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 추천 점수 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">추천 점수</h3>
              <div className="flex items-center space-x-2">
                {recommendation.score >= 0.7 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span className={cn(
                  'text-lg font-bold',
                  getRecommendationColor(recommendation.score)
                )}>
                  {(recommendation.score * 100).toFixed(1)}점
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={cn(
                  'h-3 rounded-full transition-all duration-300',
                  recommendation.score >= 0.7 ? 'bg-green-500' : 
                  recommendation.score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${recommendation.score * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {getRecommendationLabel(recommendation.score)} 등급
            </p>
          </div>

          {/* 가격 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">현재가</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {analysisData.currentPrice.toLocaleString()}{currency}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">목표가</h4>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {analysisData.priceTarget.toLocaleString()}{currency}
              </p>
              <p className="text-sm text-green-600">
                {formatPercent(priceChangePercent)} 상승 여력
              </p>
            </div>
          </div>

          {/* 분석 지표 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">상세 분석</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">기술적 분석</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${analysisData.technicalScore * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {(analysisData.technicalScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">뉴스 감성</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${analysisData.sentimentScore * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {(analysisData.sentimentScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">거래량 분석</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${analysisData.volumeScore * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {(analysisData.volumeScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 추천 이유 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">추천 이유</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                {recommendation.reason}
              </p>
            </div>
          </div>

          {/* 추천 날짜 */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>추천일: {recommendation.recommended_date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
