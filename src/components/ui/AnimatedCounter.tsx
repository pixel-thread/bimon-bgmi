"use client";

import { useEffect, useRef, useState } from "react";

interface SlotMachineCounterProps {
    value: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    animateFromZero?: boolean; // If true, always animate from 0 on mount
}

// Create a reel with numbers for smooth scrolling (0-9 repeated for wrap-around)
const REEL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Single digit that rolls like a slot machine using CSS transitions
const SlotDigit: React.FC<{
    digit: string;
    shouldAnimate: boolean;
    animateFromZero?: boolean;
}> = ({ digit, shouldAnimate, animateFromZero = false }) => {
    const digitNum = parseInt(digit) || 0;
    // Start at 0 if animateFromZero, otherwise start at target
    const [position, setPosition] = useState(animateFromZero ? 0 : digitNum);
    const [isAnimating, setIsAnimating] = useState(false);
    const prevDigitRef = useRef(animateFromZero ? '0' : digit);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // On first render
        if (isFirstRender.current) {
            isFirstRender.current = false;

            // If animateFromZero is true, animate from 0 to the digit
            if (animateFromZero && digitNum > 0) {
                // Start animation after a small delay to ensure render is complete
                const timer = setTimeout(() => {
                    setIsAnimating(true);
                    setPosition(digitNum);
                    setTimeout(() => {
                        setIsAnimating(false);
                        prevDigitRef.current = digit;
                    }, 1200);
                }, 50);
                return () => clearTimeout(timer);
            } else {
                setPosition(digitNum);
                prevDigitRef.current = digit;
                return;
            }
        }

        if (digit === prevDigitRef.current) return;

        const targetDigit = parseInt(digit) || 0;
        const currentDigit = parseInt(prevDigitRef.current) || 0;

        if (shouldAnimate && !isNaN(targetDigit) && !isNaN(currentDigit)) {
            // Calculate direction
            let diff = targetDigit - currentDigit;
            const goingUp = diff > 0 || (diff < 0 && Math.abs(diff) > 5);

            // For smooth rolling, we animate to a position on the extended reel
            let targetPosition;
            if (goingUp) {
                // Roll upward - use second set of numbers (10-19) if needed
                targetPosition = targetDigit + (targetDigit <= currentDigit ? 10 : 0);
            } else {
                // Roll downward - start from higher position
                targetPosition = targetDigit;
                // Start position needs to be in the upper range
                setPosition(currentDigit + 10);
            }

            // Enable CSS transition
            setIsAnimating(true);

            // Small delay to ensure starting position is set before animating
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setPosition(targetPosition);
                });
            });

            // Reset to base position after animation
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setPosition(targetDigit);
                prevDigitRef.current = digit;
            }, 1200); // Match CSS transition duration

            return () => clearTimeout(timer);
        } else {
            setPosition(targetDigit);
            prevDigitRef.current = digit;
        }
    }, [digit, digitNum, shouldAnimate, animateFromZero]);

    // For non-numeric characters (comma, space)
    if (isNaN(parseInt(digit))) {
        return <span className="inline-block" style={{ width: '0.35em' }}>{digit}</span>;
    }

    const itemHeight = 1.2; // em

    return (
        <span
            className="inline-block relative overflow-hidden"
            style={{
                width: '0.55em',
                height: `${itemHeight}em`,
                verticalAlign: 'middle'
            }}
        >
            <span
                className="absolute inset-x-0 flex flex-col items-center"
                style={{
                    transform: `translateY(${-position * itemHeight}em)`,
                    transition: isAnimating
                        ? 'transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)'
                        : 'none',
                }}
            >
                {REEL.map((d, i) => (
                    <span
                        key={i}
                        className="flex items-center justify-center"
                        style={{ height: `${itemHeight}em` }}
                    >
                        {d}
                    </span>
                ))}
            </span>
        </span>
    );
};

export const SlotMachineCounter: React.FC<SlotMachineCounterProps> = ({
    value,
    className = "",
    prefix = "",
    suffix = "",
    animateFromZero = false,
}) => {
    const [displayValue, setDisplayValue] = useState(value.toLocaleString());
    const [shouldAnimate, setShouldAnimate] = useState(true);

    useEffect(() => {
        setDisplayValue(value.toLocaleString());
    }, [value]);

    const digits = displayValue.split('');

    return (
        <span className={`${className} inline-flex items-center`}>
            {prefix}
            <span className="inline-flex items-center">
                {digits.map((digit, index) => (
                    <SlotDigit
                        key={`${index}-${digits.length}`}
                        digit={digit}
                        shouldAnimate={shouldAnimate}
                        animateFromZero={animateFromZero}
                    />
                ))}
            </span>
            {suffix}
        </span>
    );
};
