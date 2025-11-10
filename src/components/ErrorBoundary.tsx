"use client";

import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * エラーバウンダリーコンポーネント
 * 子コンポーネントでエラーが発生した場合にフォールバックUIを表示します
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback(this.state.error, this.reset);
        }
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback error={this.state.error} reset={this.reset} />
      );
    }

    return this.props.children;
  }
}

/**
 * デフォルトのエラーフォールバックUI
 */
function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div
        className="max-w-md w-full p-6 rounded-lg border"
        style={{
          backgroundColor: "var(--background-secondary)",
          borderColor: "var(--border)",
        }}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--foreground)" }}
        >
          エラーが発生しました
        </h2>
        <p className="mb-4" style={{ color: "var(--muted)" }}>
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        <details className="mb-4">
          <summary
            className="cursor-pointer text-sm"
            style={{ color: "var(--muted)" }}
          >
            エラーの詳細を表示
          </summary>
          <pre
            className="mt-2 p-3 rounded text-sm overflow-auto"
            style={{
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
            }}
          >
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded transition-colors"
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "white",
          }}
        >
          再試行
        </button>
      </div>
    </div>
  );
}

/**
 * HOC: コンポーネントをエラーバウンダリーでラップする
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
}
