import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree
 * Used to prevent the entire app from crashing on component errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Could send to error tracking service here
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
          <div className="max-w-md text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full" style={{ background: '#FFF3EE' }}>
                <AlertCircle size={32} style={{ color: '#FF5C00' }} />
              </div>
            </div>
            <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--ink)' }}>
              Something went wrong
            </h1>
            <p className="text-sm font-medium mb-6" style={{ color: 'var(--muted)' }}>
              {this.state.error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              onClick={this.retry}
              className="nb-btn nb-btn-orange px-6 py-3 flex items-center justify-center gap-2 w-full"
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
