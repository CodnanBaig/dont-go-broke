import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ExpenseList from '@/components/ExpenseList';
import { ExpenseCategory } from '@/types';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    View,
    default: View,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((value) => value),
    withTiming: jest.fn((value) => value),
  };
});

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2023-01-01';
    if (formatStr === 'd MMMM yyyy') return '1 January 2023';
    return '01 Jan 2023';
  }),
}));

// Mock the Ionicons component
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock CATEGORY_METADATA
jest.mock('@/types', () => ({
  ...jest.requireActual('@/types'),
  CATEGORY_METADATA: {
    Food: { icon: 'fast-food', color: '#f59e0b' },
    Transport: { icon: 'bus', color: '#3b82f6' },
    Shopping: { icon: 'cart', color: '#8b5cf6' },
    Others: { icon: 'ellipsis-horizontal', color: '#6b7280' },
  },
}));

// Mock the useHapticFeedback hook
jest.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    triggerHaptic: jest.fn(),
  }),
}));

describe('ExpenseList', () => {
  const mockOnExpensePress = jest.fn();
  const mockOnExpenseDelete = jest.fn();
  
  const mockExpenses = [
    {
      id: '1',
      amount: 1500,
      category: ExpenseCategory.FOOD,
      description: 'Lunch at restaurant',
      date: new Date('2023-01-01'),
      source: 'manual',
      createdAt: new Date('2023-01-01T12:00:00'),
      updatedAt: new Date('2023-01-01T12:00:00'),
    },
    {
      id: '2',
      amount: 800,
      category: ExpenseCategory.TRANSPORT,
      description: 'Uber ride',
      date: new Date('2023-01-01'),
      source: 'manual',
      createdAt: new Date('2023-01-01T18:00:00'),
      updatedAt: new Date('2023-01-01T18:00:00'),
    },
  ];
  
  beforeEach(() => {
    mockOnExpensePress.mockClear();
    mockOnExpenseDelete.mockClear();
  });

  it('renders correctly with expenses', () => {
    const { getByText } = render(
      <ExpenseList 
        expenses={mockExpenses}
        onExpensePress={mockOnExpensePress}
        onExpenseDelete={mockOnExpenseDelete}
      />
    );
    
    // Check if expenses are rendered
    expect(getByText('Lunch at restaurant')).toBeTruthy();
    expect(getByText('Uber ride')).toBeTruthy();
    
    // Check if amounts are rendered
    expect(getByText('-₹1,500')).toBeTruthy();
    expect(getByText('-₹800')).toBeTruthy();
    
    // Check if categories are rendered
    expect(getByText('Food')).toBeTruthy();
    expect(getByText('Transport')).toBeTruthy();
  });

  it('calls onExpensePress when expense is pressed', () => {
    const { getByText } = render(
      <ExpenseList 
        expenses={mockExpenses}
        onExpensePress={mockOnExpensePress}
        onExpenseDelete={mockOnExpenseDelete}
      />
    );
    
    // Press the first expense
    const expenseItem = getByText('Lunch at restaurant');
    fireEvent.press(expenseItem);
    
    expect(mockOnExpensePress).toHaveBeenCalledTimes(1);
    expect(mockOnExpensePress).toHaveBeenCalledWith(mockExpenses[0]);
  });

  it('calls onExpenseDelete when delete button is pressed', () => {
    const { getAllByTestId } = render(
      <ExpenseList 
        expenses={mockExpenses}
        onExpensePress={mockOnExpensePress}
        onExpenseDelete={mockOnExpenseDelete}
      />
    );
    
    // Mock the testID for the delete button
    const deleteButtons = getAllByTestId('delete-button');
    fireEvent.press(deleteButtons[0]);
    
    // Since Alert is used, we need to mock it or check if the function is called
    // For now, we'll just check that the delete function is called
    expect(mockOnExpenseDelete).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no expenses', () => {
    const { getByText } = render(
      <ExpenseList 
        expenses={[]}
        onExpensePress={mockOnExpensePress}
        onExpenseDelete={mockOnExpenseDelete}
      />
    );
    
    // Check if empty state is rendered
    expect(getByText('No expenses yet')).toBeTruthy();
  });

  it('groups expenses by date when showGrouping is true', () => {
    const { getByText } = render(
      <ExpenseList 
        expenses={mockExpenses}
        onExpensePress={mockOnExpensePress}
        onExpenseDelete={mockOnExpenseDelete}
        showGrouping={true}
      />
    );
    
    // Check if date grouping is rendered
    expect(getByText('1 January 2023')).toBeTruthy();
  });

  it('does not group expenses when showGrouping is false', () => {
    const { queryByText } = render(
      <ExpenseList 
        expenses={mockExpenses}
        onExpensePress={mockOnExpensePress}
        onExpenseDelete={mockOnExpenseDelete}
        showGrouping={false}
      />
    );
    
    // Date grouping should not be visible
    expect(queryByText('1 January 2023')).toBeNull();
  });
});