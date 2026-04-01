"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AnimatedInput;
const react_1 = require("react");
function AnimatedInput({ type, placeholder, value, onChange, color = 'pink', required = false, }) {
    const [focused, setFocused] = (0, react_1.useState)(false);
    const inputRef = (0, react_1.useRef)(null);
    // Pure angelic color palette
    const colorMap = {
        pink: '#f8bbd9',
        blue: '#bfdbfe',
        purple: '#e9d5ff',
        gold: '#fef3c7',
    };
    const mainColor = colorMap[color] || colorMap.pink;
    return (<div className="relative group my-6 w-full">
            {/* Floating Label */}
            <label className={`absolute left-4 transition-all duration-500 pointer-events-none z-20 font-light
                    ${focused || value ?
            'text-sm -top-3 px-3 text-white' :
            'text-base top-4 text-white/70'}`} style={{
            background: (focused || value) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            backdropFilter: (focused || value) ? 'blur(10px)' : 'none',
            borderRadius: (focused || value) ? '12px' : '0px',
            textShadow: '0 2px 10px rgba(255, 255, 255, 0.3)',
        }}>
                {placeholder}
            </label>

            {/* Main Input Field */}
            <input ref={inputRef} type={type} value={value} onChange={onChange} required={required} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} className="w-full px-4 py-4 pt-6 text-white placeholder-transparent outline-none relative z-10 font-light text-lg transition-all duration-500" style={{
            background: focused ?
                'rgba(255, 255, 255, 0.08)' :
                'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(15px)',
            borderRadius: '16px',
            border: `1px solid ${focused ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
            boxShadow: focused
                ? `0 8px 32px rgba(0, 0, 0, 0.1), 
                           0 0 0 1px rgba(255, 255, 255, 0.2), 
                           inset 0 1px 0 rgba(255, 255, 255, 0.3)`
                : `0 4px 16px rgba(0, 0, 0, 0.05), 
                           inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
        }}/>

            {/* Gentle Glow */}
            {focused && (<div className="pointer-events-none absolute inset-0 rounded-2xl transition-all duration-700" style={{
                boxShadow: `0 0 40px 8px ${mainColor}40, 0 0 80px 16px ${mainColor}20`,
                opacity: 0.7,
            }}/>)}

            {/* Soft Halo */}
            <div className="pointer-events-none absolute left-1/2 -top-2 w-16 h-4 rounded-full transition-all duration-700" style={{
            transform: focused
                ? 'translateX(-50%) scale(1.3)'
                : 'translateX(-50%) scale(1)',
            background: `radial-gradient(ellipse at center, ${mainColor}60 0%, transparent 70%)`,
            filter: 'blur(8px)',
            opacity: focused ? 0.8 : 0.3,
        }}/>

            {/* Subtle shimmer */}
            {focused && (<div className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-500" style={{
                background: 'linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
                animation: 'gentleShimmer 4s linear infinite',
            }}/>)}

            <style jsx>{`
                @keyframes gentleShimmer {
                    0% { background-position: -100% center; }
                    100% { background-position: 100% center; }
                }
            `}</style>
        </div>);
}
