"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/src/lib/utils";

interface Particle {
  x: number;
  y: number;
  r: number;
  color: string;
}

interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  suggestions?: string[];
}

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  suggestions = [],
}: PlaceholdersAndVanishInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newDataRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const startPlaceholderAnimation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  }, [placeholders.length]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      startPlaceholderAnimation();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [startPlaceholderAnimation]);

  useEffect(() => {
    startPlaceholderAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startPlaceholderAnimation, handleVisibilityChange]);

  const draw = useCallback(() => {
    const input = inputRef.current;
    const canvas = canvasRef.current;
    if (!input || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reduced canvas size for better performance
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2
    const width = 400; // Reduced from 800
    const height = 200; // Reduced from 800
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);
    const styles = getComputedStyle(input);
    const fontSize = parseFloat(styles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 1.5}px ${styles.fontFamily}`; // Reduced font scaling
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, width * dpr, height * dpr);
    const pixelData = imageData.data;
    const newData: Particle[] = [];

    // More aggressive optimization - skip more pixels
    for (let y = 0; y < height; y += 4) {
      // Skip every 4th row
      const rowIndex = 4 * y * width * dpr;
      for (let x = 0; x < width; x += 4) {
        // Skip every 4th column
        const pixelIndex = rowIndex + 4 * x * dpr;
        if (
          pixelData[pixelIndex] !== 0 &&
          pixelData[pixelIndex + 1] !== 0 &&
          pixelData[pixelIndex + 2] !== 0
        ) {
          newData.push({
            x,
            y,
            r: 2, // Slightly larger particles to compensate for fewer of them
            color: `rgba(${pixelData[pixelIndex]}, ${
              pixelData[pixelIndex + 1]
            }, ${pixelData[pixelIndex + 2]}, ${
              pixelData[pixelIndex + 3] / 255
            })`,
          });
        }
      }
    }

    newDataRef.current = newData;
  }, [value]);

  useEffect(() => {
    draw();
  }, [draw]);

  const animate = useCallback((start: number) => {
    const animateFrame = (pos: number = start) => {
      animationFrameRef.current = requestAnimationFrame(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        const newArr: Particle[] = [];
        for (const particle of newDataRef.current) {
          if (particle.x < pos) {
            newArr.push(particle);
            continue;
          }
          if (particle.r <= 0) continue;

          particle.x += Math.random() > 0.5 ? 0.8 : -0.8; // Slower movement
          particle.y += Math.random() > 0.5 ? 0.8 : -0.8;
          particle.r -= 0.015 * Math.random(); // Slower vanishing
          newArr.push(particle);
        }
        newDataRef.current = newArr;

        ctx.clearRect(pos, 0, 800, 800);
        for (const { x, y, r, color } of newArr) {
          if (x > pos) {
            ctx.beginPath();
            ctx.rect(x, y, r, r);
            ctx.fillStyle = color;
            ctx.fill();
          }
        }

        if (newArr.length > 0) {
          animateFrame(pos - 3); // Slower progression
        } else {
          setValue("");
          setAnimating(false);
          animationFrameRef.current = null;
        }
      });
    };
    animateFrame();
  }, []);

  const vanishAndSubmit = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    draw();

    const maxX = newDataRef.current.reduce((max, { x }) => Math.max(max, x), 0);
    animate(maxX);
  }, [animating, draw, animate]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      vanishAndSubmit();
      onSubmit?.(e);
    },
    [vanishAndSubmit, onSubmit]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (animating) return;
      const inputValue = e.target.value;
      setValue(inputValue);
      onChange?.(e);

      if (inputValue.trim() && suggestions.length > 0) {
        const filtered = suggestions.filter((s) =>
          s.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedSuggestionIndex(-1);
      } else {
        setShowSuggestions(false);
        setFilteredSuggestions([]);
      }
    },
    [animating, onChange, suggestions]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (animating) return;

      if (e.key === "Enter") {
        if (showSuggestions && selectedSuggestionIndex >= 0) {
          const suggestion = filteredSuggestions[selectedSuggestionIndex];
          setValue(suggestion);
          setShowSuggestions(false);
          const syntheticEvent = {
            target: { value: suggestion },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange?.(syntheticEvent);
        } else {
          vanishAndSubmit();
        }
      } else if (e.key === "ArrowDown" && showSuggestions) {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          Math.min(prev + 1, filteredSuggestions.length - 1)
        );
      } else if (e.key === "ArrowUp" && showSuggestions) {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [
      animating,
      showSuggestions,
      selectedSuggestionIndex,
      filteredSuggestions,
      vanishAndSubmit,
      onChange,
    ]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setValue(suggestion);
      setShowSuggestions(false);
      const syntheticEvent = {
        target: { value: suggestion },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    },
    [onChange]
  );

  const suggestionsWithMaybe = useMemo(() => {
    return suggestions.map((s) => `Maybe ${s}?`);
  }, [suggestions]);

  return (
    <div className="w-full relative max-w-xl mx-auto">
      <form
        className={cn(
          "w-full relative bg-white dark:bg-zinc-800 h-12 rounded-full overflow-hidden shadow-[0_2px_3px_-1px_rgba(0,0,0,0.1),_0_1px_0_0_rgba(25,28,33,0.02),_0_0_0_1px_rgba(25,28,33,0.08)] transition duration-200",
          value && "bg-gray-50 dark:bg-zinc-700"
        )}
        onSubmit={handleSubmit}
      >
        <canvas
          className={cn(
            "absolute pointer-events-none text-base transform scale-50 top-[20%] left-2 sm:left-8 origin-top-left filter invert dark:invert-0 pr-20 transition-opacity duration-300",
            animating ? "opacity-100" : "opacity-0"
          )}
          ref={canvasRef}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() =>
            value.trim() &&
            filteredSuggestions.length > 0 &&
            setShowSuggestions(true)
          }
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          type="text"
          className={cn(
            "w-full relative text-sm sm:text-base z-50 border-none bg-transparent h-full rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 pl-4 sm:pl-10 pr-4",
            animating ? "text-transparent" : "text-black dark:text-white",
            "transition-colors duration-200"
          )}
          aria-label="Search input"
          autoComplete="off"
        />
        <div
          className="absolute inset-0 flex items-center rounded-full pointer-events-none"
          aria-hidden="true"
        >
          <AnimatePresence mode="wait">
            {!value && (
              <motion.p
                key={`placeholder-${currentPlaceholder}`}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="text-neutral-500 dark:text-zinc-500 text-sm sm:text-base font-normal pl-4 sm:pl-12 text-left w-[calc(100%-1rem)] truncate"
              >
                {placeholders[currentPlaceholder]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </form>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
          role="listbox"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
              className={cn(
                "px-4 py-2 cursor-pointer text-sm border-b border-gray-100 dark:border-zinc-700 last:border-b-0 transition-colors duration-100",
                index === selectedSuggestionIndex
                  ? "bg-gray-100 dark:bg-zinc-700"
                  : "hover:bg-gray-50 dark:hover:bg-zinc-600"
              )}
              role="option"
              aria-selected={index === selectedSuggestionIndex}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
