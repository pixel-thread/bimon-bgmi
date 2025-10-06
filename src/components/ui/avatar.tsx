"use client";

import React from "react";
import { User } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

const iconSizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-6 h-6",
};

export function Avatar({
  src,
  alt = "Avatar",
  size = "md",
  className,
  fallbackClassName,
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // Reset error state when src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const shouldShowImage = src && !imageError;

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {shouldShowImage ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <User
          className={cn("text-white", iconSizeClasses[size], fallbackClassName)}
        />
      )}
    </div>
  );
}
