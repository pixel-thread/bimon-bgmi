"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { usePushNotifications } from "@/src/hooks/push/usePushNotifications";
import { toast } from "sonner";

export function PushNotificationToggle() {
    const { isSupported, isSubscribed, isLoading, permission, toggle } =
        usePushNotifications();

    // Don't render if not supported
    if (!isSupported) {
        return null;
    }

    const handleToggle = async () => {
        const success = await toggle();
        if (success) {
            toast.success(
                isSubscribed
                    ? "Push notifications disabled"
                    : "Push notifications enabled! You'll be notified about new polls."
            );
        } else if (permission === "denied") {
            toast.error(
                "Permission denied. Please enable notifications in your browser settings."
            );
        } else {
            toast.error("Failed to update notification settings");
        }
    };

    return (
        <Button
            variant={isSubscribed ? "default" : "outline"}
            size="sm"
            onClick={handleToggle}
            disabled={isLoading}
            className="gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
                <Bell className="h-4 w-4" />
            ) : (
                <BellOff className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
                {isLoading
                    ? "Loading..."
                    : isSubscribed
                        ? "Notifications On"
                        : "Enable Notifications"}
            </span>
        </Button>
    );
}
