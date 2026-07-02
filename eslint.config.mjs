import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".agents/**",
    ".cursor/**",
    "docs/**",
    "playwright-report/**",
    "test-results/**",
    "database/**/*.js",
    "scripts/**/*.js",
    "e2e/**",
    "*.json",
    "next-env.d.ts",
    "*.js",
    "*.cjs",
    "*.mjs",
  ]),
]);

export default eslintConfig;
