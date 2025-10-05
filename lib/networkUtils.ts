// lib/networkUtils.ts

/**
 * Network utility functions for handling offline/online states
 */

export class NetworkUtils {
  /**
   * Check if the browser is currently online
   */
  static isOnline(): boolean {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  }

  /**
   * Check if an error is network-related
   */
  static isNetworkError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || "";
    const networkKeywords = [
      "network",
      "timeout",
      "offline",
      "fetch",
      "connection",
      "unreachable",
      "failed to fetch",
      "network request failed",
      "load failed",
      "net::",
      "cors",
      "blocked",
    ];

    return networkKeywords.some((keyword) => errorMessage.includes(keyword));
  }

  /**
   * Wait for network to come back online
   */
  static waitForOnline(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        window.removeEventListener("online", onlineHandler);
        resolve(false);
      }, timeout);

      const onlineHandler = () => {
        clearTimeout(timeoutId);
        window.removeEventListener("online", onlineHandler);
        resolve(true);
      };

      window.addEventListener("online", onlineHandler);
    });
  }

  /**
   * Retry a function when network comes back online
   */
  static async retryWhenOnline<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Wait for network if offline
        if (!this.isOnline()) {
          console.log("Waiting for network to come back online...");
          await this.waitForOnline();
        }

        return await fn();
      } catch (error) {
        lastError = error;

        if (this.isNetworkError(error) && i < maxRetries - 1) {
          console.log(
            `Network error, retrying in ${delay}ms... (attempt ${
              i + 1
            }/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }
}
