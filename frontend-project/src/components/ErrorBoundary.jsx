import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { primaryButton } from './UI.jsx';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-teal-100 shadow-teal-md p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-6 font-mono">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className={primaryButton}>Reload Page</button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
