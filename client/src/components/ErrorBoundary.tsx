import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div
            className="w-full max-w-sm text-center"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "32px 24px",
            }}
          >
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "rgba(239,68,68,0.1)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgb(239,68,68)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2
              className="font-display font-medium text-foreground mb-2"
              style={{ fontSize: "1.1rem" }}
            >
              Something went wrong
            </h2>
            <p
              className="text-muted-foreground mb-6"
              style={{ fontSize: "0.8rem", lineHeight: 1.6 }}
            >
              An unexpected error occurred. Try refreshing or tap below to retry.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full font-medium cursor-pointer border-none"
              style={{
                minHeight: "44px",
                padding: "12px 24px",
                borderRadius: "12px",
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontSize: "0.8rem",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
