import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { captureFrontendError } from '../utils/errorTracking';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State;
  setState!: (state: Partial<State> | ((prevState: Readonly<State>, props: Readonly<Props>) => Partial<State> | State | null)) => void;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    captureFrontendError(error, {
      componentStack: errorInfo.componentStack,
      fallbackTitle: this.props.fallbackTitle || 'Global ErrorBoundary',
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-[var(--r-l)] bg-[var(--surface)] text-[var(--ink-2)] space-y-4 max-w-2xl mx-auto my-8">
          <div className="flex items-center gap-3 text-[var(--acc)]">
            <AlertTriangle className="w-8 h-8 shrink-0 text-[var(--acc)]" />
            <h3 className="text-lg font-bold">{this.props.fallbackTitle || 'Ha ocurrido un error al cargar este módulo'}</h3>
          </div>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed font-sans bg-[var(--sunken)] p-3 rounded-[var(--r-m)] overflow-x-auto shrink-0">
            {this.state.error?.message || 'Error no especificado en la renderización.'}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] text-xs font-bold rounded-[var(--r-pill)] flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" /> Reintentar Cargar Módulo
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-semibold rounded-[var(--r-pill)] transition"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
