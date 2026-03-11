"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@heroui/react";
import { createPortal } from "react-dom";

const KEY_MAIN = "bracket-onboarding-done";
const KEY_DISPUTE = "bracket-dispute-onboarding-done";

/* ─── Step config ───────────────────────────────────────────── */

interface SpotlightStep {
    /** data-onboarding attribute value to find the element */
    selector: string;
    title: string;
    description: string;
    /** Position tooltip relative to the element */
    position: "top" | "bottom";
}

const mainSteps: SpotlightStep[] = [
    {
        selector: "call-opponent",
        title: "📞 Call Your Opponent",
        description: "Tap this to call your opponent and set up the match time.",
        position: "top",
    },
    {
        selector: "submit-result",
        title: "📝 Submit Result",
        description: "After the match, tap here to enter the score and upload a screenshot.",
        position: "top",
    },
];

const disputeSteps: SpotlightStep[] = [
    {
        selector: "confirm-result",
        title: "✓ Confirm Result",
        description: "If the score is correct, tap Confirm to finalize.",
        position: "top",
    },
    {
        selector: "raise-dispute",
        title: "⚠️ Raise Dispute",
        description: "Disagree with the result? Tap here to submit your own score and raise a dispute.",
        position: "top",
    },
];

/* ─── Spotlight Overlay ─────────────────────────────────────── */

function SpotlightOverlay({
    steps,
    onDone,
}: {
    steps: SpotlightStep[];
    onDone: () => void;
}) {
    const [stepIdx, setStepIdx] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [mounted, setMounted] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Filter to only steps whose elements exist in the DOM
    const availableSteps = steps.filter(
        (s) => !!document.querySelector(`[data-onboarding="${s.selector}"]`)
    );

    const current = availableSteps[stepIdx];
    const isLast = stepIdx === availableSteps.length - 1;

    // Measure the target element position
    const measure = useCallback(() => {
        if (!current) return;
        const el = document.querySelector(`[data-onboarding="${current.selector}"]`);
        if (el) {
            setRect(el.getBoundingClientRect());
        }
    }, [current]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        measure();
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);
        return () => {
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        };
    }, [measure, stepIdx]);

    // If no steps have matching elements, skip onboarding
    useEffect(() => {
        if (mounted && availableSteps.length === 0) {
            onDone();
        }
    }, [mounted, availableSteps.length, onDone]);

    if (!mounted || !current || !rect) return null;

    const pad = 6;
    const cutout = {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
    };

    // Tooltip position
    const tooltipStyle: React.CSSProperties = {};
    const arrowStyle: React.CSSProperties = {};

    if (current.position === "top") {
        tooltipStyle.bottom = window.innerHeight - cutout.top + 12;
        tooltipStyle.left = Math.max(12, cutout.left + cutout.width / 2 - 140);
        // Keep within screen
        if (tooltipStyle.left + 280 > window.innerWidth) {
            tooltipStyle.left = window.innerWidth - 292;
        }
        arrowStyle.bottom = -6;
        arrowStyle.left = Math.min(
            260,
            Math.max(12, cutout.left + cutout.width / 2 - (tooltipStyle.left as number))
        );
    } else {
        tooltipStyle.top = cutout.top + cutout.height + 12;
        tooltipStyle.left = Math.max(12, cutout.left + cutout.width / 2 - 140);
        if (tooltipStyle.left + 280 > window.innerWidth) {
            tooltipStyle.left = window.innerWidth - 292;
        }
        arrowStyle.top = -6;
        arrowStyle.left = Math.min(
            260,
            Math.max(12, cutout.left + cutout.width / 2 - (tooltipStyle.left as number))
        );
    }

    const handleNext = () => {
        if (isLast) {
            onDone();
        } else {
            setStepIdx((s) => s + 1);
        }
    };

    return createPortal(
        <div ref={overlayRef} className="fixed inset-0 z-[100]" onClick={(e) => e.stopPropagation()}>
            {/* Dimmed overlay with cutout using clip-path */}
            <div
                className="absolute inset-0 bg-black/60 transition-all duration-300"
                style={{
                    clipPath: `polygon(
                        0% 0%, 100% 0%, 100% 100%, 0% 100%,
                        0% ${cutout.top}px,
                        ${cutout.left}px ${cutout.top}px,
                        ${cutout.left}px ${cutout.top + cutout.height}px,
                        ${cutout.left + cutout.width}px ${cutout.top + cutout.height}px,
                        ${cutout.left + cutout.width}px ${cutout.top}px,
                        0% ${cutout.top}px
                    )`,
                }}
            />

            {/* Highlight ring around element */}
            <div
                className="absolute rounded-xl border-2 border-primary ring-4 ring-primary/20 pointer-events-none transition-all duration-300"
                style={{
                    top: cutout.top,
                    left: cutout.left,
                    width: cutout.width,
                    height: cutout.height,
                }}
            />

            {/* Tooltip */}
            <div
                className="absolute w-[280px] transition-all duration-300"
                style={tooltipStyle}
            >
                <div className="bg-content1 border border-divider rounded-xl shadow-2xl p-4 space-y-3 relative">
                    {/* Arrow */}
                    <div
                        className="absolute w-3 h-3 bg-content1 border-b border-r border-divider"
                        style={{
                            ...arrowStyle,
                            transform: current.position === "top" ? "rotate(45deg)" : "rotate(-135deg)",
                            position: "absolute",
                        }}
                    />

                    {/* Progress */}
                    {availableSteps.length > 1 && (
                        <div className="flex items-center gap-1.5">
                            {availableSteps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all ${
                                        i === stepIdx
                                            ? "w-4 bg-primary"
                                            : i < stepIdx
                                            ? "w-1 bg-primary/40"
                                            : "w-1 bg-foreground/15"
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    <div>
                        <p className="text-sm font-bold">{current.title}</p>
                        <p className="text-[11px] text-foreground/50 mt-1 leading-relaxed">
                            {current.description}
                        </p>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            color="primary"
                            onPress={handleNext}
                            className="min-w-[72px] font-semibold text-xs h-7"
                        >
                            {isLast ? "Got it" : "Next"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ─── Exported Components ───────────────────────────────────── */

export function BracketOnboarding({ onDone }: { onDone: () => void }) {
    return (
        <SpotlightOverlay
            steps={mainSteps}
            onDone={() => {
                localStorage.setItem(KEY_MAIN, "1");
                onDone();
            }}
        />
    );
}

export function DisputeOnboarding({ onDone }: { onDone: () => void }) {
    return (
        <SpotlightOverlay
            steps={disputeSteps}
            onDone={() => {
                localStorage.setItem(KEY_DISPUTE, "1");
                onDone();
            }}
        />
    );
}

/* ─── Hooks ─────────────────────────────────────────────────── */

export function useBracketOnboarding(playerId?: string) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!playerId) return;
        if (!localStorage.getItem(KEY_MAIN)) setShow(true);
    }, [playerId]);

    return { showOnboarding: show, dismissOnboarding: () => setShow(false) };
}

export function useDisputeOnboarding(playerId?: string, hasSubmittedMatch?: boolean) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!playerId || !hasSubmittedMatch) return;
        if (!localStorage.getItem(KEY_MAIN)) return;
        if (!localStorage.getItem(KEY_DISPUTE)) setShow(true);
    }, [playerId, hasSubmittedMatch]);

    return { showDisputeOnboarding: show, dismissDisputeOnboarding: () => setShow(false) };
}
