import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SmartSuggestions from '@/components/SmartSuggestions';
import { Suggestion, SuggestionAction, SuggestionPriority } from '@/types';

// Mock the Ionicons component
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock the useHapticFeedback hook
jest.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    triggerHaptic: jest.fn(),
  }),
}));

describe('SmartSuggestions', () => {
  const mockOnActionPress = jest.fn();
  const mockOnDismiss = jest.fn();
  
  const mockSuggestions: Suggestion[] = [
    {
      id: '1',
      title: 'Reduce Dining Out',
      description: 'You\'ve spent 30% more on dining out this month',
      priority: SuggestionPriority.HIGH,
      action: SuggestionAction.REDUCE_SPENDING,
      actionData: { categoryId: 'dining', targetAmount: 2000 },
      impact: { daysGained: 5, moneySaved: 2000 },
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Save for Emergency Fund',
      description: 'Build an emergency fund of at least 3 months expenses',
      priority: SuggestionPriority.NORMAL,
      action: SuggestionAction.SAVE,
      actionData: { targetAmount: 15000, monthlyAmount: 2500 },
      impact: { daysGained: 0, moneySaved: 0 },
      createdAt: new Date(),
    },
  ];
  
  beforeEach(() => {
    mockOnActionPress.mockClear();
    mockOnDismiss.mockClear();
  });

  it('renders correctly with suggestions', () => {
    const { getByText, getAllByText } = render(
      <SmartSuggestions 
        suggestions={mockSuggestions}
        onActionPress={mockOnActionPress}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Check if title is rendered
    expect(getByText('Smart Suggestions')).toBeTruthy();
    
    // Check if suggestions are rendered
    expect(getByText('Reduce Dining Out')).toBeTruthy();
    expect(getByText('Save for Emergency Fund')).toBeTruthy();
    
    // Check if descriptions are rendered
    expect(getByText('You\'ve spent 30% more on dining out this month')).toBeTruthy();
    expect(getByText('Build an emergency fund of at least 3 months expenses')).toBeTruthy();
  });

  it('calls onActionPress when primary action button is pressed', () => {
    const { getAllByText } = render(
      <SmartSuggestions 
        suggestions={mockSuggestions}
        onActionPress={mockOnActionPress}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Press the first "Save Now" button
    const actionButtons = getAllByText('Cut Spending');
    fireEvent.press(actionButtons[0]);
    
    expect(mockOnActionPress).toHaveBeenCalledTimes(1);
    expect(mockOnActionPress).toHaveBeenCalledWith(mockSuggestions[0], 'primary');
  });

  it('calls onActionPress when secondary action button is pressed', () => {
    const { getAllByText } = render(
      <SmartSuggestions 
        suggestions={mockSuggestions}
        onActionPress={mockOnActionPress}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Press the first "Learn More" button
    const actionButtons = getAllByText('Learn More');
    fireEvent.press(actionButtons[0]);
    
    expect(mockOnActionPress).toHaveBeenCalledTimes(1);
    expect(mockOnActionPress).toHaveBeenCalledWith(mockSuggestions[0], 'secondary');
  });

  it('calls onDismiss when close button is pressed', () => {
    const { getAllByTestId } = render(
      <SmartSuggestions 
        suggestions={mockSuggestions}
        onActionPress={mockOnActionPress}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Mock the testID for the close button
    const closeButtons = getAllByTestId('close-button');
    fireEvent.press(closeButtons[0]);
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).toHaveBeenCalledWith('1');
  });

  it('shows empty state when no suggestions', () => {
    const { getByText } = render(
      <SmartSuggestions 
        suggestions={[]}
        onActionPress={mockOnActionPress}
        onDismiss={mockOnDismiss}
      />
    );
    
    // Check if empty state is rendered
    expect(getByText('No suggestions right now')).toBeTruthy();
    expect(getByText('We\'ll analyze your spending and provide smart recommendations')).toBeTruthy();
  });

  it('respects maxVisible prop', () => {
    const { queryByText } = render(
      <SmartSuggestions 
        suggestions={mockSuggestions}
        onActionPress={mockOnActionPress}
        onDismiss={mockOnDismiss}
        maxVisible={1}
      />
    );
    
    // First suggestion should be visible
    expect(queryByText('Reduce Dining Out')).toBeTruthy();
    
    // Second suggestion should not be visible
    expect(queryByText('Save for Emergency Fund')).toBeNull();
  });
});