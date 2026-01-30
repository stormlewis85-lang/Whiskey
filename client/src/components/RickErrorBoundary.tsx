import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface Props {
  children: ReactNode;
  onClose?: () => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RickErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Rick House Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  handleClose = () => {
    this.setState({ hasError: false, error: null });
    this.props.onClose?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Card className="max-w-md w-full border-border/50 shadow-warm-lg">
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">
                    Something went wrong
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Rick House encountered an error. Don't worry, your progress is safe.
                  </p>
                </div>

                {this.state.error && (
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {this.props.onClose && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={this.handleClose}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  )}
                  {this.props.onRetry && (
                    <Button
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={this.handleRetry}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RickErrorBoundary;
