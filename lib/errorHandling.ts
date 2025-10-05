// lib/errorHandling.ts
import { toast } from "sonner";

// Error types for different categories
export enum ErrorCategory {
  AUTHENTICATION = "authentication",
  VOTING = "voting",
  POLL_MANAGEMENT = "poll_management",
  PLAYER_MANAGEMENT = "player_management",
  NETWORK = "network",
  VALIDATION = "validation",
  PERMISSION = "permission",
  SESSION = "session",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Custom error class with enhanced information
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;
  public readonly retryable: boolean;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string,
    originalError?: Error,
    context?: Record<string, any>,
    retryable: boolean = false
  ) {
    super(message);
    this.name = "AppError";
    this.category = category;
    this.severity = severity;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.originalError = originalError;
    this.context = context;
    this.retryable = retryable;
  }

  private getDefaultUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.AUTHENTICATION:
        return "Authentication failed. Please check your credentials and try again.";
      case ErrorCategory.VOTING:
        return "Unable to submit your vote. Please try again.";
      case ErrorCategory.POLL_MANAGEMENT:
        return "Poll operation failed. Please try again.";
      case ErrorCategory.PLAYER_MANAGEMENT:
        return "Player management operation failed. Please try again.";
      case ErrorCategory.NETWORK:
        return "Network error. Please check your connection and try again.";
      case ErrorCategory.VALIDATION:
        return "Please check your input and try again.";
      case ErrorCategory.PERMISSION:
        return "You don't have permission to perform this action.";
      case ErrorCategory.SESSION:
        return "Your session has expired. Please log in again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }
}

// Firebase error code mappings
export const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password should be at least 6 characters long.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked":
    "Pop-up was blocked by your browser. Please allow pop-ups and try again.",
  "permission-denied": "You don't have permission to perform this action.",
  unavailable: "Service is temporarily unavailable. Please try again later.",
  "deadline-exceeded": "Request timed out. Please try again.",
  "resource-exhausted":
    "Service is temporarily overloaded. Please try again later.",
};

// Error handler class
export class ErrorHandler {
  private static retryAttempts = new Map<string, number>();
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_BASE = 1000; // 1 second

