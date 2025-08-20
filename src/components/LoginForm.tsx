// src/components/LoginForm.tsx
'use client';

import { useState } from 'react';
import ButtonWithAnimatedBG from './ButtonWithAnimatedBG';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // @ts-ignore
      if (!window.electron || !window.electron.ipcRenderer) {
        throw new Error('Electron IPC not available');
      }
      const res = await window.electron.ipcRenderer.invoke('login', { username, password });

      if (res.success) {
        // Optionally store session info if needed
        router.push('/dashboard');
      } else {
        alert(res.error || 'Login failed');
      }
    } catch (err: any) {
      alert(err.message || 'Login failed');
    }
    setLoading(false);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl px-8 py-8"
    >
      <input
        type="text"
        placeholder="Identificador de estudante"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition placeholder-gray-400 bg-white/80 shadow"
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-400 bg-white/80 shadow"
        required
      />
      <ButtonWithAnimatedBG loading={loading} />
    </form>
  );

}
