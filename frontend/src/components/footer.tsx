'use client'

import { TrendingUp, Github, Twitter, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">StockPulse</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI 기반 주식 추천 서비스로 더 나은 투자 결정을 내리세요.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">서비스</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/recommendations" className="hover:text-white transition-colors">추천 종목</a></li>
              <li><a href="/news" className="hover:text-white transition-colors">뉴스 분석</a></li>
              <li><a href="/analysis" className="hover:text-white transition-colors">시장 분석</a></li>
              <li><a href="/portfolio" className="hover:text-white transition-colors">포트폴리오</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">회사</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/about" className="hover:text-white transition-colors">소개</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">문의</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">이용약관</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">소셜</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/stockpulse"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/stockpulse"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@stockpulse.com"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 StockPulse. All rights reserved.</p>
          <p className="mt-2">
            투자에 대한 모든 결정은 본인의 책임입니다. 
            본 서비스는 투자 조언이 아닌 정보 제공 목적입니다.
          </p>
        </div>
      </div>
    </footer>
  )
}
