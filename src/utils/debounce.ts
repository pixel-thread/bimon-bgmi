/**
 * Returns a debounced version of a function.
 * The callback will run only after no calls have occurred for the specified delay.
 *
 * @param fn - Function to debounce.
 * @param delay - Delay in milliseconds.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number = 300,
): (...args: Parameters<T>) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    // Clear any existing timer
    if (timerId) clearTimeout(timerId);

    // Schedule the function call
    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
