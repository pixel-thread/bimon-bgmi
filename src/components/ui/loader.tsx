"use client";
import { motion, Easing } from "motion/react";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Loading context to track when any loader is active and battery state
type LoadingContextType = {
  loaderCount: number;
  registerLoader: () => void;
  unregisterLoader: () => void;
  isBatteryShowing: boolean;
  setIsBatteryShowing: (v: boolean) => void;
};
const LoadingContext = createContext<LoadingContextType | null>(null);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [loaderCount, setLoaderCount] = useState(0);
  const [isBatteryShowing, setIsBatteryShowing] = useState(false);

  const registerLoader = useCallback(() => {
    setLoaderCount((c) => c + 1);
  }, []);

  const unregisterLoader = useCallback(() => {
    setLoaderCount((c) => Math.max(0, c - 1));
  }, []);

  return (
    <LoadingContext.Provider value={{ loaderCount, registerLoader, unregisterLoader, isBatteryShowing, setIsBatteryShowing }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => useContext(LoadingContext);

export const LoaderOne = () => {
  const transition = (x: number) => {
    return {
      duration: 1,
      repeat: Infinity,
      repeatType: "loop" as const,
      delay: x * 0.2,
      ease: [0.4, 0, 0.6, 1] as Easing,
    };
  };
  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{
          y: 0,
        }}
        animate={{
          y: [0, 10, 0],
        }}
        transition={transition(0)}
        className="h-4 w-4 rounded-full border border-neutral-300 bg-gradient-to-b from-neutral-400 to-neutral-300"
      />
      <motion.div
        initial={{
          y: 0,
        }}
        animate={{
          y: [0, 10, 0],
        }}
        transition={transition(1)}
        className="h-4 w-4 rounded-full border border-neutral-300 bg-gradient-to-b from-neutral-400 to-neutral-300"
      />
      <motion.div
        initial={{
          y: 0,
        }}
        animate={{
          y: [0, 10, 0],
        }}
        transition={transition(2)}
        className="h-4 w-4 rounded-full border border-neutral-300 bg-gradient-to-b from-neutral-400 to-neutral-300"
      />
    </div>
  );
};

export const LoaderTwo = () => {
  const transition = (x: number) => {
    return {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop" as const,
      delay: x * 0.2,
      ease: [0.4, 0, 0.6, 1] as Easing,
    };
  };
  return (
    <div className="flex items-center">
      <motion.div
        transition={transition(0)}
        initial={{
          x: 0,
        }}
        animate={{
          x: [0, 20, 0],
        }}
        className="h-4 w-4 rounded-full bg-neutral-200 shadow-md dark:bg-neutral-500"
      />
      <motion.div
        initial={{
          x: 0,
        }}
        animate={{
          x: [0, 20, 0],
        }}
        transition={transition(0.4)}
        className="h-4 w-4 -translate-x-2 rounded-full bg-neutral-200 shadow-md dark:bg-neutral-500"
      />
      <motion.div
        initial={{
          x: 0,
        }}
        animate={{
          x: [0, 20, 0],
        }}
        transition={transition(0.8)}
        className="h-4 w-4 -translate-x-4 rounded-full bg-neutral-200 shadow-md dark:bg-neutral-500"
      />
    </div>
  );
};

export const LoaderThree = () => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-20 w-20 stroke-neutral-500 [--fill-final:var(--color-yellow-300)] [--fill-initial:var(--color-neutral-50)] dark:stroke-neutral-100 dark:[--fill-final:var(--color-yellow-500)] dark:[--fill-initial:var(--color-neutral-800)]"
    >
      <motion.path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <motion.path
        initial={{ pathLength: 0, fill: "var(--fill-initial)" }}
        animate={{ pathLength: 1, fill: "var(--fill-final)" }}
        transition={{
          duration: 2,
          ease: [0.4, 0, 0.6, 1] as Easing,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
      />
    </motion.svg>
  );
};

