
import React, { useRef, useEffect, useState } from 'react';

interface ButtonWithAnimatedBGProps {
    loading: boolean;
}

export default function ButtonWithAnimatedBG({ loading }: ButtonWithAnimatedBGProps) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [pos, setPos] = useState({ x: 50, y: 50 });
    const [hovered, setHovered] = useState(false);
    const [shine, setShine] = useState(false);

    // Animate idle background pulse
    useEffect(() => {
        if (hovered) return;
        let frame: number;
        let t = 0;
        const animate = () => {
            t += 0.02;
            setPos({
                x: 50 + Math.sin(t) * 10,
                y: 50 + Math.cos(t * 1.2) * 10,
            });
            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, [hovered]);

    // Mouse move for interactive background
    useEffect(() => {
        const btn = btnRef.current;
        if (!btn) return;
        const handleMove = (e: MouseEvent) => {
            const rect = btn.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setPos({ x, y });
        };
        if (hovered) {
            btn.addEventListener('mousemove', handleMove);
        }
        return () => {
            btn.removeEventListener('mousemove', handleMove);
        };
    }, [hovered]);

    // Shine sweep effect on hover
    useEffect(() => {
        if (!hovered) return;
        setShine(true);
        const timeout = setTimeout(() => setShine(false), 700);
        return () => clearTimeout(timeout);
    }, [hovered]);

    return (
        <button
            ref={btnRef}
            type="submit"
            className="w-full relative overflow-hidden text-white py-3 rounded-xl font-semibold shadow-xl transition disabled:opacity-60 bg-neutral-900 border-2 border-transparent focus:outline-none group"
            style={{
                background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(60,65,80,0.95) 0%, #18181b 80%)`,
                transition: hovered ? 'background 0.2s cubic-bezier(.4,2,.6,1)' : 'background 1.2s cubic-bezier(.4,2,.6,1)',
                boxShadow: hovered
                    ? '0 0 32px 0 rgba(80,120,255,0.18), 0 2px 8px 0 rgba(0,0,0,0.10)'
                    : '0 0 16px 0 rgba(80,120,255,0.10), 0 2px 8px 0 rgba(0,0,0,0.08)'
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={loading}
        >
            {/* Animated border */}
            <span
                className="pointer-events-none absolute inset-0 rounded-xl z-0 border-2 border-transparent group-hover:border-blue-400 group-focus:border-blue-400"
                style={{
                    background:
                        'conic-gradient(from 90deg at 50% 50%, #60a5fa 0deg, #818cf8 90deg, #a78bfa 180deg, #818cf8 270deg, #60a5fa 360deg)',
                    opacity: hovered ? 0.35 : 0.18,
                    filter: hovered ? 'blur(0.5px)' : 'blur(1.5px)',
                    transition: 'opacity 0.3s, filter 0.5s',
                }}
                aria-hidden
            />
            {/* Shine sweep */}
            {shine && (
                <span
                    className="pointer-events-none absolute left-[-40%] top-0 w-2/3 h-full z-10"
                    style={{
                        background:
                            'linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.0) 100%)',
                        filter: 'blur(2px)',
                        animation: 'shineSweep 0.7s cubic-bezier(.4,2,.6,1) forwards',
                    }}
                />
            )}
            <span className="relative z-10">
                {loading ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        A entrar...
                    </span>
                ) : 'Entrar'}
            </span>
            <style jsx global>{`
                @keyframes shineSweep {
                    0% { left: -40%; opacity: 0.1; }
                    40% { opacity: 0.7; }
                    100% { left: 110%; opacity: 0; }
                }
            `}</style>
        </button>
    );
}
