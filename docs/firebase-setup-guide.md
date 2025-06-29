# Firebase Configuration Setup Guide

## Required Firebase Keys for Push Notifications

Your push notification system requires three different types of Firebase keys:

### 1. Client-Side Keys (Already Configured ✅)
These go in your `.env` file and are already set up:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBpNUxyC4stfKOuEoZiZOq0cxkvnGjTkHM
EXPO_PUBLIC_FIREBASE_PROJECT_ID=forex-signal-app-c0c32
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=245922029776
EXPO_PUBLIC_FIREBASE_APP_ID=1:245922029776:web:ad1ff5d97ac5e4e01d3ed5
EXPO_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

### 2. FCM Server Key (MISSING - NEEDS TO BE ADDED ❌)
This is required for Supabase Edge Functions to send push notifications.

**How to get it:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `forex-signal-app-c0c32`
3. Go to Project Settings (gear icon)
4. Click on "Cloud Messaging" tab
5. Under "Cloud Messaging API (Legacy)", copy the "Server Key"

**How to add it to Supabase:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Project Settings → Edge Functions
4. Add a new environment variable:
   - Name: `FCM_SERVER_KEY`
   - Value: `your_server_key_from_firebase`

### 3. Firebase Admin Credentials (Already Added ✅)
You mentioned you already have this in Supabase secrets:
```
FIREBASE_ADMIN_CREDENTIALS = {...}
```

## Current Status Check

### ✅ What you have:
- Client-side Firebase configuration
- VAPID key for web push
- Firebase Admin credentials

### ❌ What you're missing:
- **FCM_SERVER_KEY** in Supabase environment variables

## Steps to Fix:

1. **Get FCM Server Key from Firebase:**
   ```
   Firebase Console → Project Settings → Cloud Messaging → Server Key
   ```

2. **Add to Supabase Environment Variables:**
   ```
   Supabase Dashboard → Project Settings → Edge Functions → Environment Variables
   Name: FCM_SERVER_KEY
   Value: [your_server_key_from_step_1]
   ```

3. **Verify the setup:**
   - Your Edge Function should now be able to send push notifications
   - Test using the notification test panel in your app

## Troubleshooting

If you still have issues after adding the FCM_SERVER_KEY:

1. **Check the key format:** Make sure you copied the entire server key
2. **Restart Edge Functions:** Sometimes you need to redeploy after adding environment variables
3. **Check logs:** Look at your Edge Function logs in Supabase for any error messages

## Key Differences:

- **VAPID Key**: Used by web browsers to subscribe to push notifications
- **FCM Server Key**: Used by your server (Edge Functions) to send notifications to FCM
- **Admin Credentials**: Used for advanced Firebase Admin SDK operations

The Service Worker error you're seeing is just a StackBlitz limitation and won't affect your production deployment.