// Battery prank component - separate from loader to persist through transitions
export const BatteryPrank = () => {
  const loadingContext = useLoadingContext();
  const [isMounted, setIsMounted] = useState(false);
  const hasHadLoader = React.useRef(false);
  const [showBattery, setShowBattery] = useState(false);

  // Generate random check only on client (once per session)
  const [shouldShow] = useState(() => Math.random() < 0.033); // 1 in 30 chance

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loaderCount = loadingContext?.loaderCount ?? 0;
  if (loaderCount > 0) {
    hasHadLoader.current = true;
  }

  const isLoading = !isMounted || !hasHadLoader.current || loaderCount > 0;
  const batteryStartTime = React.useRef<number | null>(null);

  // Show battery after a delay when loading starts (only if prank is triggered)
  useEffect(() => {
    // Early exit if battery prank is not triggered
    if (!shouldShow) return;

    if (isLoading && isMounted) {
      const timer = setTimeout(() => {
        setShowBattery(true);
        batteryStartTime.current = Date.now();
        loadingContext?.setIsBatteryShowing(true);
      }, 200); // 0.2 second delay for glitch to play first
      return () => clearTimeout(timer);
    } else if (showBattery && batteryStartTime.current) {
      // Keep battery visible for minimum 2 seconds
      const elapsed = Date.now() - batteryStartTime.current;
      const minDisplayTime = 2000; // 2 seconds minimum
      const remaining = Math.max(0, minDisplayTime - elapsed);

      const hideTimer = setTimeout(() => {
        setShowBattery(false);
        loadingContext?.setIsBatteryShowing(false);
        batteryStartTime.current = null;
      }, remaining);
      return () => clearTimeout(hideTimer);
    }
  }, [isLoading, isMounted, loadingContext, showBattery]);

  if (!shouldShow || !showBattery) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden items-center justify-center bg-black dark:flex">
      <motion.svg
        width="280"
        height="120"
        viewBox="0 0 56 24"
        fill="none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <rect x="3" y="4" width="44" height="16" rx="3" fill="none" stroke="#333333" strokeWidth="0.5" />
        <rect x="48" y="8" width="3" height="8" rx="1" fill="#666666" />
        <motion.rect
          x="5"
          y="6"
          height="12"
          rx="2"
          fill="#ef4444"
          animate={{ width: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
};

// Separate component for hair prank - uses loading context to know when to show
export const HairPrank = () => {
  const loadingContext = useLoadingContext();
  const [isMounted, setIsMounted] = useState(false);
  const hasHadLoader = React.useRef(false);

  // Generate random values only on client (once per session)
  const [shouldShow] = useState(() => Math.random() < 0.1); // 1 in 10 chance
  const [hairStyle] = useState(() => ({
    top: `${Math.random() * 80 + 10}vh`,
    left: `${Math.random() * 80 + 10}vw`,
    rotate: `${Math.random() * 60 - 30}deg`,
  }));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track if we've ever had a loader
  const loaderCount = loadingContext?.loaderCount ?? 0;
  if (loaderCount > 0) {
    hasHadLoader.current = true;
  }

  const isLoading = !isMounted || !hasHadLoader.current || loaderCount > 0;

  // Don't render on server or if prank not triggered
  if (!isMounted || !shouldShow || !isLoading) return null;

  return (
    <svg
      className="pointer-events-none fixed z-[9999] dark:hidden"
      style={{
        top: hairStyle.top,
        left: hairStyle.left,
        transform: `rotate(${hairStyle.rotate})`,
      }}
      width="400"
      height="60"
      viewBox="0 0 400 60"
      fill="none"
    >
      <path
        d="M5 25 Q40 10, 75 28 Q110 45, 150 30 Q190 15, 230 32 Q270 48, 310 28 Q350 12, 395 25"
        stroke="rgba(30, 20, 15, 0.85)"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M5 25 Q40 10, 75 28 Q110 45, 150 30 Q190 15, 230 32 Q270 48, 310 28 Q350 12, 395 25"
        stroke="rgba(60, 45, 35, 0.25)"
        strokeWidth="0.3"
        strokeLinecap="round"
        fill="none"
        style={{ transform: "translateY(0.5px)" }}
      />
    </svg>
  );
};

export const LoaderFour = ({
  text = "Loading...",
}: {
  text?: string;
}) => {
  // Register/unregister with loading context
  const loadingContext = useLoadingContext();
  const isBatteryShowing = loadingContext?.isBatteryShowing ?? false;

  useEffect(() => {
    if (loadingContext) {
      loadingContext.registerLoader();
      return () => loadingContext.unregisterLoader();
    }
  }, [loadingContext]);

  return (
    <>
      {/* Animated loader text - hidden on dark theme when battery is showing */}
      <div className={`relative font-bold text-black [perspective:1000px] dark:text-white ${isBatteryShowing ? 'dark:hidden' : ''}`}>
        <motion.span
          animate={{
            skewX: [0, -40, 0],
            scaleX: [1, 2, 1],
          }}
          transition={{
            duration: 0.05,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 2,
            ease: "linear",
            times: [0, 0.2, 0.5, 0.8, 1],
          }}
          className="relative z-20 inline-block"
        >
          {text}
        </motion.span>
        <motion.span
          className="absolute inset-0 text-[#00e571]/50 blur-[0.5px] dark:text-[#00e571]"
          animate={{
            x: [-2, 4, -3, 1.5, -2],
            y: [-2, 4, -3, 1.5, -2],
            opacity: [0.3, 0.9, 0.4, 0.8, 0.3],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
            times: [0, 0.2, 0.5, 0.8, 1],
          }}
        >
          {text}
        </motion.span>
        <motion.span
          className="absolute inset-0 text-[#8b00ff]/50 dark:text-[#8b00ff]"
          animate={{
            x: [0, 1, -1.5, 1.5, -1, 0],
            y: [0, -1, 1.5, -0.5, 0],
            opacity: [0.4, 0.8, 0.3, 0.9, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
            times: [0, 0.3, 0.6, 0.8, 1],
          }}
        >
          {text}
        </motion.span>
      </div>
    </>
  );
};

export const LoaderFive = ({ text }: { text: string }) => {
  return (
    <div className="font-sans font-bold [--shadow-color:var(--color-neutral-500)] dark:[--shadow-color:var(--color-neutral-100)]">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.1, 1],
            textShadow: [
              "0 0 0 var(--shadow-color)",
              "0 0 1px var(--shadow-color)",
              "0 0 0 var(--shadow-color)",
            ],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "loop",
            delay: i * 0.05,
            ease: [0.4, 0, 0.6, 1] as Easing,
            repeatDelay: 2,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  );
};
