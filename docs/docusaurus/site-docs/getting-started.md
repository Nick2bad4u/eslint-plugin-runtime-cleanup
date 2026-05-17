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

export default [
    {
        plugins: {
            "runtime-cleanup": runtimeCleanup,
        },
        rules: {},
    },
];
```

## Recommended approach

- Start with `runtimeCleanup.configs.recommended` once cleanup rules are added.
- Use `runtimeCleanup.configs["recommended-type-checked"]` for rules that require TypeScript parser services.
- Fix violations in small batches and promote warnings to errors after stabilization.

## Rule navigation

Use the sidebar **Rules** section for the rule docs synced from the repository.
