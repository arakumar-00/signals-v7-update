// Enhanced Firebase Service Worker with Silent Notification Support
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js'
);

// Initialize Firebase
firebase.initializeApp({
  apiKey: 'AIzaSyBpNUxyC4stfKOuEoZiZOq0cxkvnGjTkHM',
  authDomain: 'forex-signal-app-c0c32.firebaseapp.com',
  projectId: 'forex-signal-app-c0c32',
  storageBucket: 'forex-signal-app-c0c32.firebasestorage.app',
  messagingSenderId: '245922029776',
  appId: '1:245922029776:web:ad1ff5d97ac5e4e01d3ed5',
  measurementId: 'G-VSC3CR04FV',
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Background message received:', payload);

  const { data } = payload;

  // Check if this is a silent notification
  if (data?.silent === 'true' || data?.type?.includes('background')) {
    console.log('🔇 Processing silent notification in background');
    
    // Send message to main app for silent processing
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SILENT_NOTIFICATION',
          payload: data,
        });
      });
    });

    // Don't show notification for silent types
    return;
  }

  // For non-silent notifications, show normal notification
  const notificationTitle = payload.notification?.title || data?.title || 'Trading Signal';
  const notificationOptions = {
    body: payload.notification?.body || data?.message || 'New trading opportunity available',
    icon: '/assets/images/icon.png',
    badge: '/assets/images/icon.png',
    data: data,
    tag: data?.type || 'default',
    requireInteraction: data?.type === 'signal',
    actions: data?.type === 'signal' ? [
      {
        action: 'view',
        title: 'View Signal',
        icon: '/assets/images/icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ] : undefined,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);

  event.notification.close();

  const { action, data } = event;

  // Handle different actions
  if (action === 'view' || !action) {
    // Open the app or focus existing window
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (self.clients.openWindow) {
          const url = data?.signal_id 
            ? `${self.location.origin}/signals?id=${data.signal_id}`
            : self.location.origin;
          return self.clients.openWindow(url);
        }
      })
    );
  } else if (action === 'dismiss') {
    // Just close the notification (already done above)
    console.log('📝 Notification dismissed');
  }
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Push subscription changed:', event);
  
  // Handle subscription renewal if needed
  event.waitUntil(
    // You could implement subscription renewal logic here
    Promise.resolve()
  );
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('🔧 Service worker installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('✅ Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle messages from main app
self.addEventListener('message', (event) => {
  console.log('📨 Message received in service worker:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});