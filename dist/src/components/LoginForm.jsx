"use strict";
// src/components/LoginForm.tsx
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginForm;
const react_1 = require("react");
const ButtonWithAnimatedBG_1 = __importDefault(require("./ButtonWithAnimatedBG"));
const AnimatedInput_1 = __importDefault(require("./AnimatedInput"));
const navigation_1 = require("next/navigation");
function LoginForm() {
    const [username, setUsername] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const router = (0, navigation_1.useRouter)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!window.electron || !window.electron.ipcRenderer) {
                throw new Error('Electron IPC not available');
            }
            const res = await window.electron.ipcRenderer.invoke('login', { username, password });
            if (res.success && res.sessionId) {
                // Store session ID for use in other IPC calls
                localStorage.setItem('clipSessionId', res.sessionId);
                router.push('/dashboard');
            }
            else {
                alert(res.error || 'Login failed');
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            alert(message);
        }
        setLoading(false);
    };
    return (<div className="relative">
      {/* Beautiful Glassmorphism Background */}
      <div className="absolute inset-0 -z-10" style={{
            background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.15) 0%, 
              rgba(255, 255, 255, 0.08) 50%, 
              rgba(147, 197, 253, 0.12) 100%
            )
          `,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 0 60px rgba(147, 197, 253, 0.15)
          `
        }}/>

      {/* Subtle shimmer animation */}
      <div className="absolute inset-0 -z-5 pointer-events-none" style={{
            background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'formShimmer 10s linear infinite',
            borderRadius: '20px'
        }}/>

      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center space-y-5 px-8 py-8 relative z-10">
        <AnimatedInput_1.default type="text" placeholder="Identificador de estudante" value={username} onChange={(e) => setUsername(e.target.value)} color="pink" required/>
        <AnimatedInput_1.default type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} color="blue" required/>
        <ButtonWithAnimatedBG_1.default loading={loading}/>
      </form>
    </div>);
}
