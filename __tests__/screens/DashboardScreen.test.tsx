import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useAppStore } from '@/stores';
import DashboardScreen from '@/app/(tabs)/index';
import { NavigationContainer } from '@react-navigation/native';

// Mock the stores
jest.mock('@/stores', () => ({
  useAppStore: jest.fn(),
  useNotificationStore: jest.fn(() => ({
    unreadCount: 0
  }))
}));

// Mock router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  })
}));

// Mock Animated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  const Text = require('react-native').Text;
  const TouchableOpacity = require('react-native').TouchableOpacity;
  
  return {
    ...jest.requireActual('react-native-reanimated'),
    createAnimatedComponent: (Component: any) => Component,
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    useAnimatedProps: () => ({}),
    withTiming: () => 0,
    withSpring: () => 0,
    interpolate: () => 0,
    Extrapolation: { CLAMP: 'clamp' },
    runOnJS: (fn: any) => fn,
    useAnimatedScrollHandler: () => jest.fn()
  };
});

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => <>{children}</>,
}));

describe('DashboardScreen', () => {
  const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;
  
  const defaultProps = {
    currentBalance: 10000,
    daysRemaining: 15,
    fuelStatus: {
      level: 'high',
      percentage: 75,
      daysRemaining: 15,
      color: '#22c55e'
    },
    salary: {
      amount: 50000,
      frequency: 'monthly',
      lastUpdated: new Date(),
      nextSalaryDate: new Date(),
      recurringBillsDeducted: 5000
    },
    recentExpenses: [
      {
        id: '1',
        amount: 100,
        category: 'Food',
        description: 'Lunch',
        date: new Date(),
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    refreshData: jest.fn(),
    isLoading: false,
    error: null,
    suggestions: []
  };

  beforeEach(() => {
    mockUseAppStore.mockReturnValue({
      ...defaultProps,
      dismissSuggestion: jest.fn(),
      executeSuggestionAction: jest.fn()
    });
  });

  it('renders correctly with default data', () => {
    render(
      <NavigationContainer>
        <DashboardScreen />
      </NavigationContainer>
    );

    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('₹10,000')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('15 days left')).toBeTruthy();
  });

  it('shows loading overlay when isLoading is true', () => {
    mockUseAppStore.mockReturnValue({
      ...defaultProps,
      isLoading: true
    });

    render(
      <NavigationContainer>
        <DashboardScreen />
      </NavigationContainer>
    );

    expect(screen.getByText('Loading dashboard...')).toBeTruthy();
  });

  it('shows error message when error is present', () => {
    mockUseAppStore.mockReturnValue({
      ...defaultProps,
      error: 'Failed to load data'
    });

    render(
      <NavigationContainer>
        <DashboardScreen />
      </NavigationContainer>
    );

    expect(screen.getByText('Failed to load data')).toBeTruthy();
  });

  it('shows skeleton loaders when loading', () => {
    mockUseAppStore.mockReturnValue({
      ...defaultProps,
      isLoading: true
    });

    render(
      <NavigationContainer>
        <DashboardScreen />
      </NavigationContainer>
    );

    // Check for skeleton loaders
    const skeletonLoaders = screen.getAllByTestId('skeleton-loader');
    expect(skeletonLoaders.length).toBeGreaterThan(0);
  });

  it('handles refresh correctly', async () => {
    const mockRefreshData = jest.fn();
    mockUseAppStore.mockReturnValue({
      ...defaultProps,
      refreshData: mockRefreshData
    });

    render(
      <NavigationContainer>
        <DashboardScreen />
      </NavigationContainer>
    );

    const refreshButton = screen.getByLabelText('Refresh');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(mockRefreshData).toHaveBeenCalled();
    });
  });
});