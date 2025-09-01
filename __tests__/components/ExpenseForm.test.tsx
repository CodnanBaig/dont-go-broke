import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ExpenseForm from '@/components/ExpenseForm';
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

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

describe('ExpenseForm', () => {
  const mockOnSubmit = jest.fn();
  const categories = Object.values(ExpenseCategory);
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders correctly with all categories', () => {
    const { getByText } = render(
      <ExpenseForm 
        onSubmit={mockOnSubmit} 
        categories={categories} 
      />
    );
    
    // Check if form title is rendered
    expect(getByText('Add New Expense')).toBeTruthy();
    
    // Check if amount input is rendered
    expect(getByText('Amount')).toBeTruthy();
    
    // Check if category selector is rendered
    expect(getByText('Category')).toBeTruthy();
  });

  it('validates required fields', () => {
    const { getByText } = render(
      <ExpenseForm 
        onSubmit={mockOnSubmit} 
        categories={categories} 
      />
    );
    
    // Try to submit without filling fields
    const submitButton = getByText('Add Expense');
    fireEvent.press(submitButton);
    
    // Should show validation errors
    expect(getByText('Amount is required')).toBeTruthy();
    expect(getByText('Category is required')).toBeTruthy();
    
    // onSubmit should not be called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', () => {
    const { getByPlaceholderText, getByText } = render(
      <ExpenseForm 
        onSubmit={mockOnSubmit} 
        categories={categories} 
      />
    );
    
    // Fill in amount
    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '500');
    
    // Select a category (first one)
    const categoryButton = getByText(categories[0]);
    fireEvent.press(categoryButton);
    
    // Submit form
    const submitButton = getByText('Add Expense');
    fireEvent.press(submitButton);
    
    // Should call onSubmit with correct data
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      amount: 500,
      category: categories[0],
      description: '',
    });
  });

  it('validates numeric amount', () => {
    const { getByPlaceholderText, getByText } = render(
      <ExpenseForm 
        onSubmit={mockOnSubmit} 
        categories={categories} 
      />
    );
    
    // Fill in invalid amount
    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, 'abc');
    
    // Select a category
    const categoryButton = getByText(categories[0]);
    fireEvent.press(categoryButton);
    
    // Submit form
    const submitButton = getByText('Add Expense');
    fireEvent.press(submitButton);
    
    // Should show validation error
    expect(getByText('Please enter a valid amount')).toBeTruthy();
  });
});