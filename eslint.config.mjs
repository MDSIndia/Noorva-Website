import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Standalone Node tooling scripts, run directly via `node` (see
    // package.json's own bake:story script) — not part of the Next.js/TS
    // app bundle, so its CommonJS require() calls are intentional, not a
    // lint violation.
    'scripts/**',
  ]),
]);

export default eslintConfig;
