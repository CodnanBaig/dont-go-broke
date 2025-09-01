import { useAppStore } from '@/stores/appStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ExpenseCategory } from '@/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

describe('Expense Flow Integration', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useAppStore.getState().resetApp();
    useNotificationStore.getState().clearAllNotifications();
  });

  it('should handle complete expense flow from creation to deletion', () => {
    // 1. Set up initial salary
    useAppStore.getState().setSalary(10000);
    expect(useAppStore.getState().currentBalance).toBe(10000);

    // 2. Add an expense
    useAppStore.getState().addExpense({
      amount: 1500,
      category: ExpenseCategory.FOOD,
      description: 'Dinner at restaurant',
    });

    // 3. Verify expense was added
    let state = useAppStore.getState();
    expect(state.expenses).toHaveLength(1);
    expect(state.expenses[0].amount).toBe(1500);
    expect(state.expenses[0].category).toBe(ExpenseCategory.FOOD);
    expect(state.expenses[0].description).toBe('Dinner at restaurant');
    expect(state.currentBalance).toBe(8500);

    // 4. Update the expense
    const expenseId = state.expenses[0].id;
    useAppStore.getState().updateExpense(expenseId, {
      amount: 1200,
      description: 'Dinner at home',
    });

    // 5. Verify expense was updated
    state = useAppStore.getState();
    expect(state.expenses[0].amount).toBe(1200);
    expect(state.expenses[0].description).toBe('Dinner at home');
    expect(state.currentBalance).toBe(8800);

    // 6. Delete the expense
    useAppStore.getState().deleteExpense(expenseId);

    // 7. Verify expense was deleted
    state = useAppStore.getState();
    expect(state.expenses).toHaveLength(0);
    expect(state.currentBalance).toBe(10000);
  });

  it('should handle recurring bills with auto-deduction', () => {
    // 1. Set up initial salary
    useAppStore.getState().setSalary(20000);
    expect(useAppStore.getState().currentBalance).toBe(20000);

    // 2. Add recurring bills
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    useAppStore.getState().addRecurringBill({
      name: 'Rent',
      amount: 8000,
      frequency: 'monthly',
      nextDueDate,
      category: ExpenseCategory.RENT,
      autoDeduct: true,
    });

    useAppStore.getState().addRecurringBill({
      name: 'Internet',
      amount: 1000,
      frequency: 'monthly',
      nextDueDate,
      category: ExpenseCategory.UTILITIES,
      autoDeduct: true,
    });

    // 3. Verify bills were added and auto-deducted
    let state = useAppStore.getState();
    expect(state.recurringBills).toHaveLength(2);
    expect(state.currentBalance).toBe(11000); // 20000 - 8000 - 1000

    // 4. Add an expense
    useAppStore.getState().addExpense({
      amount: 500,
      category: ExpenseCategory.FOOD,
      description: 'Groceries',
    });

    // 5. Verify balance updated correctly
    state = useAppStore.getState();
    expect(state.currentBalance).toBe(10500); // 11000 - 500

    // 6. Update a bill to disable auto-deduction
    const rentBillId = state.recurringBills[0].id;
    useAppStore.getState().updateRecurringBill(rentBillId, {
      autoDeduct: false,
    });

    // 7. Verify balance increased by the bill amount
    state = useAppStore.getState();
    expect(state.currentBalance).toBe(18500); // 10500 + 8000
  });

  it('should generate notifications for big spends', () => {
    // 1. Set up initial salary
    useAppStore.getState().setSalary(10000);

    // 2. Add a big expense (more than 10% of salary)
    useAppStore.getState().addExpense({
      amount: 1500, // 15% of 10000
      category: ExpenseCategory.SHOPPING,
      description: 'New phone',
    });

    // 3. Verify notification was generated
    const notificationState = useNotificationStore.getState();
    expect(notificationState.notifications).toHaveLength(1);
    expect(notificationState.notifications[0].type).toBe('big_spend');
    expect(notificationState.notifications[0].title).toContain('Big Spend Alert');
  });

  it('should calculate fuel status and days remaining correctly', () => {
    // 1. Set up initial salary
    useAppStore.getState().setSalary(15000);

    // 2. Add multiple expenses over time
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    useAppStore.getState().addExpense({
      amount: 2000,
      category: ExpenseCategory.FOOD,
      description: 'Today\'s expenses',
      date: today,
    });

    useAppStore.getState().addExpense({
      amount: 1500,
      category: ExpenseCategory.TRANSPORT,
      description: 'Yesterday\'s travel',
      date: yesterday,
    });

    useAppStore.getState().addExpense({
      amount: 1000,
      category: ExpenseCategory.ENTERTAINMENT,
      description: 'Two days ago entertainment',
      date: twoDaysAgo,
    });

    // 3. Verify calculations
    const state = useAppStore.getState();
    expect(state.currentBalance).toBe(10500); // 15000 - 2000 - 1500 - 1000
    
    // Average daily spend should be calculated over the last 30 days
    // But in this case, it's over 3 days: (2000 + 1500 + 1000) / 3 = 1500
    expect(state.averageDailySpend).toBeCloseTo(1500, 0);
    
    // Days remaining: 10500 / 1500 = 7 days
    expect(state.daysRemaining).toBe(7);
    
    // Fuel status should be around 70% (10500/15000)
    const fuelStatus = state.calculateFuelStatus();
    expect(fuelStatus.percentage).toBe(70);
    expect(fuelStatus.level).toBe('medium');
  });
});