interface VersionInfo {
  version: string;
  buildTime: string;
  commitHash?: string;
}

interface UpdateStrategy {
  immediate: boolean;
  delay: number;
  retryAttempts: number;
}

interface PartialUpdateStrategy {
  immediate?: boolean;
  delay?: number;
  retryAttempts?: number;
}

class VersionManager {
  private static instance: VersionManager;
  private currentVersion: string | null = null;
  private updateInProgress = false;
  private retryCount = 0;
  private maxRetries = 3;

  private readonly STORAGE_KEY = "app_version_info";
  private readonly CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private readonly RETRY_DELAY = 5000; // 5 seconds

  static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager();
    }
    return VersionManager.instance;
  }

  private constructor() {
    this.initializeVersion();
  }

  private initializeVersion(): void {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const versionInfo: VersionInfo = JSON.parse(stored);
        this.currentVersion = versionInfo.version;
      } catch {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    versionInfo?: VersionInfo;
  }> {
    try {
      const response = await fetch("/api/version", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`);
      }

      const versionInfo: VersionInfo = await response.json();
      const hasUpdate =
        this.currentVersion && this.currentVersion !== versionInfo.version;

      if (!hasUpdate) {
        this.updateStoredVersion(versionInfo);
      }

      return { hasUpdate: Boolean(hasUpdate), versionInfo };
    } catch (error) {
      console.error("Version check failed:", error);
      return { hasUpdate: false };
    }
  }

  private updateStoredVersion(versionInfo: VersionInfo): void {
    if (typeof window === "undefined") return;

    this.currentVersion = versionInfo.version;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versionInfo));
  }

  async performUpdate(
    partialStrategy: PartialUpdateStrategy = {}
  ): Promise<void> {
    // Merge with defaults to ensure all required properties are present
    const strategy: UpdateStrategy = {
      immediate: partialStrategy.immediate ?? false,
      delay: partialStrategy.delay ?? 2000,
      retryAttempts: partialStrategy.retryAttempts ?? 3,
    };
    if (this.updateInProgress) return;

    // Safety check: Don't update if forms are being edited
    if (!this.isSafeToUpdate()) {
      console.log("Update postponed: forms are being edited");
      // Retry after a longer delay
      setTimeout(() => this.performUpdate(partialStrategy), 60000); // 60 seconds
      return;
    }

    this.updateInProgress = true;
    this.maxRetries = strategy.retryAttempts;

    try {
      if (!strategy.immediate) {
        await this.delay(strategy.delay);
      }

      await this.preloadCriticalResources();
      await this.clearApplicationCache();

      // Perform soft navigation refresh
      this.performSoftRefresh();
    } catch (error) {
      console.error("Update failed:", error);
      await this.handleUpdateFailure();
    } finally {
      this.updateInProgress = false;
    }
  }

  private async preloadCriticalResources(): Promise<void> {
    const criticalRoutes = ["/", "/tournament", "/admin"];
    const preloadPromises = criticalRoutes.map(
      (route) =>
        fetch(route, {
          cache: "reload",
          headers: { "Cache-Control": "no-cache" },
        }).catch(() => {}) // Silent fail for individual routes
    );

    await Promise.allSettled(preloadPromises);
  }

  private async clearApplicationCache(): Promise<void> {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      } catch (error) {
        console.warn("Cache clearing failed:", error);
      }
    }

    // Clear version info to force fresh check
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private performSoftRefresh(): void {
    // Use location.replace for a cleaner refresh without history entry
    window.location.replace(window.location.href);
  }

  private async handleUpdateFailure(): Promise<void> {
    this.retryCount++;

    if (this.retryCount < this.maxRetries) {
      console.log(
        `Update failed, retrying... (${this.retryCount}/${this.maxRetries})`
      );
      await this.delay(this.RETRY_DELAY * this.retryCount);
      return this.performUpdate({
        immediate: true,
        delay: 0,
        retryAttempts: this.maxRetries,
      });
    }

    // Final fallback - hard refresh
    console.warn("All update attempts failed, performing hard refresh");
    window.location.reload();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isSafeToUpdate(): boolean {
    if (typeof window === "undefined") return true;

    // Check for active form inputs
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT" ||
        (activeElement as HTMLElement).contentEditable === "true")
    ) {
      return false;
    }

    // Check for any forms with unsaved changes
    const forms = document.querySelectorAll("form");
    for (const form of forms) {
      const inputs = form.querySelectorAll("input, textarea, select");
      for (const input of inputs) {
        // Check if input has been modified (has value different from default)
        if (input.tagName === "SELECT") {
          const selectElement = input as HTMLSelectElement;
          if (selectElement.value && selectElement.selectedIndex !== 0) {
            return false;
          }
        } else {
          const element = input as HTMLInputElement | HTMLTextAreaElement;
          if (element.value && element.value !== element.defaultValue) {
            return false;
          }
        }
      }
    }

    // Check for any contentEditable elements with content
    const editableElements = document.querySelectorAll(
      '[contenteditable="true"]'
    );
    for (const element of editableElements) {
      if (element.textContent && element.textContent.trim().length > 0) {
        return false;
      }
    }

    return true;
  }

  // Public API
  startPeriodicChecks(
    onUpdateAvailable?: (versionInfo: VersionInfo) => void
  ): () => void {
    const checkForUpdates = async () => {
      const { hasUpdate, versionInfo } = await this.checkForUpdates();
      if (hasUpdate && versionInfo) {
        if (onUpdateAvailable) {
          onUpdateAvailable(versionInfo);
        } else {
          // Auto-update if no callback provided and it's safe
          if (this.isSafeToUpdate()) {
            await this.performUpdate({ immediate: false, delay: 2000 });
          } else {
            // Retry in 30 seconds if not safe
            setTimeout(checkForUpdates, 30000);
          }
        }
      }
    };

    // Initial check after a delay
    const initialTimeout = setTimeout(checkForUpdates, 5000);

    // Periodic checks
    const interval = setInterval(checkForUpdates, this.CHECK_INTERVAL);

    // Visibility change check
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(checkForUpdates, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Return cleanup function
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }
}

// Export singleton instance and convenience functions
export const versionManager = VersionManager.getInstance();

export const checkForUpdates = () => versionManager.checkForUpdates();
export const performUpdate = (strategy?: PartialUpdateStrategy) =>
  versionManager.performUpdate(strategy);
export const startUpdateMonitoring = (
  callback?: (versionInfo: VersionInfo) => void
) => versionManager.startPeriodicChecks(callback);
