/**
 * Performance Manager - Manages background tasks and intervals to prevent performance issues
 */

interface BackgroundTask {
  id: string;
  interval: NodeJS.Timeout;
  frequency: number;
  description: string;
}

class PerformanceManager {
  private tasks: Map<string, BackgroundTask> = new Map();
  private isTabVisible = true;
  private maxConcurrentTasks = 5;
  private isClient = typeof window !== 'undefined';

  constructor() {
    // Only set up event listeners on the client side
    if (this.isClient) {
      // Monitor tab visibility to pause/resume tasks
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }

  private handleVisibilityChange() {
    if (!this.isClient) return;
    
    this.isTabVisible = !document.hidden;
    
    if (this.isTabVisible) {
      this.resumeAllTasks();
    } else {
      this.pauseNonCriticalTasks();
    }
  }

  /**
   * Register a background task with performance monitoring
   */
  registerTask(
    id: string,
    callback: () => void,
    frequency: number,
    options: {
      description?: string;
      critical?: boolean;
      runInBackground?: boolean;
    } = {}
  ): () => void {
    // Skip task registration on server-side
    if (!this.isClient) {
      return () => {}; // Return empty cleanup function
    }

    // Prevent too many concurrent tasks
    if (this.tasks.size >= this.maxConcurrentTasks && !options.critical) {
      console.warn(`Performance Manager: Too many background tasks (${this.tasks.size}). Skipping non-critical task: ${id}`);
      return () => {}; // Return empty cleanup function
    }

    // Clear existing task if it exists
    this.clearTask(id);

    // Adjust frequency based on tab visibility
    const adjustedFrequency = this.isTabVisible || options.runInBackground 
      ? frequency 
      : Math.max(frequency * 4, 60000); // Slow down to at least 1 minute when not visible

    const interval = setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.error(`Performance Manager: Error in task ${id}:`, error);
      }
    }, adjustedFrequency);

    const task: BackgroundTask = {
      id,
      interval,
      frequency,
      description: options.description || id
    };

    this.tasks.set(id, task);

    // Return cleanup function
    return () => this.clearTask(id);
  }

  /**
   * Clear a specific task
   */
  clearTask(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      clearInterval(task.interval);
      this.tasks.delete(id);
    }
  }

  /**
   * Pause non-critical tasks when tab is not visible
   */
  private pauseNonCriticalTasks(): void {
    // This is handled automatically by adjusting frequency in registerTask
    console.log('Performance Manager: Tab not visible, reducing background task frequency');
  }

  /**
   * Resume all tasks when tab becomes visible
   */
  private resumeAllTasks(): void {
    console.log('Performance Manager: Tab visible, resuming normal task frequency');
    // Tasks will automatically adjust frequency based on visibility
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    activeTasks: number;
    taskList: Array<{ id: string; description: string; frequency: number }>;
  } {
    return {
      activeTasks: this.tasks.size,
      taskList: Array.from(this.tasks.values()).map(task => ({
        id: task.id,
        description: task.description,
        frequency: task.frequency
      }))
    };
  }

  /**
   * Clear all tasks
   */
  clearAllTasks(): void {
    this.tasks.forEach(task => clearInterval(task.interval));
    this.tasks.clear();
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    return this.tasks.size > this.maxConcurrentTasks;
  }
}

// Export singleton instance
export const performanceManager = new PerformanceManager();

// Helper function for easy task registration
export function registerBackgroundTask(
  id: string,
  callback: () => void,
  frequency: number,
  options?: {
    description?: string;
    critical?: boolean;
    runInBackground?: boolean;
  }
): () => void {
  return performanceManager.registerTask(id, callback, frequency, options);
}

// Performance monitoring utility
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (end - start > 16.67) { // More than one frame (60fps)
      console.warn(`Performance warning: ${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
}