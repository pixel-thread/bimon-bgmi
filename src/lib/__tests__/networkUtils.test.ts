// lib/__tests__/networkUtils.test.ts

import { NetworkUtils } from "../networkUtils";

// Mock navigator.onLine
Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: true,
});

describe("NetworkUtils", () => {
  describe("isOnline", () => {
    it("should return true when navigator.onLine is true", () => {
      (navigator as any).onLine = true;
      expect(NetworkUtils.isOnline()).toBe(true);
    });

    it("should return false when navigator.onLine is false", () => {
      (navigator as any).onLine = false;
      expect(NetworkUtils.isOnline()).toBe(false);
    });

    it("should return true when navigator is undefined (SSR)", () => {
      const originalNavigator = global.navigator;
      delete (global as any).navigator;
      expect(NetworkUtils.isOnline()).toBe(true);
      global.navigator = originalNavigator;
    });
  });

  describe("isNetworkError", () => {
    it("should detect network-related errors", () => {
      const networkErrors = [
        new Error("Network request failed"),
        new Error("Failed to fetch"),
        new Error("Connection timeout"),
        new Error("Network is offline"),
        new Error("net::ERR_NETWORK_CHANGED"),
        new Error("CORS error"),
        new Error("Load failed"),
      ];

      networkErrors.forEach((error) => {
        expect(NetworkUtils.isNetworkError(error)).toBe(true);
      });
    });

    it("should not detect non-network errors", () => {
      const nonNetworkErrors = [
        new Error("Invalid credentials"),
        new Error("User not found"),
        new Error("Permission denied"),
        new Error("Validation failed"),
      ];

      nonNetworkErrors.forEach((error) => {
        expect(NetworkUtils.isNetworkError(error)).toBe(false);
      });
    });

    it("should handle null/undefined errors", () => {
      expect(NetworkUtils.isNetworkError(null)).toBe(false);
      expect(NetworkUtils.isNetworkError(undefined)).toBe(false);
    });
  });

  describe("waitForOnline", () => {
    beforeEach(() => {
      // Reset navigator.onLine
      (navigator as any).onLine = true;
    });

    it("should resolve immediately if already online", async () => {
      (navigator as any).onLine = true;
      const result = await NetworkUtils.waitForOnline(1000);
      expect(result).toBe(true);
    });

    it("should resolve when online event is fired", async () => {
      (navigator as any).onLine = false;

      // Simulate coming online after 100ms
      setTimeout(() => {
        (navigator as any).onLine = true;
        window.dispatchEvent(new Event("online"));
      }, 100);

      const result = await NetworkUtils.waitForOnline(1000);
      expect(result).toBe(true);
    });

    it("should timeout if network does not come online", async () => {
      (navigator as any).onLine = false;
      const result = await NetworkUtils.waitForOnline(100);
      expect(result).toBe(false);
    });
  });
});
