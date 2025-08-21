import { useRef, useState } from 'react';

interface AnimatedInputProps {
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    color?: string; // e.g. 'pink' or 'blue'
    required?: boolean;
}

export default function AnimatedInput({
    type,
    placeholder,
    value,
    onChange,
    color = 'pink',
    required = false,
}: AnimatedInputProps) {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Color palette
    const colorMap: Record<string, string> = {
        pink: '#ec4899',
        blue: '#3b82f6',
        purple: '#a78bfa',
        gold: '#fbbf24',
    };
    const mainColor = colorMap[color] || colorMap.pink;

    return (
        <div className="relative group my-2 w-full">
            <input
                ref={inputRef}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full p-3 bg-white/60 backdrop-blur-lg rounded-xl border-2 border-transparent shadow-xl transition placeholder-gray-400 text-lg font-medium text-gray-900 outline-none relative z-10"
                style={{
                    boxShadow: focused
                        ? `0 0 0 4px ${mainColor}33, 0 0 32px 0 ${mainColor}44`
                        : '0 2px 16px 0 rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.4s cubic-bezier(.4,2,.6,1)',
                }}
            />
            {/* Animated angelic glow */}
            <span
                className={`pointer-events-none absolute inset-0 rounded-xl z-0 border-2 border-transparent transition-all duration-500`}
                style={{
                    boxShadow: focused
                        ? `0 0 40px 10px ${mainColor}55, 0 0 120px 40px ${mainColor}22`
                        : `0 0 24px 0 ${mainColor}22`,
                    opacity: focused ? 1 : 0.7,
                    transition: 'box-shadow 0.5s cubic-bezier(.4,2,.6,1), opacity 0.5s',
                }}
            />
            {/* Animated floating halo */}
            <span
                className={`pointer-events-none absolute left-1/2 -top-6 w-32 h-8 rounded-full blur-2xl opacity-60 transition-all duration-700`}
                style={{
                    transform: focused
                        ? 'translateX(-50%) scale(1.2)'
                        : 'translateX(-50%) scale(1)',
                    background: `radial-gradient(ellipse at center, ${mainColor}99 0%, transparent 80%)`,
                    filter: focused ? 'blur(16px)' : 'blur(24px)',
                    opacity: focused ? 0.85 : 0.5,
                }}
            />
        </div>
    );
}
