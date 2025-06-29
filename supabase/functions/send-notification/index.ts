import { createClient } from 'npm:@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface NotificationPayload {
  type: 'signal' | 'achievement' | 'announcement' | 'alert';
  title: string;
  message: string;
  data?: any;
  target_user?: string;
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
      const payload: NotificationPayload = await req.json();

      // Insert notification into database
      const { data: notification, error: insertError } = await supabase
        .from('notifications')
        .insert({
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data,
          target_user: payload.target_user,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to insert notification: ${insertError.message}`);
      }

      // Get FCM tokens for target users
      let fcmTokensQuery = supabase
        .from('user_profiles')
        .select('fcm_token, user_id')
        .not('fcm_token', 'is', null);

      if (payload.target_user) {
        fcmTokensQuery = fcmTokensQuery.eq('user_id', payload.target_user);
      }

      const { data: userProfiles, error: profilesError } = await fcmTokensQuery;

      if (profilesError) {
        throw new Error(`Failed to get user profiles: ${profilesError.message}`);
      }

      // In a real implementation, you would send FCM notifications here
      // For now, we'll just mark the notification as sent
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      if (updateError) {
        console.error('Failed to update notification status:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          notification_id: notification.id,
          recipients: userProfiles?.length || 0,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // GET request - fetch recent notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ notifications }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Notification function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process notification',
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