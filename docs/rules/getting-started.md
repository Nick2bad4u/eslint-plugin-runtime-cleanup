# Getting started

`eslint-plugin-runtime-cleanup` is an ESLint plugin for enforcing explicit
cleanup of runtime resources in JavaScript and TypeScript projects.

## Installation

```sh
npm install --save-dev eslint-plugin-runtime-cleanup typescript
```

## Flat config

```ts
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

The recommended preset targets JavaScript and TypeScript files by default:
`**/*.{js,mjs,cjs,ts,tsx,mts,cts}`. Type-aware presets stay scoped to
TypeScript-family files, but they do not configure TypeScript parser services
for you.

Configure type-aware parsing in the consuming flat config before adding a
type-aware preset:

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

## Current status

The plugin exports stable preset keys, parser defaults, package metadata, rule
documentation, and release gates. Add concrete rules only when the resource
pattern, cleanup expectation, false-positive boundaries, and fix or suggestion
strategy are defined.
