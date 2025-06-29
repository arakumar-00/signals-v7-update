import { createClient } from 'npm:@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface PushNotificationPayload {
  type: 'signal' | 'achievement' | 'announcement' | 'alert';
  title: string;
  message: string;
  data?: any;
  target_user?: string;
  target_device_ids?: string[];
}

interface FCMv1Message {
  message: {
    token?: string;
    notification?: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
    webpush?: {
      headers?: Record<string, string>;
      notification?: {
        icon?: string;
        badge?: string;
        click_action?: string;
      };
      fcm_options?: {
        link?: string;
      };
    };
    android?: {
      notification?: {
        icon?: string;
        color?: string;
        sound?: string;
        click_action?: string;
      };
      data?: Record<string, string>;
    };
    apns?: {
      payload?: {
        aps?: {
          alert?: {
            title?: string;
            body?: string;
          };
          sound?: string;
          badge?: number;
        };
      };
    };
  };
}

// Generate OAuth2 access token using service account
async function getAccessToken(): Promise<string> {
  try {
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_ADMIN_CREDENTIALS') || '{}');
    
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Invalid Firebase service account credentials');
    }

    // Create JWT for Google OAuth2
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600, // 1 hour
    };

    // Create JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    // Create signature using Web Crypto API
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(`${encodedHeader}.${encodedPayload}`);
    
    // Import private key
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      textEncoder.encode(serviceAccount.private_key),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Sign the JWT
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, data);
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;

  } catch (error) {
    console.error('❌ Error getting access token:', error);
    throw new Error(`Failed to generate access token: ${error.message}`);
  }
}

