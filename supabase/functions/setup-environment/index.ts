import { createClient } from 'npm:@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface EnvironmentSetup {
  supabase_url: string;
  service_role_key: string;
}

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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      const { supabase_url, service_role_key }: EnvironmentSetup = await req.json();

      // Update the database settings for the trigger function
      const { error: settingsError } = await supabase.rpc('set_config', {
        setting_name: 'app.settings.supabase_url',
        new_value: supabase_url,
        is_local: false
      });

      if (settingsError) {
        console.error('Error setting supabase_url:', settingsError);
      }

      const { error: keyError } = await supabase.rpc('set_config', {
        setting_name: 'app.settings.service_role_key',
        new_value: service_role_key,
        is_local: false
      });

      if (keyError) {
        console.error('Error setting service_role_key:', keyError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Environment variables configured for database triggers',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // GET request - return current configuration status
    return new Response(
      JSON.stringify({
        configured: true,
        supabase_url: supabaseUrl,
        has_service_key: !!supabaseServiceKey,
        fcm_configured: !!Deno.env.get('FCM_SERVER_KEY'),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Setup environment error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to setup environment',
        details: error.message 
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