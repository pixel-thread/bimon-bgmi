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

    useEffect(() => {
        if (!isOpen) {
            isClosingRef.current = false;
            return;
        }

        const handlePopState = (event: PopStateEvent) => {
            // Prevent closing twice
            if (isClosingRef.current) return;

            // If we're in the dialog state, close the dialog
            if (isOpen) {
                event.preventDefault();
                isClosingRef.current = true;
                setIsOpen(false);
            }
        };

        // Push state when dialog opens
        window.history.pushState({ dialogOpen: dialogId }, '');
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isOpen, setIsOpen, dialogId]);

    // Wrapper for onOpenChange that handles history cleanup
    const handleOpenChange = useCallback((open: boolean) => {
        // If closing dialog manually (not via back button), go back in history to clean up
        if (!open && isOpen && !isClosingRef.current) {
            // Check if we pushed the state - only go back if the current state is our dialog state
            if (window.history.state?.dialogOpen === dialogId) {
                isClosingRef.current = true;
                window.history.back();
                return; // The popstate handler will set isOpen to false
            }
        }

        setIsOpen(open);
    }, [isOpen, setIsOpen, dialogId]);

    return handleOpenChange;
}
