import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call Supabase Edge Function to trigger daily analysis
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/daily-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0]
      })
    })

    if (!response.ok) {
      throw new Error(`Supabase function failed: ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Daily analysis triggered successfully',
      result
    })
  } catch (error) {
    console.error('Error in daily analysis cron:', error)
    return NextResponse.json(
      { error: 'Failed to trigger daily analysis' },
      { status: 500 }
    )
  }
}
