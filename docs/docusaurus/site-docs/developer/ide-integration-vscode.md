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

`runtimeCleanup.configs["recommended-type-checked"]` enables `projectService`. The current recommended rule set is syntax-only, but type-aware rules should always be run from a TypeScript-targeted config block.

If you build a fully manual config block (instead of consuming a preset), configure parser services in the TypeScript-targeted config block:

```js
languageOptions: {
  parserOptions: {
    projectService: true,
    tsconfigRootDir: import.meta.dirname,
  },
}
```

If parser services are missing, future typed rules may not run as expected.

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
