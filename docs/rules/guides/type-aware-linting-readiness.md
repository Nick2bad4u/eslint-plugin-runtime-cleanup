---
description: Checklist and rollout playbook for enabling type-aware eslint-plugin-runtime-cleanup rules safely.
---

# Type-aware linting readiness

Some future cleanup rules may need TypeScript parser services to distinguish
resource-like values from unrelated identifiers. Use type-aware rules only when
the project can provide reliable type information.

## Requirements

- `@typescript-eslint/parser` configured for the files being linted.
- `parserOptions.projectService` or an equivalent typed parser setup.
- CI memory and runtime budgets sized for type-aware linting.

## Rollout

Start with a small package or workspace. Compare runtime and findings against
the non-type-aware preset before enabling typed rules broadly.
