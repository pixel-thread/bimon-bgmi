// lib/serviceWorker.ts
"use client";

interface ServiceWorkerManager {
  register(): Promise<ServiceWorkerRegistration | null>;
  unregister(): Promise<boolean>;
  update(): Promise<void>;
  clearAllCaches(): Promise<void>;
  getCacheInfo(): Promise<Record<string, number>>;
  isSupported(): boolean;
}

class ServiceWorkerManagerImpl implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  isSupported(): boolean {
    return typeof window !== "undefined" && "serviceWorker" in navigator;
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      this.setupUpdateChecking();

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      return this.registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;
    try {
      const result = await this.registration.unregister();
      if (this.updateCheckInterval) {
        clearInterval(this.updateCheckInterval);
      }
      return result;
    } catch (error) {
      console.error("Service Worker unregistration failed:", error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error("Service Worker not registered");
    }
    try {
      await this.registration.update();
    } catch (error) {
      console.error("Service Worker update failed:", error);
      throw error;
    }
  }

  async clearAllCaches(): Promise<void> {
    if (!this.isSupported()) return;
    try {
      await this.sendMessage({ type: "CLEAR_ALL_CACHES" });
    } catch (error) {
      console.error("Failed to clear caches:", error);
      throw error;
    }
  }

  async getCacheInfo(): Promise<Record<string, number>> {
    if (!this.isSupported()) return {};
    try {
      return await this.sendMessage({ type: "GET_CACHE_INFO" });
    } catch (error) {
      console.error("Failed to get cache info:", error);
      return {};
    }
  }

  private setupUpdateChecking(): void {
    if (!this.registration) return;

    // 🚨 Skip update checks on localhost (development mode)
    if (
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    ) {
      console.info(
        "Skipping Service Worker auto-update checks in development."
      );
      return;
    }

    // Production only: check every 30 minutes
    this.updateCheckInterval = setInterval(() => {
      this.update().catch(() => {});
    }, 30 * 60 * 1000);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.update().catch(() => {});
      }
    });

    this.registration.addEventListener("updatefound", () => {
      const newWorker = this.registration!.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          this.handleServiceWorkerUpdate();
        }
      });
    });
  }

  private handleServiceWorkerUpdate(): void {
    this.sendMessage({ type: "SKIP_WAITING" }).catch(() => {});
  }

  private async sendMessage(message: any): Promise<any> {
    if (!this.isSupported()) {
      throw new Error("Service Worker not supported");
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => resolve(event.data);
      messageChannel.port1.onmessageerror = (event) => reject(event.data);

      navigator.serviceWorker.ready
        .then((registration) => {
          if (registration.active) {
            registration.active.postMessage(message, [messageChannel.port2]);
          } else {
            reject(new Error("No active Service Worker"));
          }
        })
        .catch(reject);

      setTimeout(() => {
        reject(new Error("Service Worker message timeout"));
      }, 10000);
    });
  }
}

export const serviceWorkerManager = new ServiceWorkerManagerImpl();
export const registerServiceWorker = () => serviceWorkerManager.register();
export const clearServiceWorkerCache = () =>
  serviceWorkerManager.clearAllCaches();
export const updateServiceWorker = () => serviceWorkerManager.update();
export const getServiceWorkerCacheInfo = () =>
  serviceWorkerManager.getCacheInfo();
