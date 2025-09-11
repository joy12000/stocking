import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      stocks: {
        Row: {
          id: number
          ticker: string
          name: string
          market: 'US' | 'KR'
          created_at: string
        }
        Insert: {
          id?: number
          ticker: string
          name: string
          market: 'US' | 'KR'
          created_at?: string
        }
        Update: {
          id?: number
          ticker?: string
          name?: string
          market?: 'US' | 'KR'
          created_at?: string
        }
      }
      stock_prices: {
        Row: {
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
        Insert: {
          id?: number
          stock_id: number
          date: string
          open: number
          close: number
          high: number
          low: number
          volume: number
          created_at?: string
        }
        Update: {
          id?: number
          stock_id?: number
          date?: string
          open?: number
          close?: number
          high?: number
          low?: number
          volume?: number
          created_at?: string
        }
      }
      news: {
        Row: {
          id: number
          stock_id: number
          headline: string
          url: string
          sentiment: number
          published_at: string
          created_at: string
        }
        Insert: {
          id?: number
          stock_id: number
          headline: string
          url: string
          sentiment: number
          published_at: string
          created_at?: string
        }
        Update: {
          id?: number
          stock_id?: number
          headline?: string
          url?: string
          sentiment?: number
          published_at?: string
          created_at?: string
        }
      }
      recommendations: {
        Row: {
          id: number
          stock_id: number
          score: number
          reason: string
          recommended_date: string
          created_at: string
        }
        Insert: {
          id?: number
          stock_id: number
          score: number
          reason: string
          recommended_date: string
          created_at?: string
        }
        Update: {
          id?: number
          stock_id?: number
          score?: number
          reason?: string
          recommended_date?: string
          created_at?: string
        }
      }
    }
  }
}
