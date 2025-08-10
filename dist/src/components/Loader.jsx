"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Loader;
// src/components/Loader.tsx
function Loader() {
    return (<div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"/>
    </div>);
}
