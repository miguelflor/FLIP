// src/components/Navbar.tsx
'use client'
import React from 'react';
export default function Navbar() {
  return (
    <header className="w-full p-4 border-b bg-white flex justify-between items-center">
      <h2 className="text-xl font-bold">FLIP Dashboard</h2>
      <button
        className="text-sm text-red-600 hover:underline"
        onClick={() => (window.location.href = '/')}
      >
        Sair
      </button>
    </header>
  );
}
