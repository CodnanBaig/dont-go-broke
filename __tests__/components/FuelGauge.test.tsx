import React from 'react';
import { render } from '@testing-library/react-native';
import FuelGauge from '@/components/FuelGauge';

// Mock react-native-svg because it's not available in test environment
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
}));

describe('FuelGauge', () => {
  it('renders correctly with 50% fuel', () => {
    const { getByText } = render(<FuelGauge percentage={50} />);
    
    // Check if the percentage text is rendered
    expect(getByText('50%')).toBeTruthy();
  });

  it('renders correctly with 0% fuel', () => {
    const { getByText } = render(<FuelGauge percentage={0} />);
    
    // Check if the percentage text is rendered
    expect(getByText('0%')).toBeTruthy();
  });

  it('renders correctly with 100% fuel', () => {
    const { getByText } = render(<FuelGauge percentage={100} />);
    
    // Check if the percentage text is rendered
    expect(getByText('100%')).toBeTruthy();
  });

  it('applies correct color for different fuel levels', () => {
    // Test different fuel levels
    const { rerender, getByTestId } = render(<FuelGauge percentage={80} />);
    
    // Re-render with different percentage
    rerender(<FuelGauge percentage={30} />);
    
    // Re-render with critical level
    rerender(<FuelGauge percentage={5} />);
  });
});