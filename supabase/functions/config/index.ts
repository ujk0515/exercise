import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 환경변수에서 Supabase 설정 가져오기
    const config = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
      USER_ID: Deno.env.get('USER_ID') || '550e8400-e29b-41d4-a716-446655440000'
    }

    console.log('환경변수 설정 반환:', {
      hasUrl: !!config.SUPABASE_URL,
      hasKey: !!config.SUPABASE_ANON_KEY,
      userId: config.USER_ID
    })

    return new Response(
      JSON.stringify(config),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      },
    )
  } catch (error) {
    console.error('환경변수 로드 오류:', error)

    return new Response(
      JSON.stringify({ error: 'Failed to load configuration' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      },
    )
  }
})