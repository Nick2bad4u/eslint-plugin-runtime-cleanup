# Getting started

`eslint-plugin-runtime-cleanup` is an ESLint plugin scaffold for enforcing
explicit cleanup of runtime resources in TypeScript projects.

The initial package intentionally ships no rules. This keeps the repository
clean after template conversion and prevents unrelated rule behavior from being
published under the runtime-cleanup name.

## Installation

```sh
npm install --save-dev eslint-plugin-runtime-cleanup typescript
```

## Flat config

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## Current status

The plugin exports stable preset keys, parser defaults, package metadata, and
documentation structure. Add concrete rules only when the resource pattern,
cleanup expectation, false-positive boundaries, and fix or suggestion strategy
are defined.
