/**
 * =====================================================
 * GLOBAL ERROR BOUNDARY
 * Graceful error handling for the entire app
 * =====================================================
 */

"use client";

import React, { Component, ReactNode, useCallback, useState } from "react";
import { AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Send to error reporting service in production
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo);
    }
  }

  reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      await fetch("/api/admin/logs/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== "undefined" ? navigator.userAgent : "server",
        }),
      });
    } catch (e) {
      // Silently fail - don't crash the error boundary
    }
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback 
          error={this.state.error} 
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error fallback UI with neon gold styling
 */
function ErrorFallback({ 
  error, 
  onReset 
}: { 
  error: Error | null; 
  onReset: () => void;
}) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="
          relative
          bg-black/40
          backdrop-blur-xl
          border border-amber-500/30
          rounded-2xl
          p-8
          text-center
          overflow-hidden
        ">
          {/* Animated glow effect */}
          <div className="
            absolute
            inset-0
            bg-gradient-to-br
            from-amber-500/10
            via-transparent
            to-amber-500/10
            animate-pulse
          " />
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-amber-400/50 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-amber-400/50 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-amber-400/50 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-amber-400/50 rounded-br-2xl" />

          <div className="relative z-10">
            {/* Error icon */}
            <div className="
              w-20 h-20 
              mx-auto mb-6 
              rounded-full 
              bg-amber-500/10 
              flex items-center justify-center
              border border-amber-500/30
            ">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
            </div>

            <h1 className="
              text-2xl font-bold 
              text-white 
              mb-2
              font-display
            ">
              Oops! Something Went Wrong
            </h1>
            
            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. Please try again or contact support.
            </p>

            {/* Error message (development only) */}
            {isDevelopment && error && (
              <div className="
                bg-red-500/10 
                border border-red-500/30 
                rounded-lg 
                p-4 
                mb-6 
                text-left
                text-sm
                font-mono
              ">
                <p className="text-red-400 mb-2">{error.message}</p>
                {error.stack && (
                  <pre className="text-gray-500 text-xs overflow-x-auto">
                    {error.stack.split("\n").slice(0, 3).join("\n")}
                  </pre>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onReset}
                className="
                  flex items-center justify-center gap-2
                  px-6 py-3
                  bg-gradient-to-r from-amber-500 to-amber-600
                  hover:from-amber-400 hover:to-amber-500
                  text-black font-semibold
                  rounded-xl
                  transition-all duration-300
                  shadow-lg shadow-amber-500/20
                  hover:shadow-amber-500/40
                  hover:scale-105
                "
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              
              <a
                href="/"
                className="
                  flex items-center justify-center gap-2
                  px-6 py-3
                  bg-white/5
                  hover:bg-white/10
                  border border-white/10
                  text-white font-semibold
                  rounded-xl
                  transition-all duration-300
                  hover:scale-105
                "
              >
                <Home className="w-5 h-5" />
                Go Home
              </a>
            </div>

            {/* Support contact */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-gray-500 text-sm">
                Still having issues?{" "}
                <a 
                  href="mailto:support@afterhours.id" 
                  className="text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1 mt-1"
                >
                  <Mail className="w-4 h-4" />
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook version for functional components
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error) => {
    console.error("Unhandled error:", err);
    setError(err);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

export default GlobalErrorBoundary;
