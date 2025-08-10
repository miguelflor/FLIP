// src/components/LoginForm.tsx
'use client';

import { useState } from 'react';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Número de estudante"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
        disabled={loading}
      >
        {loading ? 'A entrar...' : 'Entrar'}
      </button>
    </form>
  );
}
