import typescriptEslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
})

export default [{
    ignores: ['**/node_modules/', '**/dist/', '**/examples/'],
}, ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'), {
    plugins: {
        '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
    },

    rules: {
        quotes: ['error', 'single'],
        semi: ['error', 'never'],
        '@typescript-eslint/naming-convention': ['error', {
            selector: 'interface',
            format: ['PascalCase'],

            custom: {
                regex: '^I[A-Z]',
                match: true,
            },
        }],
    },
}]