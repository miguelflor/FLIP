// src/components/Sidebar.tsx
import { Calendar, FolderOpen, BookOpen, Home, User, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 hidden md:block">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center">
            <img 
                src="/favicon.ico" 
                alt="FLIP Logo" 
                className="w-5 h-5"
              />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">FLIP</h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        
        <a 
          href="/dashboard#pdfs" 
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all duration-200 group"
        >
          <FolderOpen className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
          <span className="font-medium">Ficheiros</span>
        </a>
        
        <a 
          href="/dashboard#notas" 
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all duration-200 group relative"
        >
          <Calendar className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
          <span className="font-medium">Horário</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
            Em breve
          </span>
        </a>
      </nav>
    </aside>
  );
}
