import React from "react";
import { Button } from "@/src/components/ui/button";
import { ButtonProps } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText = "Loading...",
  disabled,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} className={cn(className)} {...props}>
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
