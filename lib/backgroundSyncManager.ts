import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { silentNotificationHandler, SilentNotificationType } from './silentNotificationHandler';

export interface BackgroundSyncConfig {
  enabled: boolean;
  interval: number; // in minutes
  types: SilentNotificationType[];
  lastSync: string;
}

export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private config: BackgroundSyncConfig = {
    enabled: true,
    interval: 15, // 15 minutes default
    types: ['background-sync', 'price-update', 'signal-refresh'],
    lastSync: new Date().toISOString(),
  };

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  async initialize(): Promise<void> {
    console.log('🔄 Initializing Background Sync Manager...');
    
    // Load saved configuration
    await this.loadConfig();
    
    // Initialize silent notification handler
    await silentNotificationHandler.initialize();
    
    // Set up periodic sync if enabled
    if (this.config.enabled) {
      this.setupPeriodicSync();
    }
    
    console.log('✅ Background Sync Manager initialized');
  }

  // Load configuration from storage
  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem('background_sync_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Error loading background sync config:', error);
    }
  }

  // Save configuration to storage
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('background_sync_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving background sync config:', error);
    }
  }

  // Set up periodic background sync
  private setupPeriodicSync(): void {
    if (Platform.OS === 'web') {
      // Web: Use setInterval for periodic sync
      setInterval(() => {
        this.performBackgroundSync();
      }, this.config.interval * 60 * 1000);
    } else {
      // Mobile: Background sync will be triggered by push notifications
      console.log('📱 Mobile background sync will be triggered by push notifications');
    }
  }

  // Perform background sync
  async performBackgroundSync(): Promise<void> {
    console.log('🔄 Performing background sync...');
    
    try {
      // Execute each configured sync type
      for (const type of this.config.types) {
        await silentNotificationHandler.handleSilentNotification({
          type,
          silent: true,
          timestamp: new Date().toISOString(),
        });
      }

      // Update last sync time
      this.config.lastSync = new Date().toISOString();
      await this.saveConfig();

      console.log('✅ Background sync completed');
    } catch (error) {
      console.error('❌ Background sync failed:', error);
    }
  }

  // Update configuration
  async updateConfig(newConfig: Partial<BackgroundSyncConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
    
    console.log('🔧 Background sync config updated:', this.config);
  }

  // Get current configuration
  getConfig(): BackgroundSyncConfig {
    return { ...this.config };
  }

  // Enable/disable background sync
  async setEnabled(enabled: boolean): Promise<void> {
    await this.updateConfig({ enabled });
    
    if (enabled) {
      this.setupPeriodicSync();
    }
  }

  // Trigger manual sync
  async triggerManualSync(types?: SilentNotificationType[]): Promise<void> {
    const syncTypes = types || this.config.types;
    
    console.log('🔄 Triggering manual sync for:', syncTypes);
    
    for (const type of syncTypes) {
      await silentNotificationHandler.handleSilentNotification({
        type,
        silent: true,
        timestamp: new Date().toISOString(),
        payload: { action: 'manual-trigger' },
      });
    }
  }
}

// Export singleton instance
export const backgroundSyncManager = BackgroundSyncManager.getInstance();