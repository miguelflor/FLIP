"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nextConfig = Object.assign(Object.assign({}, (process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
})), { images: {
        unoptimized: true
    } });
exports.default = nextConfig;
