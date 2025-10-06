"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { FiArrowLeft } from "react-icons/fi";

interface BackButtonProps {
  className?: string;
  onClick?: () => void;
}

export function BackButton({ className = "", onClick }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={`flex items-center gap-2 ${className}`}
      aria-label="Go back"
    >
      <FiArrowLeft className="h-4 w-4" />
      <span>Back</span>
    </Button>
  );
}