// Send FCM v1 notification
async function sendFCMv1Notification(tokens: string[], notification: any): Promise<{ success: boolean; results?: any; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    const projectId = 'forex-signal-app-c0c32'; // Your Firebase project ID
    
    const results = [];
    
    // Send to each token individually (FCM v1 doesn't support batch sending)
    for (const token of tokens) {
      const message: FCMv1Message = {
        message: {
          token: token,
          notification: {
            title: notification.title,
            body: notification.message,
          },
          data: {
            ...notification.data,
            notification_id: notification.id,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          webpush: {
            headers: {
              TTL: '86400', // 24 hours
            },
            notification: {
              icon: '/assets/images/icon.png',
              badge: '/assets/images/icon.png',
              click_action: '/',
            },
            fcm_options: {
              link: '/',
            },
          },
          android: {
            notification: {
              icon: 'ic_notification',
              color: '#31954b',
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            data: {
              ...notification.data,
              notification_id: notification.id,
            },
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: notification.title,
                  body: notification.message,
                },
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      };

      try {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ FCM v1 request failed for token ${token.substring(0, 20)}...:`, response.status, errorText);
          results.push({ 
            token: token.substring(0, 20) + '...', 
            success: false, 
            error: `${response.status}: ${errorText}` 
          });
        } else {
          const result = await response.json();
          console.log(`✅ FCM v1 message sent successfully to ${token.substring(0, 20)}...:`, result.name);
          results.push({ 
            token: token.substring(0, 20) + '...', 
            success: true, 
            messageId: result.name 
          });
        }
      } catch (error) {
        console.error(`❌ Error sending to token ${token.substring(0, 20)}...:`, error);
        results.push({ 
          token: token.substring(0, 20) + '...', 
          success: false, 
          error: error.message 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`📊 FCM v1 batch results: ${successCount} success, ${failureCount} failed`);

    return {
      success: successCount > 0,
      results: {
        total_sent: successCount,
        total_failed: failureCount,
        details: results,
      },
    };

  } catch (error) {
    console.error('❌ FCM v1 batch send error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Send Expo push notification (unchanged)
async function sendExpoNotification(tokens: string[], notification: any): Promise<{ success: boolean; results?: any; error?: string }> {
  const expoPushTokens = tokens.filter(token => token.startsWith('ExponentPushToken'));
  
  if (expoPushTokens.length === 0) {
    return { success: false, error: 'No Expo push tokens found' };
  }

  const messages = expoPushTokens.map(token => ({
    to: token,
    sound: 'default',
    title: notification.title,
    body: notification.message,
    data: {
      ...notification.data,
      notification_id: notification.id,
    },
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expo push request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Expo push sent successfully:', result);

    return {
      success: true,
      results: result,
    };
  } catch (error) {
    console.error('❌ Error sending Expo push notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
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
      const payload: PushNotificationPayload = await req.json();

      console.log('📨 Processing push notification:', {
        type: payload.type,
        title: payload.title,
        target_user: payload.target_user,
      });

      // Create notification record if not exists
      let notificationId = payload.data?.notification_id;
      
      if (!notificationId) {
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

        notificationId = notification.id;
      }

      // Get FCM tokens for target users
      let fcmTokensQuery = supabase
        .from('user_profiles')
        .select('fcm_token, user_id, device_type')
        .not('fcm_token', 'is', null);

      if (payload.target_user) {
        fcmTokensQuery = fcmTokensQuery.eq('user_id', payload.target_user);
      } else if (payload.target_device_ids && payload.target_device_ids.length > 0) {
        fcmTokensQuery = fcmTokensQuery.in('user_id', payload.target_device_ids);
      }

      const { data: userProfiles, error: profilesError } = await fcmTokensQuery;

      if (profilesError) {
        throw new Error(`Failed to get user profiles: ${profilesError.message}`);
      }

      console.log(`📱 Found ${userProfiles?.length || 0} user profiles with FCM tokens`);

      const allTokens = userProfiles?.map(profile => profile.fcm_token).filter(Boolean) || [];
      
      // Separate FCM tokens from Expo tokens
      const fcmTokens = allTokens.filter(token => !token.startsWith('ExponentPushToken'));
      const expoTokens = allTokens.filter(token => token.startsWith('ExponentPushToken'));

      const sendResults = [];

      // Send FCM v1 notifications
      if (fcmTokens.length > 0) {
        console.log(`📨 Sending FCM v1 notifications to ${fcmTokens.length} tokens`);
        const fcmResult = await sendFCMv1Notification(fcmTokens, {
          id: notificationId,
          title: payload.title,
          message: payload.message,
          data: payload.data,
        });
        sendResults.push({ type: 'fcm_v1', ...fcmResult });
      }

      // Send Expo notifications
      if (expoTokens.length > 0) {
        console.log(`📨 Sending Expo notifications to ${expoTokens.length} tokens`);
        const expoResult = await sendExpoNotification(expoTokens, {
          id: notificationId,
          title: payload.title,
          message: payload.message,
          data: payload.data,
        });
        sendResults.push({ type: 'expo', ...expoResult });
      }

      // Determine overall success
      const overallSuccess = sendResults.some(result => result.success);

      // Update notification status
      if (notificationId) {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            status: overallSuccess ? 'sent' : 'failed',
            sent_at: new Date().toISOString(),
          })
          .eq('id', notificationId);

        if (updateError) {
          console.error('❌ Failed to update notification status:', updateError);
        }

        // Log to notification_logs
        const { error: logError } = await supabase
          .from('notification_logs')
          .insert({
            notification_id: notificationId,
            status: overallSuccess ? 'sent' : 'failed',
            result: {
              fcm_tokens: fcmTokens.length,
              expo_tokens: expoTokens.length,
              send_results: sendResults,
              api_version: 'FCM_v1',
            },
            error_message: overallSuccess ? null : 'Some notifications failed to send',
          });

        if (logError) {
          console.error('❌ Failed to log notification:', logError);
        }
      }

      return new Response(
        JSON.stringify({
          success: overallSuccess,
          notification_id: notificationId,
          recipients: userProfiles?.length || 0,
          fcm_tokens: fcmTokens.length,
          expo_tokens: expoTokens.length,
          send_results: sendResults,
          api_version: 'FCM_v1',
          migration_status: 'completed',
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
    console.error('❌ Notification function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process notification',
        details: error.message,
        api_version: 'FCM_v1',
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