"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Phone, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

const KEY_MAIN = "bracket-onboarding-done";
const KEY_DISPUTE = "bracket-dispute-onboarding-done";

interface OnboardingStep {
    icon: React.ReactNode;
    title: string;
    description: string;
    preview: React.ReactNode;
}

/* ─── Step Definitions ──────────────────────────────────────── */

const mainSteps: OnboardingStep[] = [
    {
        icon: <Phone className="h-5 w-5 text-success" />,
        title: "Call Your Opponent",
        description:
            "Tap the phone icon next to your opponent's name to call them and set up the match.",
        preview: (
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 opacity-35">
                    <div className="h-6 w-6 rounded-full bg-primary/20" />
                    <span className="text-xs font-medium text-primary">You</span>
                </div>
                <div className="flex items-center gap-2 px-2 opacity-35">
                    <div className="flex-1 h-px bg-foreground/10" />
                    <span className="text-[10px] text-foreground/20">VS</span>
                    <div className="flex-1 h-px bg-foreground/10" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-100 border-2 border-success/50 ring-2 ring-success/20">
                    <div className="h-6 w-6 rounded-full bg-foreground/15" />
                    <span className="text-xs font-medium flex-1">Opponent</span>
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-success/20 border border-success/30 animate-pulse">
                        <Phone className="h-3.5 w-3.5 text-success" />
                    </div>
                </div>
            </div>
        ),
    },
    {
        icon: <FileText className="h-5 w-5 text-primary" />,
        title: "Submit Your Result",
        description:
            "After the match, tap \"Submit Result\" to enter the score. Upload a screenshot as proof.",
        preview: (
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-100/50 opacity-35">
                    <div className="h-6 w-6 rounded-full bg-foreground/10" />
                    <span className="text-xs">You</span>
                </div>
                <div className="flex items-center gap-2 px-2 opacity-35">
                    <div className="flex-1 h-px bg-foreground/10" />
                    <span className="text-[10px] text-foreground/20">VS</span>
                    <div className="flex-1 h-px bg-foreground/10" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-100/50 opacity-35">
                    <div className="h-6 w-6 rounded-full bg-foreground/10" />
                    <span className="text-xs">Opponent</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <div className="h-5 w-16 rounded-full bg-foreground/8 opacity-35" />
                    <span className="text-[11px] font-semibold text-primary border-2 border-primary/40 ring-2 ring-primary/20 rounded-lg px-3 py-1.5 bg-primary/5 animate-pulse">
                        Submit Result →
                    </span>
                </div>
            </div>
        ),
    },
];

const disputeSteps: OnboardingStep[] = [
    {
        icon: <CheckCircle2 className="h-5 w-5 text-success" />,
        title: "Confirm or Dispute",
        description:
            "Your opponent submitted the result. Confirm if correct, or raise a dispute if you disagree.",
        preview: (
            <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 opacity-35">
                    <div className="h-5 w-20 rounded-full bg-warning/20" />
                    <span className="text-[10px] text-foreground/30">Opponent submitted a result</span>
                </div>
                <div className="flex items-center gap-3 justify-center">
                    <div className="flex items-center gap-1.5 border-2 border-success/40 ring-2 ring-success/20 rounded-lg px-4 py-2.5 bg-success/5 animate-pulse">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <span className="text-[11px] font-semibold text-success">Confirm</span>
                    </div>
                    <span className="text-[10px] text-foreground/25">or</span>
                    <div className="flex items-center gap-1.5 border-2 border-warning/40 ring-2 ring-warning/20 rounded-lg px-4 py-2.5 bg-warning/5 animate-pulse">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        <span className="text-[11px] font-semibold text-warning">Dispute</span>
                    </div>
                </div>
            </div>
        ),
    },
];

/* ─── Onboarding Overlay ────────────────────────────────────── */

function OnboardingOverlay({
    steps,
    onDone,
}: {
    steps: OnboardingStep[];
    onDone: () => void;
}) {
    const [step, setStep] = useState(0);
    const isLast = step === steps.length - 1;
    const current = steps[step];

    const handleNext = () => {
        if (isLast) {
            onDone();
        } else {
            setStep((s) => s + 1);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-content1 border border-divider rounded-2xl overflow-hidden shadow-2xl">
                {/* Progress dots (only when multi-step) */}
                {steps.length > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-5 pb-1">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === step
                                        ? "w-6 bg-primary"
                                        : i < step
                                        ? "w-1.5 bg-primary/40"
                                        : "w-1.5 bg-foreground/15"
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className={`px-6 ${steps.length > 1 ? "py-4" : "py-6"} space-y-5`}>
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-foreground/5 shrink-0 mt-0.5">
                            {current.icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold">{current.title}</h3>
                            <p className="text-[11px] text-foreground/50 mt-0.5 leading-relaxed">
                                {current.description}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-divider bg-background p-3">
                        {current.preview}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex items-center justify-between">
                    <span className="text-[10px] text-foreground/30 font-medium">
                        {steps.length > 1 ? `${step + 1} of ${steps.length}` : ""}
                    </span>
                    <Button
                        size="sm"
                        color="primary"
                        onPress={handleNext}
                        className="min-w-[80px] font-semibold"
                    >
                        {isLast ? "Got it" : "Next"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ─── Exported Components ───────────────────────────────────── */

/** Main onboarding — Call + Submit (shown once on first bracket visit for players) */
export function BracketOnboarding({ onDone }: { onDone: () => void }) {
    return (
        <OnboardingOverlay
            steps={mainSteps}
            onDone={() => {
                localStorage.setItem(KEY_MAIN, "1");
                onDone();
            }}
        />
    );
}

/** Dispute onboarding — Confirm/Dispute (shown once when player first sees SUBMITTED state) */
export function DisputeOnboarding({ onDone }: { onDone: () => void }) {
    return (
        <OnboardingOverlay
            steps={disputeSteps}
            onDone={() => {
                localStorage.setItem(KEY_DISPUTE, "1");
                onDone();
            }}
        />
    );
}

/* ─── Hooks ─────────────────────────────────────────────────── */

/** Show main onboarding once for players */
export function useBracketOnboarding(playerId?: string) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!playerId) return;
        if (!localStorage.getItem(KEY_MAIN)) setShow(true);
    }, [playerId]);

    return { showOnboarding: show, dismissOnboarding: () => setShow(false) };
}

/** Show dispute onboarding once when player has a SUBMITTED match to respond to */
export function useDisputeOnboarding(playerId?: string, hasSubmittedMatch?: boolean) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!playerId || !hasSubmittedMatch) return;
        // Don't show if main onboarding hasn't been seen yet
        if (!localStorage.getItem(KEY_MAIN)) return;
        if (!localStorage.getItem(KEY_DISPUTE)) setShow(true);
    }, [playerId, hasSubmittedMatch]);

    return { showDisputeOnboarding: show, dismissDisputeOnboarding: () => setShow(false) };
}
