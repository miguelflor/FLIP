"use strict";
// src/app/dashboard/layout.tsx
"user client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardLayout;
const Navbar_1 = __importDefault(require("../../components/Navbar"));
const Sidebar_1 = __importDefault(require("../../components/Sidebar"));
function DashboardLayout({ children }) {
    return (<div className="min-h-screen flex">
      <Sidebar_1.default />
      <div className="flex-1 flex flex-col">
        <Navbar_1.default />
        <main className="flex-1 p-6 bg-white">{children}</main>
      </div>
    </div>);
}
