"use client";
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log specific MetaMask-related errors
    if (error.message.includes('MetaMask') || error.message.includes('ethereum')) {
      console.warn('MetaMask/ethereum error detected - this should not happen in a Solana app');
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-red-400 mb-4">{this.state.error?.message}</p>
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded border border-white/20"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

