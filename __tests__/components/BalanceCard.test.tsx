import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BalanceCard from '@/components/BalanceCard';

// Mock the Ionicons component
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('BalanceCard', () => {
  const mockOnRecharge = jest.fn();
  
  beforeEach(() => {
    mockOnRecharge.mockClear();
  });

  it('renders correctly with balance and salary', () => {
    const { getByText } = render(
      <BalanceCard 
        currentBalance={5000} 
        salaryAmount={10000} 
        totalSpent={5000} 
        onRecharge={mockOnRecharge} 
      />
    );
    
    // Check if balance is rendered correctly
    expect(getByText('₹5,000')).toBeTruthy();
    
    // Check if salary is rendered correctly
    expect(getByText('of ₹10,000')).toBeTruthy();
  });

  it('calls onRecharge when recharge button is pressed', () => {
    const { getByText } = render(
      <BalanceCard 
        currentBalance={5000} 
        salaryAmount={10000} 
        totalSpent={5000} 
        onRecharge={mockOnRecharge} 
      />
    );
    
    const rechargeButton = getByText('Recharge');
    fireEvent.press(rechargeButton);
    
    expect(mockOnRecharge).toHaveBeenCalledTimes(1);
  });

  it('displays correct percentage', () => {
    const { getByText } = render(
      <BalanceCard 
        currentBalance={2500} 
        salaryAmount={10000} 
        totalSpent={7500} 
        onRecharge={mockOnRecharge} 
      />
    );
    
    // 2500/10000 = 25%
    expect(getByText('25%')).toBeTruthy();
  });
});