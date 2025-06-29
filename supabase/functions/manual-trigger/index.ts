import { createClient } from 'npm:@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'both';

    console.log(`🚀 Manual trigger requested: ${action}`);

    const results = [];

    // Trigger signals update
    if (action === 'signals' || action === 'both') {
      console.log('📊 Triggering signals update...');

      try {
        const signalsResponse = await fetch(`${supabaseUrl}/functions/v1/update-signals`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
        });

        const signalsResult = await signalsResponse.json();
        results.push({
          type: 'signals',
          success: signalsResponse.ok,
          data: signalsResult,
        });

        console.log('✅ Signals update completed');
      } catch (error) {
        console.error('❌ Signals update failed:', error);
        results.push({
          type: 'signals',
          success: false,
          error: error.message,
        });
      }
    }

    // Trigger indicators update
    if (action === 'indicators' || action === 'both') {
      console.log('📈 Triggering indicators update...');

      try {
        const indicatorsResponse = await fetch(`${supabaseUrl}/functions/v1/update-indicators`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
        });

        const indicatorsResult = await indicatorsResponse.json();
        results.push({
          type: 'indicators',
          success: indicatorsResponse.ok,
          data: indicatorsResult,
        });

        console.log('✅ Indicators update completed');
      } catch (error) {
        console.error('❌ Indicators update failed:', error);
        results.push({
          type: 'indicators',
          success: false,
          error: error.message,
        });
      }
    }

    const allSuccessful = results.every(r => r.success);

    return new Response(
      JSON.stringify({
        success: allSuccessful,
        message: `Manual trigger completed for: ${action}`,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: allSuccessful ? 200 : 207, // 207 = Multi-Status
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Manual trigger error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to execute manual trigger',
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});