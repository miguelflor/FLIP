// src/components/LoginForm.tsx
'use client';

import { useState } from 'react';
import ButtonWithAnimatedBG from './ButtonWithAnimatedBG';
import AnimatedInput from './AnimatedInput';
import { useRouter } from 'next/navigation';
import { invoke } from '@tauri-apps/api/core';

interface LoginResponse {
  success: boolean;
  session_id?: string;
  error?: string;
}

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await invoke<LoginResponse>('login', { username, password });

      if (res.success && res.session_id) {
        // Store session ID for use in other IPC calls
        localStorage.setItem('clipSessionId', res.session_id);
        router.push('/dashboard');
      } else {
        alert(res.error || 'Login failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      alert(message);
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      {/* Beautiful Glassmorphism Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
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
        }}
      />

      {/* Subtle shimmer animation */}
      <div
        className="absolute inset-0 -z-5 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
          animation: 'formShimmer 10s linear infinite',
          borderRadius: '20px'
        }}
      />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center space-y-5 px-8 py-8 relative z-10"
      >
        <AnimatedInput
          type="text"
          placeholder="Identificador de estudante"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          color="pink"
          required
        />
        <AnimatedInput
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          color="blue"
          required
        />
        <ButtonWithAnimatedBG loading={loading} />
      </form>
    </div>
  );
}