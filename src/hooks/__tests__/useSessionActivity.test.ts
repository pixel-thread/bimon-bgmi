// hooks/__tests__/useSessionActivity.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionActivity } from "../useSessionActivity";

describe("useSessionActivity", () => {
  let mockOnActivity: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnActivity = vi.fn();
    vi.useFakeTimers();

    // Mock document event listeners
    Object.defineProperty(document, "addEventListener", {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(document, "removeEventListener", {
      value: vi.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should add event listeners for default events", () => {
    renderHook(() =>
      useSessionActivity({
        onActivity: mockOnActivity,
      })
    );

    const defaultEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    defaultEvents.forEach((event) => {
      expect(document.addEventListener).toHaveBeenCalledWith(
        event,
        expect.any(Function),
        { passive: true }
      );
    });
  });

  it("should add event listeners for custom events", () => {
    const customEvents = ["focus", "blur"];

    renderHook(() =>
      useSessionActivity({
        onActivity: mockOnActivity,
        events: customEvents,
      })
    );

    customEvents.forEach((event) => {
      expect(document.addEventListener).toHaveBeenCalledWith(
        event,
        expect.any(Function),
        { passive: true }
      );
    });
  });

  it("should remove event listeners on unmount", () => {
    const { unmount } = renderHook(() =>
      useSessionActivity({
        onActivity: mockOnActivity,
      })
    );

    unmount();

    const defaultEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    defaultEvents.forEach((event) => {
      expect(document.removeEventListener).toHaveBeenCalledWith(
        event,
        expect.any(Function)
      );
    });
  });

  it("should call onActivity after debounce delay", () => {
    renderHook(() =>
      useSessionActivity({
        onActivity: mockOnActivity,
      })
    );

    // Get the event handler that was registered
    const addEventListenerCalls = (document.addEventListener as any).mock.calls;
    const mousedownHandler = addEventListenerCalls.find(
      (call: any) => call[0] === "mousedown"
    )[1];

    // Simulate activity
    act(() => {
      mousedownHandler();
    });

    // Should not be called immediately
    expect(mockOnActivity).not.toHaveBeenCalled();

    // Fast-forward past debounce delay (1 second)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockOnActivity).toHaveBeenCalledTimes(1);
  });

  it("should throttle activity detection", () => {
    const throttleMs = 5000; // 5 seconds

    renderHook(() =>
      useSessionActivity({
        onActivity: mockOnActivity,
        throttleMs,
      })
    );

    const addEventListenerCalls = (document.addEventListener as any).mock.calls;
    const mousedownHandler = addEventListenerCalls.find(
      (call: any) => call[0] === "mousedown"
    )[1];

    // First activity
    act(() => {
      mousedownHandler();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockOnActivity).toHaveBeenCalledTimes(1);

    // Second activity within throttle period
    act(() => {
      mousedownHandler();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should still be 1 because of throttling
    expect(mockOnActivity).toHaveBeenCalledTimes(1);

    // Third activity after throttle period
    act(() => {
      vi.advanceTimersByTime(throttleMs);
      mousedownHandler();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockOnActivity).toHaveBeenCalledTimes(2);
  });

  it("should debounce multiple rapid activities", () => {
    renderHook(() =>
      useSessionActivity({
        onActivity: mockOnActivity,
      })
    );

    const addEventListenerCalls = (document.addEventListener as any).mock.calls;
    const mousedownHandler = addEventListenerCalls.find(
      (call: any) => call[0] === "mousedown"
    )[1];

    // Simulate rapid activities within throttle period
    act(() => {
      mousedownHandler();
    });

    // Fast-forward past debounce delay for first activity
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockOnActivity).toHaveBeenCalledTimes(1);

    // Simulate more rapid activities within throttle period (should be ignored)
    act(() => {
      mousedownHandler();
      mousedownHandler();
      mousedownHandler();
    });

    // Fast-forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should still be 1 due to throttling
    expect(mockOnActivity).toHaveBeenCalledTimes(1);
  });

  it("should handle activity from different event types", () => {
    renderHook(() =>
      useSessionActivity({
        onActivity: mockOnActivity,
        events: ["click", "keypress"],
      })
    );

    const addEventListenerCalls = (document.addEventListener as any).mock.calls;
    const clickHandler = addEventListenerCalls.find(
      (call: any) => call[0] === "click"
    )[1];
    const keypressHandler = addEventListenerCalls.find(
      (call: any) => call[0] === "keypress"
    )[1];

    // Activity from click
    act(() => {
      clickHandler();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockOnActivity).toHaveBeenCalledTimes(1);

    // Activity from keypress (should be throttled)
    act(() => {
      keypressHandler();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should still be 1 due to throttling
    expect(mockOnActivity).toHaveBeenCalledTimes(1);
  });

  it("should clear timeout on unmount", () => {
    const { unmount } = renderHook(() =>
      useSessionActivity({
        onActivity: mockOnActivity,
      })
    );

    const addEventListenerCalls = (document.addEventListener as any).mock.calls;
    const mousedownHandler = addEventListenerCalls.find(
      (call: any) => call[0] === "mousedown"
    )[1];

    // Trigger activity
    act(() => {
      mousedownHandler();
    });

    // Unmount before timeout
    unmount();

    // Fast-forward past debounce delay
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should not be called because component was unmounted
    expect(mockOnActivity).not.toHaveBeenCalled();
  });

  // Note: Window undefined handling is already implemented in the hook
  // with the typeof window !== "undefined" check
});
