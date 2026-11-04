import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('greenova_user');
    } catch {}
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 text-white">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              Application Notice
            </h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              The application encountered a temporary display issue. You can reload the page or return to the sign-in screen.
            </p>
            {this.state.error && (
              <div className="mb-5 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-rose-300 font-mono text-left overflow-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
