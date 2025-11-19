"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ButtonHTMLAttributes } from "react";

interface AnimatedButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<"button">>,
    HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedButton = ({
  children,
  className = "",
  ...props
}: AnimatedButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};