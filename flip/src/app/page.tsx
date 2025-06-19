// src/app/page.tsx
'use client';
import LoginForm from '../components/LoginForm';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-3xl font-bold text-center">Bem-vindo ao FLIP</h1>
        <p className="text-center text-sm text-gray-500">Login com o teu número de estudante</p>
        <LoginForm />
      </div>
    </main>
  );
}
