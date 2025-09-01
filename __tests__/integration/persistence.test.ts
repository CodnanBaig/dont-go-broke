import { useAppStore } from '@/stores/appStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSuggestionsStore } from '@/stores/suggestionsStore';
import { ExpenseCategory, NotificationType, NotificationPriority } from '@/types';

// Mock AsyncStorage
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

describe('Data Persistence Integration', () => {
  beforeEach(() => {
    // Clear all mocks
    mockGetItem.mockClear();
    mockSetItem.mockClear();
    
    // Reset all stores
    useAppStore.getState().resetApp();
    useNotificationStore.getState().clearAllNotifications();
    useSuggestionsStore.getState().clearSuggestions();
  });

  it('should persist app store data', async () => {
    // 1. Set up initial data
    useAppStore.getState().setUser({
      id: '1',
      name: 'Test User',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    useAppStore.getState().setSalary(25000);

    useAppStore.getState().addExpense({
      amount: 3000,
      category: ExpenseCategory.FOOD,
      description: 'Monthly groceries',
    });

    useAppStore.getState().addRecurringBill({
      name: 'Rent',
      amount: 10000,
      frequency: 'monthly',
      nextDueDate: new Date(),
      category: ExpenseCategory.RENT,
      autoDeduct: true,
    });

    // 2. Verify data is stored
    let state = useAppStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.salary).not.toBeNull();
    expect(state.expenses).toHaveLength(1);
    expect(state.recurringBills).toHaveLength(1);

    // 3. Simulate app restart by resetting store and loading from persistence
    useAppStore.getState().resetApp();
    
    // In a real scenario, the persistence middleware would automatically
    // load the data. For testing, we'll simulate this by checking if
    // setItem was called with the correct data
    expect(mockSetItem).toHaveBeenCalled();
    
    // Get the last call to setItem for the app store
    const appStoreCalls = mockSetItem.mock.calls.filter(call => 
      call[0] === 'app-storage'
    );
    
    expect(appStoreCalls).toHaveLength(1);
  });

  it('should persist notification store data', async () => {
    // 1. Add notifications
    useNotificationStore.getState().addNotification({
      type: NotificationType.FUEL_LOW,
      title: 'Low Fuel',
      message: 'Your fuel level is low',
      priority: NotificationPriority.HIGH,
    });

    useNotificationStore.getState().addNotification({
      type: NotificationType.BIG_SPEND,
      title: 'Big Spend',
      message: 'You made a large purchase',
      priority: NotificationPriority.NORMAL,
    });

    // 2. Verify notifications are stored
    let state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(2);

    // 3. Simulate app restart
    useNotificationStore.getState().clearAllNotifications();
    
    // Check that data was persisted
    const notificationCalls = mockSetItem.mock.calls.filter(call => 
      call[0] === 'notification-storage'
    );
    
    expect(notificationCalls).toHaveLength(1);
  });

  it('should persist suggestions store data', async () => {
    // 1. Add suggestions
    useSuggestionsStore.getState().addSuggestion({
      type: 'budget_adjustment',
      title: 'Budget Adjustment',
      description: 'Consider adjusting your budget',
      action: 'adjust_budget',
      priority: NotificationPriority.NORMAL,
      impact: {
        confidenceScore: 0.8
      }
    });

    // 2. Verify suggestions are stored
    let state = useSuggestionsStore.getState();
    expect(state.suggestions).toHaveLength(1);

    // 3. Simulate app restart
    useSuggestionsStore.getState().clearSuggestions();
    
    // Check that data was persisted
    const suggestionCalls = mockSetItem.mock.calls.filter(call => 
      call[0] === 'suggestions-storage'
    );
    
    expect(suggestionCalls).toHaveLength(1);
  });

  it('should handle persistence errors gracefully', async () => {
    // Mock setItem to throw an error
    mockSetItem.mockImplementationOnce(() => {
      throw new Error('Storage error');
    });

    // This should not crash the app
    expect(() => {
      useAppStore.getState().setSalary(10000);
    }).not.toThrow();

    // Data should still be in memory
    const state = useAppStore.getState();
    expect(state.salary).not.toBeNull();
    expect(state.salary?.amount).toBe(10000);
  });

  it('should handle empty storage gracefully', async () => {
    // Mock getItem to return null (empty storage)
    mockGetItem.mockResolvedValue(null);

    // Reset stores to simulate first app launch
    useAppStore.getState().resetApp();
    useNotificationStore.getState().clearAllNotifications();
    useSuggestionsStore.getState().clearSuggestions();

    // Should not crash and should have default state
    const appState = useAppStore.getState();
    const notificationState = useNotificationStore.getState();
    const suggestionsState = useSuggestionsStore.getState();

    expect(appState.user).toBeNull();
    expect(appState.salary).toBeNull();
    expect(notificationState.notifications).toHaveLength(0);
    expect(suggestionsState.suggestions).toHaveLength(0);
  });
});