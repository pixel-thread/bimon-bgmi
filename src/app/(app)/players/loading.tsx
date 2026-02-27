"use client";

import { Spinner } from "@heroui/react";

/**
 * Loading state for the /players page.
 */
export default function PlayersLoading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Spinner size="lg" />
        </div>
    );
}
