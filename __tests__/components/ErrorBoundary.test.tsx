import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '@/components/ErrorBoundary';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

describe('ErrorBoundary', () => {
  const ChildComponent = () => <div>Normal Component</div>;
  
  const ErrorComponent = () => {
    throw new Error('Test error');
    return <div>Error Component</div>;
  };

  beforeEach(() => {
    // Clear console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ChildComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Normal Component')).toBeTruthy();
  });

  it('renders error UI when child component throws an error', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Test error')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('calls onError callback when provided', () => {
    const onErrorMock = jest.fn();
    
    render(
      <ErrorBoundary onError={onErrorMock}>
        <ErrorComponent />
      </ErrorBoundary>
    );
    
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('recovers after retry button is pressed', () => {
    const WorkingComponent = () => <div>Working Component</div>;
    let shouldThrow = true;
    
    const SometimesErrorComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <WorkingComponent />;
    };
    
    const { rerender } = render(
      <ErrorBoundary>
        <SometimesErrorComponent />
      </ErrorBoundary>
    );
    
    // Initially shows error
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    
    // Simulate fixing the error
    shouldThrow = false;
    
    // Press retry button
    const retryButton = screen.getByText('Try Again');
    fireEvent.press(retryButton);
    
    // Re-render to trigger recovery
    rerender(
      <ErrorBoundary>
        <SometimesErrorComponent />
      </ErrorBoundary>
    );
    
    // Should now show the working component
    expect(screen.getByText('Working Component')).toBeTruthy();
  });
});