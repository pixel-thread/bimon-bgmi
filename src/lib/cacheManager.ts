/**
 * Professional cache management utilities
 */

interface CacheStrategy {
  name: string;
  maxAge: number; // in seconds
  staleWhileRevalidate?: number;
  priority: "high" | "medium" | "low";
}

const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  STATIC_ASSETS: {
    name: "static-assets",
    maxAge: 31536000, // 1 year
    priority: "high",
  },
  API_RESPONSES: {
    name: "api-responses",
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
    priority: "medium",
  },
  DYNAMIC_CONTENT: {
    name: "dynamic-content",
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
    priority: "low",
  },
};

class CacheManager {
  private static instance: CacheManager;

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Clear all application caches
   */
  async clearAllCaches(): Promise<void> {
    if (typeof window === "undefined" || !("caches" in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log("All caches cleared successfully");
    } catch (error) {
      console.error("Failed to clear caches:", error);
      throw error;
    }
  }

  /**
   * Clear specific cache by pattern
   */
  async clearCacheByPattern(pattern: RegExp): Promise<void> {
    if (typeof window === "undefined" || !("caches" in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      const matchingCaches = cacheNames.filter((name) => pattern.test(name));

      await Promise.all(
        matchingCaches.map((cacheName) => caches.delete(cacheName))
      );

      console.log(
        `Cleared ${matchingCaches.length} caches matching pattern:`,
        pattern
      );
    } catch (error) {
      console.error("Failed to clear caches by pattern:", error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<
    Record<string, { size: number; entries: number }>
  > {
    if (typeof window === "undefined" || !("caches" in window)) {
      return {};
    }

    try {
      const cacheNames = await caches.keys();
      const stats: Record<string, { size: number; entries: number }> = {};

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        let totalSize = 0;
        for (const request of keys) {
          try {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          } catch {
            // Skip failed entries
          }
        }

        stats[cacheName] = {
          size: totalSize,
          entries: keys.length,
        };
      }

      return stats;
    } catch (error) {
      console.error("Failed to get cache stats:", error);
      return {};
    }
  }

  /**
   * Preload critical resources
   */
  async preloadCriticalResources(urls: string[]): Promise<void> {
    const preloadPromises = urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          cache: "reload",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (response.ok) {
          // Cache the response for future use
          const cache = await caches.open("preload-cache");
          await cache.put(url, response.clone());
        }
      } catch (error) {
        console.warn(`Failed to preload ${url}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Invalidate cache entries by URL pattern
   */
  async invalidateCacheEntries(urlPattern: RegExp): Promise<void> {
    if (typeof window === "undefined" || !("caches" in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        const keysToDelete = keys.filter((request) =>
          urlPattern.test(request.url)
        );

        await Promise.all(keysToDelete.map((key) => cache.delete(key)));

        if (keysToDelete.length > 0) {
          console.log(
            `Invalidated ${keysToDelete.length} entries from ${cacheName}`
          );
        }
      }
    } catch (error) {
      console.error("Failed to invalidate cache entries:", error);
      throw error;
    }
  }

  /**
   * Get cache headers for a given strategy
   */
  getCacheHeaders(
    strategy: keyof typeof CACHE_STRATEGIES
  ): Record<string, string> {
    const config = CACHE_STRATEGIES[strategy];
    if (!config) {
      throw new Error(`Unknown cache strategy: ${strategy}`);
    }

    const headers: Record<string, string> = {
      "Cache-Control": `public, max-age=${config.maxAge}`,
    };

    if (config.staleWhileRevalidate) {
      headers[
        "Cache-Control"
      ] += `, stale-while-revalidate=${config.staleWhileRevalidate}`;
    }

    return headers;
  }
}

// Export singleton instance and convenience functions
export const cacheManager = CacheManager.getInstance();

export const clearAllCaches = () => cacheManager.clearAllCaches();
export const getCacheStats = () => cacheManager.getCacheStats();
export const preloadCriticalResources = (urls: string[]) =>
  cacheManager.preloadCriticalResources(urls);
export const invalidateCacheEntries = (pattern: RegExp) =>
  cacheManager.invalidateCacheEntries(pattern);
