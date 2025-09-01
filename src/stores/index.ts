// Export all stores
export { useAppStore } from './appStore';
export { useNotificationStore } from './notificationStore';  
export { useSuggestionsStore } from './suggestionsStore';

// Export persistence utilities
export { storageUtils, STORAGE_KEYS } from './persistence';

// Export notification helper functions
export {
  createFuelLowNotification,
  createBigSpendNotification,
  createAchievementNotification,
  createSalaryNotification,
  createBillDueNotification
} from './notificationStore';

// Export suggestion helper functions
export { createSuggestionTemplate } from './suggestionsStore';