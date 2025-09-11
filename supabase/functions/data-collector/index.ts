import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data_type, symbols } = await req.json()

    if (data_type === 'stock_prices') {
      // Collect stock price data
      const yahooApiKey = Deno.env.get('YAHOO_FINANCE_API_KEY')
      if (!yahooApiKey) {
        throw new Error('YAHOO_FINANCE_API_KEY environment variable is not set')
      }

      for (const symbol of symbols) {
        try {
          // Fetch stock data from Yahoo Finance API
          const response = await fetch(
            `https://yahoofinance-stocks1.p.rapidapi.com/stock/${symbol}/history?period1=${Math.floor(Date.now() / 1000) - 86400}&period2=${Math.floor(Date.now() / 1000)}&interval=1d`,
            {
              headers: {
                'X-RapidAPI-Key': yahooApiKey,
                'X-RapidAPI-Host': 'yahoofinance-stocks1.p.rapidapi.com'
              }
            }
          )

          if (!response.ok) continue

          const data = await response.json()
          
          if (data.chart?.result?.[0]?.timestamp) {
            const timestamps = data.chart.result[0].timestamp
            const quotes = data.chart.result[0].indicators.quote[0]
            
            // Get stock info
            const { data: stockData } = await supabaseClient
              .from('stocks')
              .select('id')
              .eq('ticker', symbol)
              .single()

            if (!stockData) continue

            // Insert price data
            for (let i = 0; i < timestamps.length; i++) {
              if (quotes.open[i] && quotes.close[i]) {
                await supabaseClient
                  .from('stock_prices')
                  .upsert({
                    stock_id: stockData.id,
                    date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                    open: quotes.open[i],
                    close: quotes.close[i],
                    high: quotes.high[i],
                    low: quotes.low[i],
                    volume: quotes.volume[i] || 0
                  }, {
                    onConflict: 'stock_id,date'
                  })
              }
            }
          }
        } catch (error) {
          console.error(`Error collecting data for ${symbol}:`, error)
        }
      }
    } else if (data_type === 'news') {
      // Collect news data
      const googleNewsApiKey = Deno.env.get('GOOGLE_NEWS_API_KEY')
      if (!googleNewsApiKey) {
        throw new Error('GOOGLE_NEWS_API_KEY environment variable is not set')
      }

      for (const symbol of symbols) {
        try {
          // Fetch news from Google News API
          const response = await fetch(
            `https://newsapi.org/v2/everything?q=${symbol}&apiKey=${googleNewsApiKey}&language=en&sortBy=publishedAt&pageSize=20`
          )

          if (!response.ok) continue

          const data = await response.json()
          
          // Get stock info
          const { data: stockData } = await supabaseClient
            .from('stocks')
            .select('id')
            .eq('ticker', symbol)
            .single()

          if (!stockData) continue

          // Insert news data
          for (const article of data.articles || []) {
            await supabaseClient
              .from('news')
              .upsert({
                stock_id: stockData.id,
                headline: article.title,
                url: article.url,
                content: article.description,
                source: article.source.name,
                published_at: article.publishedAt,
                sentiment: 0, // Will be updated by AI analysis
                confidence: 0
              }, {
                onConflict: 'stock_id,url'
              })
          }
        } catch (error) {
          console.error(`Error collecting news for ${symbol}:`, error)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data collection completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in data collection:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
