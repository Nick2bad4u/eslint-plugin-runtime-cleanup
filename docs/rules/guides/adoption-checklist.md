---
description: Practical checklist for adopting eslint-plugin-runtime-cleanup rules with low risk.
---

# Adoption checklist

Use this checklist when concrete runtime-cleanup rules are added.

## Before enabling a rule

- Confirm the rule targets a real resource lifetime problem in your codebase.
- Read the rule docs and understand the cleanup pattern it expects.
- Start with `runtime-cleanup.configs.recommended` or a single rule entry.
- Run ESLint without `--fix` first and review every report category.
- Enable type-aware presets only when your parser setup supports project
  services.

## During rollout

- Fix the highest-confidence findings first.
- Prefer explicit cleanup near the resource allocation site.
- Use suggestions where cleanup placement depends on program structure.
- Avoid blanket disables. Use narrow `eslint-disable-next-line` comments only
  when the resource is intentionally long-lived.

## Before release

- Run `npm run lint:nocache`.
- Run `npm run typecheck`.
- Run `npm run test`.
- Run the repository release gate when preparing a package release.
