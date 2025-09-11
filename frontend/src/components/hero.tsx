'use client'

import { TrendingUp, Globe, BarChart3, Clock } from 'lucide-react'

export function Hero() {
  return (
    <section className="text-center py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          AI 기반{' '}
          <span className="text-gradient">주식 추천</span>
          <br />
          매일 아침 새로운 기회를 발견하세요
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          글로벌 뉴스와 주가 데이터를 AI로 분석하여 최적의 투자 기회를 제공합니다.
          미국과 한국 주식 시장을 모두 커버합니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">실시간 분석</h3>
            <p className="text-sm text-gray-600">
              AI가 실시간으로 주가와 뉴스를 분석합니다
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">글로벌 커버리지</h3>
            <p className="text-sm text-gray-600">
              미국과 한국 주식 시장을 모두 지원합니다
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">데이터 기반</h3>
            <p className="text-sm text-gray-600">
              객관적인 데이터와 알고리즘으로 추천합니다
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">매일 갱신</h3>
            <p className="text-sm text-gray-600">
              매일 아침 새로운 추천 종목을 제공합니다
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
