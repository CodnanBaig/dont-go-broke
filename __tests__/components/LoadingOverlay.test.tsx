import React from 'react';
import { render, screen } from '@testing-library/react-native';
import LoadingOverlay from '@/components/LoadingOverlay';

// Mock Animated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  const Text = require('react-native').Text;
  
  return {
    ...jest.requireActual('react-native-reanimated'),
    createAnimatedComponent: (Component: any) => Component,
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withTiming: () => 0,
    withRepeat: (animation: any) => animation,
    Easing: {
      linear: jest.fn(),
      inOut: jest.fn(() => jest.fn())
    }
  };
});

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

describe('LoadingOverlay', () => {
  it('renders correctly with default props', () => {
    render(<LoadingOverlay />);
    
    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.getByTestId('loading-overlay')).toBeTruthy();
  });

  it('renders custom message', () => {
    render(<LoadingOverlay message="Loading expenses..." />);
    
    expect(screen.getByText('Loading expenses...')).toBeTruthy();
  });

  it('does not render when isVisible is false', () => {
    render(<LoadingOverlay isVisible={false} />);
    
    expect(screen.queryByText('Loading...')).toBeNull();
  });

  it('renders inline variant correctly', () => {
    render(<LoadingOverlay variant="inline" message="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.getByTestId('loading-overlay-inline')).toBeTruthy();
  });
});