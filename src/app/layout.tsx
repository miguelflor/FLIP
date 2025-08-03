// src/app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'FLIP - F*** the CLIP',
  description: 'Uma alternativa rápida e limpa ao desastre do CLIP.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-gray-100 text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
