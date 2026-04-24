/**
 * Global error boundary for unhandled errors.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Future: send to logging service
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-white px-6">
          <Text className="text-2xl font-bold text-text-primary mb-2">
            Something went wrong
          </Text>
          <Text className="text-base text-text-secondary text-center mb-8">
            An unexpected error occurred. Please try again.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="bg-primary-600 rounded-button px-8 py-4 min-h-[44px]"
          >
            <Text className="text-white font-semibold text-lg">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
