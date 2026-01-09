"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { FiRefreshCw, FiAlertTriangle } from "react-icons/fi";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary to catch JavaScript errors and prevent app freezes.
 * Shows a friendly error message with refresh option.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to console in development
        console.error("ErrorBoundary caught an error:", error, errorInfo);

        // You could also log to your error tracking service here
        // e.g., PostHog, Sentry, etc.
    }

    handleRetry = () => {
        // Clear the error state
        this.setState({ hasError: false, error: undefined });
    };

    handleHardRefresh = () => {
        // Clear cache and force reload
        if ("caches" in window) {
            caches.keys().then((names) => {
                names.forEach((name) => {
                    caches.delete(name);
                });
            });
        }
        // Force reload bypassing cache
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[50vh] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                        {/* Error Icon */}
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                            Something went wrong
                        </h2>

                        {/* Description */}
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                            The app encountered an error. This might be due to outdated cached data.
                        </p>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={this.handleRetry}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                Try Again
                            </button>

                            <button
                                onClick={this.handleHardRefresh}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition-colors"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                Clear Cache & Reload
                            </button>
                        </div>

                        {/* Error details (collapsed) */}
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="mt-4 text-left">
                                <summary className="text-xs text-slate-500 cursor-pointer">
                                    Error details
                                </summary>
                                <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
