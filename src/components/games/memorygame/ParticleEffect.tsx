"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

interface ParticleEffectProps {
    trigger: number; // Increment this to trigger a burst
    x?: number;
    y?: number;
    colors?: string[];
}

const DEFAULT_COLORS = ["#fbbf24", "#f59e0b", "#d97706", "#fcd34d", "#fef3c7"];

export function ParticleEffect({ trigger, x = 0, y = 0, colors = DEFAULT_COLORS }: ParticleEffectProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>(0);

    const createParticle = useCallback((centerX: number, centerY: number): Particle => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        return {
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            size: Math.random() * 6 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
    }, [colors]);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

        particlesRef.current.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravity
            p.life -= 0.02;

            // Only draw if life is positive
            if (p.life > 0) {
                const radius = Math.max(0.1, p.size * p.life);
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.globalAlpha = 1;

        if (particlesRef.current.length > 0) {
            animationRef.current = requestAnimationFrame(animate);
        }
    }, []);

    // Trigger particle burst
    useEffect(() => {
        if (trigger === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create particles
        const centerX = x || canvas.width / 2;
        const centerY = y || canvas.height / 2;

        for (let i = 0; i < 20; i++) {
            particlesRef.current.push(createParticle(centerX, centerY));
        }

        // Start animation if not running
        if (!animationRef.current) {
            animate();
        }
    }, [trigger, x, y, createParticle, animate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-50"
            width={400}
            height={400}
            aria-hidden="true"
        />
    );
}

// Simple sparkle component for inline use
export function Sparkle({ className = "" }: { className?: string }) {
    return (
        <span className={`inline-block animate-ping ${className}`}>
            ✨
        </span>
    );
}
