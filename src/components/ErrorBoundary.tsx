import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-dark-bg items-center justify-center p-6">
          <View className="bg-dark-card rounded-2xl p-6 items-center w-full max-w-md">
            <View className="w-16 h-16 bg-red-900/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="bug" size={32} color="#ef4444" />
            </View>
            
            <Text className="text-white text-xl font-bold mb-2">Something went wrong</Text>
            
            <Text className="text-gray-400 text-center mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            
            <TouchableOpacity
              className="bg-fuel-full rounded-xl px-6 py-3 mb-4"
              onPress={this.handleRetry}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                // In a real app, you might want to send this to your error reporting service
                console.log('Error details:', this.state.error);
              }}
            >
              <Text className="text-gray-500 text-sm">View Error Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;