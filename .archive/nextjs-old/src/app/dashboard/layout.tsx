// src/app/dashboard/layout.tsx
"user client"
import { ReactNode } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 bg-white">{children}</main>
      </div>
    </div>
  );
}
