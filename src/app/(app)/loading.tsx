"use client";

import { Spinner } from "@heroui/react";

/**
 * Loading state for the app route group.
 */
export default function AppLoading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Spinner size="lg" />
        </div>
    );
}
