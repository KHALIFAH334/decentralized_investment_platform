'use client';
import React from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <h3>Something went wrong</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{this.state.error?.message}</p>
          <button className="btn-primary" onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
