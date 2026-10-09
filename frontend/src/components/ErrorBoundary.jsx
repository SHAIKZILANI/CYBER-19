import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CYBER-19 React Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0f1d',
          color: '#e2e8f0',
          fontFamily: "'Inter', sans-serif",
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '650px',
            width: '100%',
            backgroundColor: '#111827',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.2)',
            padding: '2.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              color: '#ef4444'
            }}>
              <AlertTriangle size={36} />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
              Interface Rendering Interrupted
            </h1>

            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              A UI rendering error occurred in this view. Your scans and backend database are completely safe.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: '#fca5a5',
                overflowX: 'auto',
                maxHeight: '160px'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
              >
                <RefreshCw size={16} /> Reload Page
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(51, 65, 85, 0.8)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.9)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.8)'}
              >
                <Home size={16} /> Recover Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
