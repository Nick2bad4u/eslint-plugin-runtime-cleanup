---
title: ADR 0001 - @eslint/plugin-kit Adoption
description: Decision record for whether eslint-plugin-runtime-cleanup should adopt @eslint/plugin-kit for rule/runtime internals.
sidebar_position: 1
---

# ADR 0001: Do not adopt `@eslint/plugin-kit` for rule/runtime internals

- Status: Accepted
- Date: 2026-02-22

## Context

The repository currently uses custom internal utilities to build and maintain rule behavior:

- `src/_internal/typed-rule.ts` for typed rule creation and parser service/type-checker access.
- `src/_internal/scope-variable.ts` and `src/_internal/member-call.ts` for rule-local scope and call-expression analysis.
- `src/_internal/value-rewrite-autofix-safety.ts` and `src/_internal/type-predicate-autofix-safety.ts` for guarded rewrite decisions.

`@eslint/plugin-kit` (per package README) provides utilities focused on:

- `ConfigCommentParser`
- `Directive`
- `VisitNodeStep` / `CallMethodStep`
- `TextSourceCodeBase`

These are primarily for implementing custom language/source-code plumbing (directive parsing, traversal, `SourceCode`-like behavior), not for rule-level cleanup analysis or safe rewrite orchestration.

## Decision

Do **not** adopt `@eslint/plugin-kit` in this plugin at this time.

## Rationale

1. **No direct capability overlap** with this repository's highest-complexity internals (typed rule services, lifecycle matcher helpers, and cleanup-safe rewrite decisions).
2. **Would not reduce maintenance burden** in currently hand-rolled areas.
3. **Would add dependency and migration surface** without meaningful DX/perf/correctness gains.

## Consequences

- Keep existing internal abstractions in `src/_internal/*`.
- Continue targeted hardening/tests around cleanup matcher and autofix-safety behavior.

## Revisit Triggers

Re-evaluate adoption if we add custom language support requiring:

- custom `SourceCode#traverse()` step modeling,
- custom disable directive parsing/representation,
- or other infrastructure directly using `Directive` and traversal step abstractions.
