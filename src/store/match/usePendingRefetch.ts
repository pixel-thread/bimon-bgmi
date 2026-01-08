import { create } from "zustand";

interface PendingRefetchState {
    isPendingRefetch: boolean;
    setPendingRefetch: (pending: boolean) => void;
}

/**
 * Store to track when a refetch is pending (e.g., after bulk edit save)
 * Used to highlight the refetch button in the UI
 */
export const usePendingRefetch = create<PendingRefetchState>((set) => ({
    isPendingRefetch: false,
    setPendingRefetch: (pending) => set({ isPendingRefetch: pending }),
}));
