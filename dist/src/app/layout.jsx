"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
// src/app/layout.tsx
require("./globals.css");
exports.metadata = {
    title: 'FLIP - F*** the CLIP',
    description: 'Uma alternativa rápida e limpa ao desastre do CLIP.',
};
function RootLayout({ children }) {
    return (<html lang="pt">
      <body className="bg-gray-100 text-gray-900 font-sans">
        {children}
      </body>
    </html>);
}
