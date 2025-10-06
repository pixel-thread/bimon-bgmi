// lib/loadingStates.ts
import React from "react";

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
  message?: string;
}

// Loading operations enum
export enum LoadingOperation {
  LOGIN = "login",
  LOGOUT = "logout",
  SUBMIT_VOTE = "submit_vote",
  CREATE_POLL = "create_poll",
  UPDATE_POLL = "update_poll",
  DELETE_POLL = "delete_poll",
  LOAD_POLLS = "load_polls",
  LOAD_POLL_RESULTS = "load_poll_results",
  CREATE_PLAYER = "create_player",
  UPDATE_PLAYER = "update_player",
  DELETE_PLAYER = "delete_player",
  LOAD_PLAYERS = "load_players",
  VALIDATE_CREDENTIALS = "validate_credentials",
  SEND_PASSWORD_RESET = "send_password_reset",
  GOOGLE_SIGNIN = "google_signin",
  PLAYER_SUGGESTIONS = "player_suggestions",
}

// Loading messages for different operations
export const LOADING_MESSAGES: Record<LoadingOperation, string> = {
  [LoadingOperation.LOGIN]: "Signing in...",
  [LoadingOperation.LOGOUT]: "Signing out...",
  [LoadingOperation.SUBMIT_VOTE]: "Submitting your vote...",
  [LoadingOperation.CREATE_POLL]: "Creating poll...",
  [LoadingOperation.UPDATE_POLL]: "Updating poll...",
  [LoadingOperation.DELETE_POLL]: "Deleting poll...",
  [LoadingOperation.LOAD_POLLS]: "Loading polls...",
  [LoadingOperation.LOAD_POLL_RESULTS]: "Loading poll results...",
  [LoadingOperation.CREATE_PLAYER]: "Creating player account...",
  [LoadingOperation.UPDATE_PLAYER]: "Updating player...",
  [LoadingOperation.DELETE_PLAYER]: "Deleting player...",
  [LoadingOperation.LOAD_PLAYERS]: "Loading players...",
  [LoadingOperation.VALIDATE_CREDENTIALS]: "Validating credentials...",
  [LoadingOperation.SEND_PASSWORD_RESET]: "Sending reset email...",
  [LoadingOperation.GOOGLE_SIGNIN]: "Signing in with Google...",
  [LoadingOperation.PLAYER_SUGGESTIONS]: "Loading suggestions...",
};

// Loading state manager class
export class LoadingStateManager {
  private static activeOperations = new Map<string, LoadingState>();
  private static listeners = new Set<
    (operations: Map<string, LoadingState>) => void
  >();

  // Start a loading operation
  static startLoading(
    operationId: string,
    operation: LoadingOperation,
    message?: string
  ): void {
    const loadingState: LoadingState = {
      isLoading: true,
      operation,
      message: message || LOADING_MESSAGES[operation],
      progress: 0,
    };

    this.activeOperations.set(operationId, loadingState);
    this.notifyListeners();
  }

  // Update loading progress
  static updateProgress(
    operationId: string,
    progress: number,
    message?: string
  ): void {
    const existing = this.activeOperations.get(operationId);
    if (existing) {
      this.activeOperations.set(operationId, {
        ...existing,
        progress: Math.max(0, Math.min(100, progress)),
        message: message || existing.message,
      });
      this.notifyListeners();
    }
  }

  // Stop a loading operation
  static stopLoading(operationId: string): void {
    this.activeOperations.delete(operationId);
    this.notifyListeners();
  }

  // Check if an operation is loading
  static isLoading(operationId: string): boolean {
    return this.activeOperations.has(operationId);
  }

  // Get loading state for an operation
  static getLoadingState(operationId: string): LoadingState | null {
    return this.activeOperations.get(operationId) || null;
  }

  // Check if any operation is loading
  static hasActiveOperations(): boolean {
    return this.activeOperations.size > 0;
  }

  // Get all active operations
  static getActiveOperations(): Map<string, LoadingState> {
    return new Map(this.activeOperations);
  }

