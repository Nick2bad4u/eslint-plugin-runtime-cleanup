---
title: IDE Integration (VS Code)
description: Configure VS Code for reliable Flat Config and type-aware ESLint plugin behavior.
sidebar_position: 22
---

# IDE Integration (VS Code)

This guide focuses on stable, low-noise integration with the VS Code ESLint extension.

## Extension expectations

Install and enable:

- `dbaeumer.vscode-eslint` (official VS Code ESLint extension)

Recommended checks:

- workspace is trusted,
- project dependencies are installed,
- VS Code uses the same Node version as your terminal/CI.

## Flat Config sample

```js
// eslint.config.mjs
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
 {
  files: ["**/*.{ts,tsx}"],
  plugins: {
   "runtime-cleanup": runtimeCleanup,
  },
  rules: {
   ...runtimeCleanup.configs.recommended.rules,
  },
 },
];
```

## Type-aware parser setup notes

`runtimeCleanup.configs["recommended-type-checked"]` does not enable
`projectService`. Type-aware parser configuration belongs in your flat config
because it depends on the workspace's tsconfig roots, generated-file policy, and
performance budget.

Configure parser services in a TypeScript-targeted config block before adding a
type-aware runtime-cleanup preset:

```ts
import tsParser from "@typescript-eslint/parser";
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
 {
  files: ["**/*.{ts,tsx,mts,cts}"],
  languageOptions: {
   parser: tsParser,
   parserOptions: {
    projectService: true,
    tsconfigRootDir: import.meta.dirname,
   },
  },
 },
 runtimeCleanup.configs["recommended-type-checked"],
];
```

If parser services are missing, typed rules will not have the TypeScript program
they need for semantic checks.

## Common gotchas

- **File is outside tsconfig scope:** typed rules may silently skip behavior.
- **Mismatched Node versions:** CLI and VS Code show different diagnostics.
- **Stale extension process:** reload the VS Code window after dependency upgrades.
- **Conflicting formatters/fixers:** verify on-save actions are not undoing ESLint fixes.

## Validation checklist

- `npm run typecheck`
- `npm run test`
- `npm run lint:all:fix:quiet`

If CLI is clean but VS Code is noisy, start with `--print-config` and extension output logs.
