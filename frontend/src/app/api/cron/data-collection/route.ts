import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call Supabase Edge Function to trigger data collection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    // Trigger stock data collection
    const stockResponse = await fetch(`${supabaseUrl}/functions/v1/data-collector`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_type: 'stock_prices',
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', '005930', '000660', '035420']
      })
    })

    // Trigger news collection
    const newsResponse = await fetch(`${supabaseUrl}/functions/v1/data-collector`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_type: 'news',
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', '005930', '000660', '035420']
      })
    })

    const stockResult = await stockResponse.json()
    const newsResult = await newsResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Data collection triggered successfully',
      results: {
        stock_collection: stockResult,
        news_collection: newsResult
      }
    })
  } catch (error) {
    console.error('Error in data collection cron:', error)
    return NextResponse.json(
      { error: 'Failed to trigger data collection' },
      { status: 500 }
    )
  }
}