  // Subscribe to loading state changes
  static subscribe(
    listener: (operations: Map<string, LoadingState>) => void
  ): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private static notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(new Map(this.activeOperations));
    });
  }

  // Clear all loading states
  static clearAll(): void {
    this.activeOperations.clear();
    this.notifyListeners();
  }
}

// React hook for managing loading states
export const useLoadingState = (operationId?: string) => {
  const [loadingStates, setLoadingStates] = React.useState<
    Map<string, LoadingState>
  >(new Map());

  React.useEffect(() => {
    const unsubscribe = LoadingStateManager.subscribe(setLoadingStates);
    return unsubscribe;
  }, []);

  const startLoading = React.useCallback(
    (operation: LoadingOperation, message?: string, id?: string) => {
      const finalId = id || operationId || operation;
      LoadingStateManager.startLoading(finalId, operation, message);
    },
    [operationId]
  );

  const stopLoading = React.useCallback(
    (id?: string) => {
      const finalId = id || operationId;
      if (finalId) {
        LoadingStateManager.stopLoading(finalId);
      }
    },
    [operationId]
  );

  const updateProgress = React.useCallback(
    (progress: number, message?: string, id?: string) => {
      const finalId = id || operationId;
      if (finalId) {
        LoadingStateManager.updateProgress(finalId, progress, message);
      }
    },
    [operationId]
  );

  const isLoading = React.useCallback(
    (id?: string) => {
      const finalId = id || operationId;
      return finalId ? LoadingStateManager.isLoading(finalId) : false;
    },
    [operationId]
  );

  const getLoadingState = React.useCallback(
    (id?: string) => {
      const finalId = id || operationId;
      return finalId ? LoadingStateManager.getLoadingState(finalId) : null;
    },
    [operationId]
  );

  return {
    loadingStates,
    startLoading,
    stopLoading,
    updateProgress,
    isLoading,
    getLoadingState,
    hasActiveOperations: LoadingStateManager.hasActiveOperations(),
  };
};

// React hook for a single loading operation
export const useSingleLoadingState = (operationId: string) => {
  const [loadingState, setLoadingState] = React.useState<LoadingState | null>(
    null
  );

  React.useEffect(() => {
    const unsubscribe = LoadingStateManager.subscribe((operations) => {
      setLoadingState(operations.get(operationId) || null);
    });

    // Set initial state
    setLoadingState(LoadingStateManager.getLoadingState(operationId));

    return unsubscribe;
  }, [operationId]);

  const startLoading = React.useCallback(
    (operation: LoadingOperation, message?: string) => {
      LoadingStateManager.startLoading(operationId, operation, message);
    },
    [operationId]
  );

  const stopLoading = React.useCallback(() => {
    LoadingStateManager.stopLoading(operationId);
  }, [operationId]);

  const updateProgress = React.useCallback(
    (progress: number, message?: string) => {
      LoadingStateManager.updateProgress(operationId, progress, message);
    },
    [operationId]
  );

  return {
    loadingState,
    isLoading: loadingState?.isLoading || false,
    progress: loadingState?.progress || 0,
    message: loadingState?.message || "",
    startLoading,
    stopLoading,
    updateProgress,
  };
};

// Utility function to wrap async operations with loading states
export const withLoadingState = async <T>(
  operationId: string,
  operation: LoadingOperation,
  asyncFn: () => Promise<T>,
  onProgress?: (progress: number, message?: string) => void
): Promise<T> => {
  LoadingStateManager.startLoading(operationId, operation);

  try {
    const result = await asyncFn();
    return result;
  } finally {
    LoadingStateManager.stopLoading(operationId);
  }
};

// Higher-order component for loading states
export const withLoadingStateHOC = (
  Component: React.ComponentType<any>,
  operationId: string
) => {
  const WrappedComponent = React.forwardRef((props: any, ref: any) => {
    const loadingState = useSingleLoadingState(operationId);

    return React.createElement(Component, {
      ...props,
      ref,
      loadingState,
    });
  });

  return WrappedComponent;
};
