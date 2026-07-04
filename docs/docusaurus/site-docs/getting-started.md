---
sidebar_position: 2
---

# Getting Started

Install the plugin:

```bash
npm install --save-dev eslint-plugin-runtime-cleanup
```

Then enable it in your Flat Config:

```ts
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## Recommended approach

- Start with `runtimeCleanup.configs.recommended`.
- Use `runtimeCleanup.configs["recommended-type-checked"]` for rules that require TypeScript parser services.
- Fix violations in small batches and promote warnings to errors after stabilization.

## Type-aware parser setup

Configure type-aware parsing in your own flat config before adding a type-aware preset:

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

## Rule navigation

Use the sidebar **Rules** section for the rule docs synced from the repository.
