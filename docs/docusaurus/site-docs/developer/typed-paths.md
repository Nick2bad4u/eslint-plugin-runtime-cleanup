---
title: Typed service path inventory
description: Inventory of typed parser-service and TypeScript-checker callpaths used by eslint-plugin-runtime-cleanup.
---

# Typed service path inventory

This page inventories the current typed callpaths that can reach parser services or the TypeScript checker.

> Source document: [`docs/internal/typed-paths.md`](https://github.com/Nick2bad4u/eslint-plugin-runtime-cleanup/blob/main/docs/internal/typed-paths.md)

## Guard model

All type-aware rule execution enters through explicit gates:

- `createTypedRule(...)` short-circuits typed rules (`meta.docs.requiresTypeChecking: true`) when full type services are unavailable.
- Optional typed flows in non-type-checked rules call `hasTypeServices(context)` before calling `getTypedRuleServices(context)`.
- Type-dependent helpers no longer discover typed services internally.

## Core typed helpers

| Path                                               | Typed dependency                  | Guard entry                                                   | Fallback behavior                  | Max expected expensive calls/file |
| -------------------------------------------------- | --------------------------------- | ------------------------------------------------------------- | ---------------------------------- | --------------------------------- |
| `src/_internal/typed-rule.ts#getTypedRuleServices` | `parserServices.program`, checker | `hasTypeServices(context)` or typed-rule create short-circuit | Throws if called without `program` | 1 (rule create path)              |

## Rule callpath inventory

### Rules that require type checking (`meta.docs.requiresTypeChecking: true`)

No current rules require type checking.

### Rules with optional typed branch (`meta.docs.requiresTypeChecking: false`)

No current rules have optional typed branches.

### Syntax-only rules

- `src/rules/no-floating-observers.ts`
- `src/rules/no-floating-timers.ts`
- `src/rules/no-unmanaged-event-listeners.ts`

## Telemetry counters

Typed hot-path counters are not currently active because the first runtime-cleanup rule is syntax-only. Reintroduce telemetry here when a type-aware cleanup rule ships.
