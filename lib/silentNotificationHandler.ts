import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import { getCurrentDeviceId } from './fcmManager';

// Silent notification types
export type SilentNotificationType = 
  | 'background-sync'
  | 'price-update'
  | 'signal-refresh'
  | 'cache-invalidate'
  | 'system-maintenance'
  | 'market-data-sync';

export interface SilentNotificationPayload {
  type: SilentNotificationType;
  silent: boolean;
  payload?: {
    action?: string;
    pairs?: string[];
    data?: any;
  };
  timestamp: string;
}

export interface SilentNotificationResult {
  success: boolean;
  executedAt: string;
  action: string;
  result?: any;
  error?: string;
}

// Silent notification handler for mobile and web
export class SilentNotificationHandler {
  private static instance: SilentNotificationHandler;
  private isInitialized = false;

  static getInstance(): SilentNotificationHandler {
    if (!SilentNotificationHandler.instance) {
      SilentNotificationHandler.instance = new SilentNotificationHandler();
    }
    return SilentNotificationHandler.instance;
  }

  // Initialize silent notification handling
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔇 Initializing Silent Notification Handler...');

    if (Platform.OS === 'web') {
      await this.initializeWebHandler();
    } else {
      await this.initializeMobileHandler();
    }

    this.isInitialized = true;
    console.log('✅ Silent Notification Handler initialized');
  }

  // Web-specific initialization
  private async initializeWebHandler(): Promise<void> {
    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SILENT_NOTIFICATION') {
          this.handleSilentNotification(event.data.payload);
        }
      });
    }
  }

  // Mobile-specific initialization
  private async initializeMobileHandler(): Promise<void> {
    // Listen for background notifications
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      
      // Check if this is a silent notification
      if (data?.silent === true || data?.type?.includes('background')) {
        this.handleSilentNotification(data as SilentNotificationPayload);
      }
    });

    // Store subscription for cleanup if needed
    return Promise.resolve();
  }

  // Main silent notification handler
  async handleSilentNotification(payload: SilentNotificationPayload): Promise<SilentNotificationResult> {
    console.log('🔇 Processing silent notification:', payload.type);

    const startTime = Date.now();
    let result: SilentNotificationResult = {
      success: false,
      executedAt: new Date().toISOString(),
      action: payload.type,
    };

    try {
      switch (payload.type) {
        case 'background-sync':
          result = await this.handleBackgroundSync(payload);
          break;
        
        case 'price-update':
          result = await this.handlePriceUpdate(payload);
          break;
        
        case 'signal-refresh':
          result = await this.handleSignalRefresh(payload);
          break;
        
        case 'cache-invalidate':
          result = await this.handleCacheInvalidate(payload);
          break;
        
        case 'system-maintenance':
          result = await this.handleSystemMaintenance(payload);
          break;
        
        case 'market-data-sync':
          result = await this.handleMarketDataSync(payload);
          break;
        
        default:
          throw new Error(`Unknown silent notification type: ${payload.type}`);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ Silent notification processed in ${executionTime}ms:`, result);

      // Log successful execution
      await this.logSilentNotification(payload, result, executionTime);

    } catch (error) {
      console.error('❌ Silent notification error:', error);
      result = {
        success: false,
        executedAt: new Date().toISOString(),
        action: payload.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // Log error
      await this.logSilentNotification(payload, result);
    }

    return result;
  }

  // Background sync handler
  private async handleBackgroundSync(payload: SilentNotificationPayload): Promise<SilentNotificationResult> {
    console.log('🔄 Executing background sync...');

    // Simulate background sync operations
    const actions = payload.payload?.action ? [payload.payload.action] : [
      'refresh-market-data',
      'sync-signals',
      'update-indicators'
    ];

    const results = [];
    for (const action of actions) {
      switch (action) {
        case 'refresh-market-data':
          // Trigger market data refresh
          results.push('market-data-refreshed');
          break;
        case 'sync-signals':
          // Trigger signal synchronization
          results.push('signals-synced');
          break;
        case 'update-indicators':
          // Trigger indicator updates
          results.push('indicators-updated');
          break;
      }
    }

    return {
      success: true,
      executedAt: new Date().toISOString(),
      action: 'background-sync',
      result: { actions: results },
    };
  }

  // Price update handler
  private async handlePriceUpdate(payload: SilentNotificationPayload): Promise<SilentNotificationResult> {
    console.log('💰 Processing price update...');

    const pairs = payload.payload?.pairs || ['XAU/USD', 'XAG/USD'];
    
    // Simulate price cache update
    const updatedPairs = pairs.map(pair => ({
      pair,
      updated: true,
      timestamp: new Date().toISOString(),
    }));

    return {
      success: true,
      executedAt: new Date().toISOString(),
      action: 'price-update',
      result: { updatedPairs },
    };
  }

  // Signal refresh handler
  private async handleSignalRefresh(payload: SilentNotificationPayload): Promise<SilentNotificationResult> {
    console.log('📊 Refreshing signals...');

    // Simulate signal refresh
    const refreshResult = {
      signalsRefreshed: true,
      count: Math.floor(Math.random() * 10) + 1,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      executedAt: new Date().toISOString(),
      action: 'signal-refresh',
      result: refreshResult,
    };
  }

  // Cache invalidate handler
  private async handleCacheInvalidate(payload: SilentNotificationPayload): Promise<SilentNotificationResult> {
    console.log('🗑️ Invalidating cache...');

    // Simulate cache invalidation
    const cacheResult = {
      cacheCleared: true,
      itemsRemoved: Math.floor(Math.random() * 50) + 10,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      executedAt: new Date().toISOString(),
      action: 'cache-invalidate',
      result: cacheResult,
    };
  }

  // System maintenance handler
  private async handleSystemMaintenance(payload: SilentNotificationPayload): Promise<SilentNotificationResult> {
    console.log('🔧 Processing system maintenance...');

    // Simulate maintenance tasks
    const maintenanceResult = {
      maintenanceCompleted: true,
      tasksExecuted: ['cleanup-logs', 'optimize-database', 'refresh-cache'],
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      executedAt: new Date().toISOString(),
      action: 'system-maintenance',
      result: maintenanceResult,
    };
  }

  // Market data sync handler
  private async handleMarketDataSync(payload: SilentNotificationPayload): Promise<SilentNotificationResult> {
    console.log('📈 Syncing market data...');

    // Simulate market data sync
    const syncResult = {
      dataSynced: true,
      pairsUpdated: payload.payload?.pairs || ['XAU/USD', 'XAG/USD', 'BTC/USD'],
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      executedAt: new Date().toISOString(),
      action: 'market-data-sync',
      result: syncResult,
    };
  }

  // Log silent notification execution to database
  private async logSilentNotification(
    payload: SilentNotificationPayload,
    result: SilentNotificationResult,
    executionTime?: number
  ): Promise<void> {
    try {
      const deviceId = await getCurrentDeviceId();
      
      // Log to silent_notifications table
      const { error: silentError } = await supabase
        .from('silent_notifications')
        .insert({
          device_id: deviceId,
          type: payload.type,
          payload: payload.payload || {},
          execution_time_ms: executionTime || 0,
          success: result.success,
          result: result.result || {},
          error_message: result.error || null,
          platform: Platform.OS,
        });

      if (silentError) {
        console.error('❌ Failed to log to silent_notifications:', silentError);
      } else {
        console.log('✅ Silent notification logged to database');
      }

      // Also log to general notifications table for tracking
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          type: 'alert',
          title: `Silent: ${payload.type}`,
          message: `Executed ${payload.type} silently`,
          data: {
            payload,
            result,
            executionTime,
            platform: Platform.OS,
            silent: true,
          },
          status: result.success ? 'sent' : 'failed',
          sent_at: new Date().toISOString(),
        });

      if (notificationError) {
        console.error('❌ Failed to log to notifications:', notificationError);
      }

    } catch (error) {
      console.error('❌ Error logging silent notification:', error);
    }
  }
}

// Export singleton instance
export const silentNotificationHandler = SilentNotificationHandler.getInstance();