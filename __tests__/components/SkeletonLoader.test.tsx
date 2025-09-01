import React from 'react';
import { render, screen } from '@testing-library/react-native';
import SkeletonLoader from '@/components/SkeletonLoader';

// Mock Animated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  
  return {
    ...jest.requireActual('react-native-reanimated'),
    createAnimatedComponent: (Component: any) => Component,
    useSharedValue: () => ({ value: 0.5 }),
    useAnimatedStyle: () => ({ opacity: 0.5 }),
    withTiming: () => 0.5,
    withRepeat: (animation: any) => animation,
    Easing: {
      linear: jest.fn(),
      inOut: jest.fn(() => jest.fn()),
      quad: jest.fn()
    }
  };
});

describe('SkeletonLoader', () => {
  it('renders correctly with default props', () => {
    render(<SkeletonLoader testID="skeleton-loader" />);
    
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton).toBeTruthy();
    expect(skeleton.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: '100%',
          height: 20,
          borderRadius: 4,
          backgroundColor: '#374151'
        })
      ])
    );
  });

  it('renders with custom dimensions', () => {
    render(<SkeletonLoader width={100} height={50} borderRadius={8} testID="skeleton-loader" />);
    
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 100,
          height: 50,
          borderRadius: 8
        })
      ])
    );
  });

  it('renders with string width', () => {
    render(<SkeletonLoader width="50%" height={30} testID="skeleton-loader" />);
    
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: '50%',
          height: 30
        })
      ])
    );
  });
});