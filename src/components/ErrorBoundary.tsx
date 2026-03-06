import React from 'react';
import { exportData } from '../utils/storage';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleExportAndReset = () => {
    exportData();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh',
            padding: '2rem',
            textAlign: 'center',
            background: '#0f172a',
            color: '#f1f5f9',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            direction: 'rtl',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>משהו השתבש</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: 320 }}>
            אירעה שגיאה בלתי צפויה. הנתונים שלך שמורים — ניתן לייצא גיבוי ולנסות שוב.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.7rem 1.4rem',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 נסה שוב
            </button>
            <button
              onClick={this.handleExportAndReset}
              style={{
                padding: '0.7rem 1.4rem',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #475569',
                borderRadius: 12,
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📤 ייצא גיבוי ונסה שוב
            </button>
          </div>
          {this.state.error && (
            <details style={{ marginTop: '1.5rem', maxWidth: 400, textAlign: 'start' }}>
              <summary style={{ color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>פרטי שגיאה</summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  padding: '0.6rem',
                  background: '#1e293b',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  overflow: 'auto',
                  maxHeight: 150,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
