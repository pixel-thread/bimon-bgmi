// lib/__tests__/errorHandling.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ErrorHandler,
  AppError,
  ErrorCategory,
  ErrorSeverity,
  createAuthError,
  createVotingError,
  createNetworkError,
  createValidationError,
  handleAsync,
  FIREBASE_ERROR_MESSAGES,
} from "../errorHandling";

// Mock sonner toast
const mockToast = {
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock("sonner", () => ({
  toast: mockToast,
}));

describe("ErrorHandling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.error.mockClear();
    mockToast.success.mockClear();
    mockToast.warning.mockClear();
    mockToast.info.mockClear();
    ErrorHandler.clearAllRetryAttempts();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("AppError", () => {
    it("should create an AppError with all properties", () => {
      const error = new AppError(
        "Test error",
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        "User friendly message",
        new Error("Original error"),
        { context: "test" },
        true
      );

      expect(error.message).toBe("Test error");
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.userMessage).toBe("User friendly message");
      expect(error.originalError?.message).toBe("Original error");
      expect(error.context).toEqual({ context: "test" });
      expect(error.retryable).toBe(true);
    });

    it("should generate default user message when not provided", () => {
      const error = new AppError(
        "Test error",
        ErrorCategory.VOTING,
        ErrorSeverity.MEDIUM
      );

      expect(error.userMessage).toBe(
        "Unable to submit your vote. Please try again."
      );
    });
  });

  describe("ErrorHandler.handle", () => {
    it("should handle AppError instances", () => {
      const originalError = new AppError(
        "Test error",
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH
      );

      const result = ErrorHandler.handle(originalError);

      expect(result).toBe(originalError);
    });

    it("should handle Firebase auth errors", () => {
      const firebaseError = new Error("auth/user-not-found");

      const result = ErrorHandler.handle(firebaseError);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.userMessage).toBe(
        FIREBASE_ERROR_MESSAGES["auth/user-not-found"]
      );
    });

    it("should handle network errors", () => {
      const networkError = new Error("Network request failed");

      const result = ErrorHandler.handle(networkError);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.retryable).toBe(true);
    });

    it("should handle permission errors", () => {
      const permissionError = new Error("Permission denied");

      const result = ErrorHandler.handle(permissionError);

      expect(result.category).toBe(ErrorCategory.PERMISSION);
      expect(result.retryable).toBe(false);
    });

    it("should handle validation errors", () => {
      const validationError = new Error("Invalid input provided");

      const result = ErrorHandler.handle(validationError);

      expect(result.category).toBe(ErrorCategory.VALIDATION);
      expect(result.severity).toBe(ErrorSeverity.LOW);
    });

    it("should handle unknown errors", () => {
      const unknownError = "Unknown error";

      const result = ErrorHandler.handle(unknownError);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.message).toBe("Unknown error occurred");
    });
  });

  describe("ErrorHandler.showError", () => {
    it("should call toast.error for high severity errors", () => {
      const error = new AppError(
        "Test error",
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        "High severity error"
      );

      ErrorHandler.showError(error);

      expect(mockToast.error).toHaveBeenCalledWith(
        "High severity error",
        expect.objectContaining({
          duration: 6000,
        })
      );
    });

    it("should call toast.warning for low severity errors", () => {
      const error = new AppError(
        "Test error",
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        "Low severity error"
      );

      ErrorHandler.showError(error);

      expect(mockToast.warning).toHaveBeenCalledWith(
        "Low severity error",
        expect.objectContaining({
          duration: 3000,
        })
      );
    });

    it("should include retry action for retryable errors", () => {
      const error = new AppError(
        "Test error",
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        "Network error",
        undefined,
        undefined,
        true
      );

      ErrorHandler.showError(error);

      expect(mockToast.error).toHaveBeenCalledWith(
        "Network error",
        expect.objectContaining({
          action: expect.objectContaining({
            label: "Retry",
            onClick: expect.any(Function),
          }),
        })
      );
    });
  });

  describe("ErrorHandler.showSuccess", () => {
    it("should call toast.success with default duration", () => {
      ErrorHandler.showSuccess("Success message");

      expect(mockToast.success).toHaveBeenCalledWith("Success message", {
        duration: 3000,
      });
    });

    it("should call toast.success with custom duration", () => {
      ErrorHandler.showSuccess("Success message", 5000);

      expect(mockToast.success).toHaveBeenCalledWith("Success message", {
        duration: 5000,
      });
    });
  });

  describe("Utility functions", () => {
    it("should create auth error", () => {
      const error = createAuthError("Auth failed");

      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
    });

    it("should create voting error", () => {
      const error = createVotingError("Vote failed");

      expect(error.category).toBe(ErrorCategory.VOTING);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(true);
    });

    it("should create network error", () => {
      const error = createNetworkError("Network failed");

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
    });

    it("should create validation error", () => {
      const error = createValidationError("Invalid input", "email");

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.retryable).toBe(false);
      expect(error.context).toEqual({ field: "email" });
    });
  });

  describe("handleAsync", () => {
    it("should return result on success", async () => {
      const successPromise = Promise.resolve("success");

      const [result, error] = await handleAsync(successPromise);

      expect(result).toBe("success");
      expect(error).toBeNull();
    });

    it("should return AppError on failure", async () => {
      const failurePromise = Promise.reject(new Error("Test error"));

      const [result, error] = await handleAsync(failurePromise, {
        context: "test",
      });

      expect(result).toBeNull();
      expect(error).toBeInstanceOf(AppError);
      expect(error?.message).toBe("Test error");
      expect(error?.context).toEqual({ context: "test" });
    });

    it("should handle AppError instances", async () => {
      const appError = new AppError("App error", ErrorCategory.AUTHENTICATION);
      const failurePromise = Promise.reject(appError);

      const [result, error] = await handleAsync(failurePromise);

      expect(result).toBeNull();
      expect(error).toBe(appError);
    });
  });

  describe("Firebase error handling", () => {
    it("should extract Firebase error codes correctly", () => {
      const firebaseError = new Error("FirebaseError: auth/user-not-found");

      const result = ErrorHandler.handle(firebaseError);

      expect(result.userMessage).toBe(
        FIREBASE_ERROR_MESSAGES["auth/user-not-found"]
      );
    });

    it("should handle retryable Firebase errors", () => {
      const networkError = new Error("auth/network-request-failed");

      const result = ErrorHandler.handle(networkError);

      expect(result.retryable).toBe(true);
    });

    it("should handle non-retryable Firebase errors", () => {
      const userError = new Error("auth/user-not-found");

      const result = ErrorHandler.handle(userError);

      expect(result.retryable).toBe(false);
    });
  });

  describe("Retry mechanism", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should clear retry attempts", () => {
      ErrorHandler.clearRetryAttempts("test-error");
      ErrorHandler.clearAllRetryAttempts();

      // No assertions needed, just testing that methods don't throw
      expect(true).toBe(true);
    });
  });
});
