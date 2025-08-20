'use client';
import LoginForm from '../components/LoginForm';

export default function Home() {
  return (
    <>
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Magma Lamp Background */}
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-full">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-pink-500 opacity-40 rounded-full filter blur-3xl animate-magma1" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[700px] h-[700px] bg-purple-500 opacity-40 rounded-full filter blur-3xl animate-magma2" />
            <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] bg-yellow-400 opacity-30 rounded-full filter blur-2xl animate-magma3" />
            <div className="absolute bottom-[10%] left-[20%] w-[350px] h-[350px] bg-blue-400 opacity-30 rounded-full filter blur-2xl animate-magma4" />
          </div>
        </div>
        <div className="max-w-md w-full space-y-8 z-10">
          <h1 className="text-3xl font-bold text-center text-white drop-shadow-lg">Bem-vindo ao FLIP</h1>
          <LoginForm />
        </div>
      </main>
    </>
  );

}