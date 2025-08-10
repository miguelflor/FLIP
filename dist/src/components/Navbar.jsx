"use strict";
// src/components/Navbar.tsx
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Navbar;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
function Navbar() {
    return (<header className="w-full bg-white border-slate-200 shadow-sm">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <lucide_react_1.Menu className="w-5 h-5 text-slate-600"/>
          </button>
          
         
        </div>

       

        {/* Right section */}
        <div className="flex items-center space-x-2">
          
          {/* User profile */}
          <div className="flex items-center space-x-3 ml-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">Estudante</p>
              <p className="text-xs text-slate-500">Online</p>
            </div>
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-slate-600 font-medium text-sm">E</span>
            </div>
          </div>

          {/* Logout button */}
          <button className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group ml-2" onClick={() => (window.location.href = '/')}>
            <lucide_react_1.LogOut className="w-4 h-4 group-hover:text-red-700"/>
            <span className="text-sm font-medium group-hover:text-red-700 hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>);
}
