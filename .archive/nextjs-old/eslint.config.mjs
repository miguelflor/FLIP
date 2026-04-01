// eslint.config.mjs
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: process.cwd(), // Changed from __dirname
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
