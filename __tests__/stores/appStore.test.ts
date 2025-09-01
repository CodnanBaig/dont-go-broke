import { useAppStore } from '@/stores/appStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

describe('AppStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAppStore.getState().resetApp();
  });

  it('should initialize with default state', () => {
    const state = useAppStore.getState();
    
    expect(state.user).toBeNull();
    expect(state.salary).toBeNull();
    expect(state.expenses).toEqual([]);
    expect(state.recurringBills).toEqual([]);
    expect(state.currentBalance).toBe(0);
    expect(state.daysRemaining).toBe(0);
  });

  it('should set user profile', () => {
    const user = {
      id: '1',
      name: 'Test User',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    useAppStore.getState().setUser(user);
    
    const state = useAppStore.getState();
    expect(state.user).toEqual(user);
  });

  it('should set salary and calculate balance', () => {
    useAppStore.getState().setSalary(10000);
    
    const state = useAppStore.getState();
    expect(state.salary).not.toBeNull();
    expect(state.salary?.amount).toBe(10000);
    expect(state.currentBalance).toBe(10000);
  });

  it('should add expense and update balance', () => {
    // Set initial salary
    useAppStore.getState().setSalary(10000);
    
    // Add an expense
    useAppStore.getState().addExpense({
      amount: 1000,
      category: 'Food',
      description: 'Lunch',
    });
    
    const state = useAppStore.getState();
    expect(state.expenses).toHaveLength(1);
    expect(state.expenses[0].amount).toBe(1000);
    expect(state.currentBalance).toBe(9000);
  });

  it('should calculate days remaining based on average daily spend', () => {
    // Set initial salary
    useAppStore.getState().setSalary(10000);
    
    // Add expenses over multiple days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    useAppStore.getState().addExpense({
      amount: 500,
      category: 'Food',
      description: 'Today\'s lunch',
      date: today,
    });
    
    useAppStore.getState().addExpense({
      amount: 300,
      category: 'Transport',
      description: 'Yesterday\'s travel',
      date: yesterday,
    });
    
    const state = useAppStore.getState();
    expect(state.daysRemaining).toBeGreaterThan(0);
  });

  it('should handle recurring bills with auto-deduction', () => {
    // Set initial salary
    useAppStore.getState().setSalary(10000);
    
    // Add a recurring bill with auto-deduction
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);
    
    useAppStore.getState().addRecurringBill({
      name: 'Rent',
      amount: 3000,
      frequency: 'monthly',
      nextDueDate,
      category: 'Rent',
      autoDeduct: true,
    });
    
    const state = useAppStore.getState();
    expect(state.recurringBills).toHaveLength(1);
    expect(state.currentBalance).toBe(7000); // 10000 - 3000
  });

  it('should calculate fuel status correctly', () => {
    // Set initial salary
    useAppStore.getState().setSalary(10000);
    
    // Add an expense
    useAppStore.getState().addExpense({
      amount: 1000,
      category: 'Food',
      description: 'Lunch',
    });
    
    const fuelStatus = useAppStore.getState().calculateFuelStatus();
    expect(fuelStatus.percentage).toBe(90); // (9000/10000)*100
    expect(fuelStatus.level).toBe('high');
  });
});