  // Main error handling method
  static handle(error: unknown, context?: Record<string, any>): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = this.createAppErrorFromError(error, context);
    } else {
      appError = new AppError(
        "Unknown error occurred",
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        "An unexpected error occurred. Please try again.",
        undefined,
        context
      );
    }

    // Log error for debugging
    this.logError(appError);

    return appError;
  }

  // Create AppError from generic Error
  private static createAppErrorFromError(
    error: Error,
    context?: Record<string, any>
  ): AppError {
    const errorMessage = error.message.toLowerCase();

    // Firebase errors
    if (
      error.message.includes("auth/") ||
      error.message.includes("FirebaseError")
    ) {
      const firebaseCode = this.extractFirebaseErrorCode(error.message);
      const userMessage =
        FIREBASE_ERROR_MESSAGES[firebaseCode] ||
        "Authentication error occurred.";

      return new AppError(
        error.message,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        userMessage,
        error,
        context,
        this.isRetryableFirebaseError(firebaseCode)
      );
    }

    // Network errors
    if (
      errorMessage.includes("network") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("timeout")
    ) {
      return new AppError(
        error.message,
        ErrorCategory.NETWORK,
        ErrorSeverity.HIGH,
        "Network error. Please check your connection and try again.",
        error,
        context,
        true
      );
    }

    // Permission errors
    if (
      errorMessage.includes("permission") ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("forbidden")
    ) {
      return new AppError(
        error.message,
        ErrorCategory.PERMISSION,
        ErrorSeverity.HIGH,
        "You don't have permission to perform this action.",
        error,
        context,
        false
      );
    }

    // Validation errors
    if (
      errorMessage.includes("invalid") ||
      errorMessage.includes("required") ||
      errorMessage.includes("validation")
    ) {
      return new AppError(
        error.message,
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        "Please check your input and try again.",
        error,
        context,
        false
      );
    }

    // Default to network error with retry capability
    return new AppError(
      error.message,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      "An error occurred. Please try again.",
      error,
      context,
      true
    );
  }

  // Extract Firebase error code from error message
  private static extractFirebaseErrorCode(message: string): string {
    const match = message.match(/auth\/[\w-]+/);
    return match ? match[0] : "unknown";
  }

  // Check if Firebase error is retryable
  private static isRetryableFirebaseError(code: string): boolean {
    const retryableCodes = [
      "auth/network-request-failed",
      "auth/too-many-requests",
      "unavailable",
      "deadline-exceeded",
      "resource-exhausted",
    ];
    return retryableCodes.includes(code);
  }

  // Show user-friendly error message
  static showError(error: AppError): void {
    const toastOptions = {
      duration: this.getToastDuration(error.severity),
      action: error.retryable
        ? {
            label: "Retry",
            onClick: () => this.handleRetry(error),
          }
        : undefined,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.HIGH:
        toast.error(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.MEDIUM:
        toast.error(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.LOW:
        toast.warning(error.userMessage, toastOptions);
        break;
    }
  }

  // Show success message
  static showSuccess(message: string, duration?: number): void {
    toast.success(message, { duration: duration || 3000 });
  }

  // Show info message
  static showInfo(message: string, duration?: number): void {
    toast.info(message, { duration: duration || 3000 });
  }

  // Get toast duration based on severity
  private static getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 8000;
      case ErrorSeverity.HIGH:
        return 6000;
      case ErrorSeverity.MEDIUM:
        return 4000;
      case ErrorSeverity.LOW:
        return 3000;
      default:
        return 4000;
    }
  }

  // Handle retry logic
  private static handleRetry(error: AppError): void {
    const errorKey = `${error.category}-${error.message}`;
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (attempts >= this.MAX_RETRY_ATTEMPTS) {
      toast.error(
        "Maximum retry attempts reached. Please refresh the page and try again."
      );
      this.retryAttempts.delete(errorKey);
      return;
    }

    this.retryAttempts.set(errorKey, attempts + 1);

    // Exponential backoff
    const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempts);

    setTimeout(() => {
      toast.info(
        `Retrying... (Attempt ${attempts + 1}/${this.MAX_RETRY_ATTEMPTS})`
      );
      // The actual retry logic would be handled by the calling component
    }, delay);
  }

  // Log error for debugging
  private static logError(error: AppError): void {
    const logData = {
      message: error.message,
      category: error.category,
      severity: error.severity,
      userMessage: error.userMessage,
      context: error.context,
      stack: error.stack,
      originalError: error.originalError?.message,
      timestamp: new Date().toISOString(),
    };

    if (
      error.severity === ErrorSeverity.CRITICAL ||
      error.severity === ErrorSeverity.HIGH
    ) {
      console.error("AppError:", logData);
    } else {
      console.warn("AppError:", logData);
    }
  }

  // Clear retry attempts for a specific error
  static clearRetryAttempts(errorKey: string): void {
    this.retryAttempts.delete(errorKey);
  }

  // Clear all retry attempts
  static clearAllRetryAttempts(): void {
    this.retryAttempts.clear();
  }
}

// Utility functions for common error scenarios
export const createAuthError = (
  message: string,
  originalError?: Error
): AppError => {
  return new AppError(
    message,
    ErrorCategory.AUTHENTICATION,
    ErrorSeverity.MEDIUM,
    undefined,
    originalError,
    undefined,
    false
  );
};

export const createVotingError = (
  message: string,
  originalError?: Error
): AppError => {
  return new AppError(
    message,
    ErrorCategory.VOTING,
    ErrorSeverity.MEDIUM,
    undefined,
    originalError,
    undefined,
    true
  );
};

export const createNetworkError = (
  message: string,
  originalError?: Error
): AppError => {
  return new AppError(
    message,
    ErrorCategory.NETWORK,
    ErrorSeverity.HIGH,
    undefined,
    originalError,
    undefined,
    true
  );
};

export const createValidationError = (
  message: string,
  field?: string
): AppError => {
  return new AppError(
    message,
    ErrorCategory.VALIDATION,
    ErrorSeverity.LOW,
    message,
    undefined,
    { field },
    false
  );
};

// Async error wrapper for handling promises
export const handleAsync = async <T>(
  promise: Promise<T>,
  context?: Record<string, any>
): Promise<[T | null, AppError | null]> => {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const appError = ErrorHandler.handle(error, context);
    return [null, appError];
  }
};
