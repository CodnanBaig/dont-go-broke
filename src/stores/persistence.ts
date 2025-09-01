import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateCreator } from 'zustand';

// Storage keys
export const STORAGE_KEYS = {
  APP_STORE: '@fuel-tracker/app-store',
  NOTIFICATION_STORE: '@fuel-tracker/notification-store', 
  SUGGESTIONS_STORE: '@fuel-tracker/suggestions-store',
  USER_PREFERENCES: '@fuel-tracker/user-preferences'
};

// Generic persistence interface
export interface PersistOptions<T> {
  name: string;
  storage?: Storage;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: () => void;
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
}

// Custom AsyncStorage wrapper that matches Zustand's Storage interface
export const createAsyncStorageAdapter = () => ({
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value;
    } catch (error) {
      console.error(`Error getting item ${name}:`, error);
      return null;
    }
  },
  
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.error(`Error setting item ${name}:`, error);
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error(`Error removing item ${name}:`, error);
    }
  }
});

// Persistence middleware for Zustand stores
export const persist = <T>(
  config: StateCreator<T>,
  options: PersistOptions<T>
) => {
  const { name, partialize, onRehydrateStorage, version = 0, migrate } = options;
  const storage = createAsyncStorageAdapter();
  
  return (set: any, get: any, api: any) => {
    const initialState = config(set, get, api);
    
    // Load persisted state on initialization
    const loadPersistedState = async () => {
      try {
        const persistedValue = await storage.getItem(name);
        if (persistedValue) {
          const parsedState = JSON.parse(persistedValue);
          
          // Handle version migration
          let finalState = parsedState.state;
          if (migrate && parsedState.version !== version) {
            finalState = migrate(parsedState.state, parsedState.version);
          }
          
          // Merge with initial state
          const stateToRestore = partialize ? partialize(finalState) : finalState;
          set({ ...initialState, ...stateToRestore });
        }
        
        if (onRehydrateStorage) {
          onRehydrateStorage();
        }
      } catch (error) {
        console.error(`Error loading persisted state for ${name}:`, error);
      }
    };
    
    // Save state changes to storage
    const saveToStorage = async (state: T) => {
      try {
        const stateToSave = partialize ? partialize(state) : state;
        const valueToStore = JSON.stringify({
          state: stateToSave,
          version
        });
        await storage.setItem(name, valueToStore);
      } catch (error) {
        console.error(`Error saving state for ${name}:`, error);
      }
    };
    
    // Load initial state
    loadPersistedState();
    
    // Wrap the set function to automatically save changes
    const persistedSet = (partial: any, replace?: boolean) => {
      set(partial, replace);
      const newState = get();
      saveToStorage(newState);
    };
    
    return config(persistedSet, get, api);
  };
};

// Utility functions for manual storage operations
export const storageUtils = {
  // Clear all app data
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing all storage:', error);
    }
  },
  
  // Get app data size
  getStorageSize: async (): Promise<{ [key: string]: number }> => {
    const sizes: { [key: string]: number } = {};
    
    try {
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        const value = await AsyncStorage.getItem(storageKey);
        sizes[key] = value ? new Blob([value]).size : 0;
      }
    } catch (error) {
      console.error('Error calculating storage size:', error);
    }
    
    return sizes;
  },
  
  // Export all data for backup
  exportData: async (): Promise<{ [key: string]: any }> => {
    const data: { [key: string]: any } = {};
    
    try {
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        const value = await AsyncStorage.getItem(storageKey);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
    
    return data;
  },
  
  // Import data from backup
  importData: async (data: { [key: string]: any }): Promise<void> => {
    try {
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        if (data[key]) {
          await AsyncStorage.setItem(storageKey, JSON.stringify(data[key]));
        }
      }
    } catch (error) {
      console.error('Error importing data:', error);
    }
  },
  
  // Check if data exists
  hasData: async (): Promise<boolean> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return Object.values(STORAGE_KEYS).some(key => keys.includes(key));
    } catch (error) {
      console.error('Error checking for existing data:', error);
      return false;
    }
  }
};

// Migration functions for different versions
export const migrations = {
  // Example migration from version 0 to 1
  migrateV0ToV1: (oldState: any): any => {
    // Add any necessary data transformations here
    return {
      ...oldState,
      // Add new fields or transform existing ones
      version: 1
    };
  }
};

// Specific persistence configurations for each store
export const appStorePersistConfig = {
  name: STORAGE_KEYS.APP_STORE,
  version: 1,
  partialize: (state: any) => ({
    user: state.user,
    salary: state.salary,
    expenses: state.expenses,
    recurringBills: state.recurringBills
    // Exclude calculated fields like currentBalance, daysRemaining, etc.
    // These will be recalculated on app startup
  }),
  migrate: migrations.migrateV0ToV1
};

export const notificationStorePersistConfig = {
  name: STORAGE_KEYS.NOTIFICATION_STORE,
  version: 1,
  partialize: (state: any) => ({
    notifications: state.notifications.slice(0, 50), // Keep only last 50 notifications
    settings: state.settings
  })
};

export const suggestionsStorePersistConfig = {
  name: STORAGE_KEYS.SUGGESTIONS_STORE,
  version: 1,
  partialize: (state: any) => ({
    suggestionsHistory: state.suggestionsHistory.slice(0, 20), // Keep only last 20 suggestions
    lastGenerated: state.lastGenerated
    // Don't persist active suggestions as they should be regenerated
  })
};