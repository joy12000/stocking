import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'KRW',
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'yyyy-MM-dd', { locale: ko })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: ko })
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: ko 
  })
}

export function getSentimentColor(sentiment: number): string {
  if (sentiment > 0.1) return 'text-success-600'
  if (sentiment < -0.1) return 'text-danger-600'
  return 'text-gray-600'
}

export function getSentimentLabel(sentiment: number): string {
  if (sentiment > 0.1) return '긍정적'
  if (sentiment < -0.1) return '부정적'
  return '중립'
}

export function getRecommendationColor(score: number): string {
  if (score >= 0.7) return 'text-success-600'
  if (score >= 0.4) return 'text-yellow-600'
  return 'text-danger-600'
}

export function getRecommendationLabel(score: number): string {
  if (score >= 0.7) return '강력 추천'
  if (score >= 0.4) return '보통'
  return '주의'
}

export function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
