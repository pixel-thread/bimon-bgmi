import { useState, useEffect } from "react";

/**
 * Returns a debounced version of the provided value.
 * It updates only after the specified delay has passed without changes.
 *
 * @param value - Any value that may change frequently.
 * @param delay - Delay in milliseconds.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup when value or delay changes
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
