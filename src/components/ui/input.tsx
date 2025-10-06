import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  paddingX?: string; // Custom prop to override horizontal padding
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, paddingX, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background  text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          paddingX && paddingX, // Apply custom paddingX if provided
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
