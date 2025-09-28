import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-destructive rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-semibold mb-2">앱 오류가 발생했습니다</h1>
            <p className="text-muted-foreground mb-4">
              죄송합니다. 예상치 못한 오류가 발생했습니다.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                페이지 새로고침
              </Button>
              <details className="text-left text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  기술적 세부사항
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error?.message || '알 수 없는 오류'}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;