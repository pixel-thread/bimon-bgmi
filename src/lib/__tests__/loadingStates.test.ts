// lib/__tests__/loadingStates.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  LoadingStateManager,
  LoadingOperation,
  LOADING_MESSAGES,
  withLoadingState,
} from "../loadingStates";

describe("LoadingStates", () => {
  beforeEach(() => {
    LoadingStateManager.clearAll();
  });

  describe("LoadingStateManager", () => {
    it("should start loading operation", () => {
      LoadingStateManager.startLoading("test-op", LoadingOperation.LOGIN);

      expect(LoadingStateManager.isLoading("test-op")).toBe(true);

      const state = LoadingStateManager.getLoadingState("test-op");
      expect(state).toEqual({
        isLoading: true,
        operation: LoadingOperation.LOGIN,
        message: LOADING_MESSAGES[LoadingOperation.LOGIN],
        progress: 0,
      });
    });

    it("should start loading with custom message", () => {
      const customMessage = "Custom loading message";
      LoadingStateManager.startLoading(
        "test-op",
        LoadingOperation.LOGIN,
        customMessage
      );

      const state = LoadingStateManager.getLoadingState("test-op");
      expect(state?.message).toBe(customMessage);
    });

    it("should update progress", () => {
      LoadingStateManager.startLoading("test-op", LoadingOperation.LOGIN);
      LoadingStateManager.updateProgress("test-op", 50, "Half way there");

      const state = LoadingStateManager.getLoadingState("test-op");
      expect(state?.progress).toBe(50);
      expect(state?.message).toBe("Half way there");
    });

    it("should clamp progress between 0 and 100", () => {
      LoadingStateManager.startLoading("test-op", LoadingOperation.LOGIN);

      LoadingStateManager.updateProgress("test-op", -10);
      expect(LoadingStateManager.getLoadingState("test-op")?.progress).toBe(0);

      LoadingStateManager.updateProgress("test-op", 150);
      expect(LoadingStateManager.getLoadingState("test-op")?.progress).toBe(
        100
      );
    });

    it("should stop loading operation", () => {
      LoadingStateManager.startLoading("test-op", LoadingOperation.LOGIN);
      expect(LoadingStateManager.isLoading("test-op")).toBe(true);

      LoadingStateManager.stopLoading("test-op");
      expect(LoadingStateManager.isLoading("test-op")).toBe(false);
      expect(LoadingStateManager.getLoadingState("test-op")).toBeNull();
    });

    it("should handle multiple operations", () => {
      LoadingStateManager.startLoading("op1", LoadingOperation.LOGIN);
      LoadingStateManager.startLoading("op2", LoadingOperation.SUBMIT_VOTE);

      expect(LoadingStateManager.isLoading("op1")).toBe(true);
      expect(LoadingStateManager.isLoading("op2")).toBe(true);
      expect(LoadingStateManager.hasActiveOperations()).toBe(true);

      const activeOps = LoadingStateManager.getActiveOperations();
      expect(activeOps.size).toBe(2);
    });

    it("should clear all operations", () => {
      LoadingStateManager.startLoading("op1", LoadingOperation.LOGIN);
      LoadingStateManager.startLoading("op2", LoadingOperation.SUBMIT_VOTE);

      LoadingStateManager.clearAll();

      expect(LoadingStateManager.hasActiveOperations()).toBe(false);
      expect(LoadingStateManager.getActiveOperations().size).toBe(0);
    });

    it("should handle subscribers", () => {
      const listener = vi.fn();
      const unsubscribe = LoadingStateManager.subscribe(listener);

      LoadingStateManager.startLoading("test-op", LoadingOperation.LOGIN);
      expect(listener).toHaveBeenCalledWith(expect.any(Map));

      LoadingStateManager.stopLoading("test-op");
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
      LoadingStateManager.startLoading("test-op2", LoadingOperation.LOGOUT);
      expect(listener).toHaveBeenCalledTimes(2); // Should not be called after unsubscribe
    });

    it("should not update progress for non-existent operation", () => {
      LoadingStateManager.updateProgress("non-existent", 50);
      expect(LoadingStateManager.getLoadingState("non-existent")).toBeNull();
    });
  });

  describe("LOADING_MESSAGES", () => {
    it("should have messages for all operations", () => {
      const operations = Object.values(LoadingOperation);

      operations.forEach((operation) => {
        expect(LOADING_MESSAGES[operation]).toBeDefined();
        expect(typeof LOADING_MESSAGES[operation]).toBe("string");
        expect(LOADING_MESSAGES[operation].length).toBeGreaterThan(0);
      });
    });

    it("should have appropriate messages", () => {
      expect(LOADING_MESSAGES[LoadingOperation.LOGIN]).toBe("Signing in...");
      expect(LOADING_MESSAGES[LoadingOperation.LOGOUT]).toBe("Signing out...");
      expect(LOADING_MESSAGES[LoadingOperation.SUBMIT_VOTE]).toBe(
        "Submitting your vote..."
      );
      expect(LOADING_MESSAGES[LoadingOperation.CREATE_POLL]).toBe(
        "Creating poll..."
      );
    });
  });

  describe("withLoadingState", () => {
    it("should wrap async function with loading state", async () => {
      const asyncFn = vi.fn().mockResolvedValue("success");
      const operationId = "test-operation";

      const result = await withLoadingState(
        operationId,
        LoadingOperation.LOGIN,
        asyncFn
      );

      expect(result).toBe("success");
      expect(asyncFn).toHaveBeenCalled();
      expect(LoadingStateManager.isLoading(operationId)).toBe(false);
    });

    it("should handle async function errors", async () => {
      const error = new Error("Test error");
      const asyncFn = vi.fn().mockRejectedValue(error);
      const operationId = "test-operation";

      await expect(
        withLoadingState(operationId, LoadingOperation.LOGIN, asyncFn)
      ).rejects.toThrow("Test error");

      expect(LoadingStateManager.isLoading(operationId)).toBe(false);
    });

    it("should start and stop loading state", async () => {
      const asyncFn = vi.fn().mockImplementation(async () => {
        // Check that loading state is active during execution
        expect(LoadingStateManager.isLoading("test-operation")).toBe(true);
        return "success";
      });

      expect(LoadingStateManager.isLoading("test-operation")).toBe(false);

      await withLoadingState("test-operation", LoadingOperation.LOGIN, asyncFn);

      expect(LoadingStateManager.isLoading("test-operation")).toBe(false);
    });
  });

  describe("LoadingOperation enum", () => {
    it("should have all expected operations", () => {
      const expectedOperations = [
        "LOGIN",
        "LOGOUT",
        "SUBMIT_VOTE",
        "CREATE_POLL",
        "UPDATE_POLL",
        "DELETE_POLL",
        "LOAD_POLLS",
        "LOAD_POLL_RESULTS",
        "CREATE_PLAYER",
        "UPDATE_PLAYER",
        "DELETE_PLAYER",
        "LOAD_PLAYERS",
        "VALIDATE_CREDENTIALS",
        "SEND_PASSWORD_RESET",
        "GOOGLE_SIGNIN",
        "PLAYER_SUGGESTIONS",
      ];

      expectedOperations.forEach((operation) => {
        expect(
          LoadingOperation[operation as keyof typeof LoadingOperation]
        ).toBeDefined();
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle updating progress for stopped operation", () => {
      LoadingStateManager.startLoading("test-op", LoadingOperation.LOGIN);
      LoadingStateManager.stopLoading("test-op");

      // Should not throw error
      LoadingStateManager.updateProgress("test-op", 50);
      expect(LoadingStateManager.getLoadingState("test-op")).toBeNull();
    });

    it("should handle multiple subscribers", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = LoadingStateManager.subscribe(listener1);
      const unsubscribe2 = LoadingStateManager.subscribe(listener2);

      LoadingStateManager.startLoading("test-op", LoadingOperation.LOGIN);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();

      unsubscribe1();
      unsubscribe2();
    });

    it("should handle unsubscribing non-existent listener", () => {
      const listener = vi.fn();
      const unsubscribe = LoadingStateManager.subscribe(listener);

      unsubscribe();
      unsubscribe(); // Should not throw error

      expect(true).toBe(true); // Test passes if no error is thrown
    });
  });
});
