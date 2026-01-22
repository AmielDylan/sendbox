import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The codebase still contains many necessary `any` (DB/adapters/SDK edges).
      // Keep lint actionable by not failing CI on `any` until we can tighten types progressively.
      '@typescript-eslint/no-explicit-any': 'off',
      // French copy and UI strings use apostrophes/quotes frequently; this rule is too noisy.
      'react/no-unescaped-entities': 'off',
      // Too strict for common UI patterns (ClientOnly, loading guards, etc.).
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // App tooling/scripts are not shipped and often use relaxed typing.
    'scripts/**',
  ]),
])

export default eslintConfig
