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

    // Get AI server URL
    const aiServerUrl = Deno.env.get('AI_SERVER_URL')
    if (!aiServerUrl) {
      throw new Error('AI_SERVER_URL environment variable is not set')
    }

    // Trigger AI analysis
    const analysisResponse = await fetch(`${aiServerUrl}/api/analyze/daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0]
      })
    })

    if (!analysisResponse.ok) {
      throw new Error(`AI analysis failed: ${analysisResponse.statusText}`)
    }

    const analysisResult = await analysisResponse.json()

    // Store recommendations in database
    if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
      for (const rec of analysisResult.recommendations) {
        const { error } = await supabaseClient
          .from('recommendations')
          .upsert({
            stock_id: rec.stock_id,
            score: rec.score,
            reason: rec.reason,
            momentum_score: rec.momentum_score,
            sentiment_score: rec.sentiment_score,
            volume_score: rec.volume_score,
            technical_score: rec.technical_score,
            recommended_date: new Date().toISOString().split('T')[0]
          }, {
            onConflict: 'stock_id,recommended_date'
          })

        if (error) {
          console.error('Error storing recommendation:', error)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily analysis completed successfully',
        recommendations_count: analysisResult.recommendations?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in daily analysis:', error)
    
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
