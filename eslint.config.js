import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import i18next from 'eslint-plugin-i18next'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // i18n `no-literal-string` gate. Scoped to migrated files; each extraction
  // bucket appends its paths and the definition-of-done flips it to
  // 'src/**/*.{ts,tsx}'.
  {
    files: ['src/i18n/**/*.{ts,tsx}', 'src/components/LanguageSwitcher.tsx'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-only',
          'jsx-attributes': {
            exclude: [
              'sx', 'href', 'to', 'src', 'id', 'data-testid', 'variant',
              'color', 'severity', 'alt', 'role', 'type', 'name',
              'autoComplete', 'className', 'key', 'aria-hidden', 'size',
              'placement', 'anchorOrigin', 'transformOrigin', 'component',
              'fontSize', 'edge', 'anchor', 'orientation', 'overlap',
              'maxWidth', 'loadingPosition', 'target', 'rel', 'fontWeight',
            ],
          },
        },
      ],
    },
  },
])
