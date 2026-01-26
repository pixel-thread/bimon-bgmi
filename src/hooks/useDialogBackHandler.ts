"use client";

import { useEffect, useCallback, useRef } from "react";

/**
 * Hook to handle browser back button for dialogs/modals.
 * When the dialog is open and the user presses the system back button,
 * this closes the dialog instead of navigating away from the page.
 * 
 * @param isOpen - Whether the dialog is currently open
 * @param setIsOpen - Function to set the open state
 * @param dialogId - Unique identifier for this dialog (used to track history state)
 */
export function useDialogBackHandler(
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    dialogId: string
) {
    const isClosingRef = useRef(false);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Store setIsOpen in a ref to avoid stale closures
    const setIsOpenRef = useRef(setIsOpen);
    setIsOpenRef.current = setIsOpen;

    useEffect(() => {
        // Always reset closing ref when isOpen changes to false
        if (!isOpen) {
            isClosingRef.current = false;
            // Clear any pending timeout
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }
            return;
        }

        const handlePopState = (event: PopStateEvent) => {
            // Clear any pending timeout since popstate fired
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }

            // Prevent closing twice
            if (isClosingRef.current) {
                // Reset the flag and call setIsOpen to ensure dialog closes
                isClosingRef.current = false;
                setIsOpenRef.current(false);
                return;
            }

            // If we're in the dialog state, close the dialog
            if (isOpen) {
                event.preventDefault();
                isClosingRef.current = true;
                setIsOpenRef.current(false);
                // Reset closing ref after a short delay to handle edge cases
                setTimeout(() => {
                    isClosingRef.current = false;
                }, 100);
            }
        };

        // Push state when dialog opens
        window.history.pushState({ dialogOpen: dialogId }, '');
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            // Clear timeout on cleanup
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }
        };
    }, [isOpen, dialogId]);

    // Wrapper for onOpenChange that handles history cleanup
    const handleOpenChange = useCallback((open: boolean) => {
        // If closing dialog manually (not via back button), go back in history to clean up
        if (!open && isOpen && !isClosingRef.current) {
            // Check if we pushed the state - only go back if the current state is our dialog state
            if (window.history.state?.dialogOpen === dialogId) {
                isClosingRef.current = true;
                window.history.back();

                // Set a timeout fallback - if popstate doesn't fire within 200ms, force close
                // This handles edge cases where popstate event might not fire (e.g., during re-renders)
                closeTimeoutRef.current = setTimeout(() => {
                    if (isClosingRef.current) {
                        isClosingRef.current = false;
                        setIsOpenRef.current(false);
                    }
                }, 200);

                return; // The popstate handler will set isOpen to false
            }
        }

        setIsOpenRef.current(open);
    }, [isOpen, dialogId]);

    return handleOpenChange;
}
