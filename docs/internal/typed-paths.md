# Typed service path inventory

This document inventories typed call paths that can reach parser services or the
TypeScript checker.

## Guard model

All type-aware rule execution enters through explicit gates:

- `createTypedRule(...)` short-circuits typed rules (`meta.docs.requiresTypeChecking: true`) when full type services are unavailable.
- Optional typed flows in non-type-checked rules must call `hasTypeServices(context)` before calling `getTypedRuleServices(context)`.
- Type-dependent helpers should receive prevalidated parser services instead of discovering them internally.

## Core typed helpers

| Path                                               | Typed dependency                  | Guard entry                                                   | Fallback behavior                  | Max expected expensive calls/file |
| -------------------------------------------------- | --------------------------------- | ------------------------------------------------------------- | ---------------------------------- | --------------------------------- |
| `src/_internal/typed-rule.ts#getTypedRuleServices` | `parserServices.program`, checker | `hasTypeServices(context)` or typed-rule create short-circuit | Throws if called without `program` | 1 (rule create path)              |

## Rule callpath inventory

No runtime-cleanup rules currently require parser services.

Current syntax-only rules:

- `src/rules/no-floating-timers.ts` reports discarded timer handles without using type information.
- `src/rules/no-unmanaged-event-listeners.ts` reports event listener registrations without using type information.
- `src/rules/no-floating-observers.ts` reports discarded observer instances without using type information.
- `src/rules/no-floating-workers.ts` reports discarded worker instances without using type information.
- `src/rules/no-floating-child-processes.ts` reports discarded child process handles without using type information.

When a typed rule is added, update this inventory with:

- whether the rule requires type checking
- which helper owns type-service validation
- the maximum expected checker calls per file
- fallback behavior when typed services are unavailable

## Metadata note

Rule metadata can include stable catalog identifiers on public rule docs payloads:

- `meta.docs.ruleId: "R###"`
- `meta.docs.ruleNumber: <number>`

Individual rule modules should not hand-author generated identifiers unless the
registry/catalog contract explicitly requires it.
