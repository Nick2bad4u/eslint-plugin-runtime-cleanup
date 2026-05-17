---
title: ADR 0005 - Resource Lifecycle Rule Families
description: Decision record for grouping runtime cleanup rules by resource lifecycle and cleanup semantics.
sidebar_position: 5
---

# ADR 0005: Keep resource lifecycle families explicit

- Status: Accepted
- Date: 2026-02-25

## Context

The plugin enforces cleanup obligations for several resource families:

- timers and animation callbacks,
- DOM and Node event listeners,
- observers,
- abort controllers and abort signals,
- workers and child processes,
- streams,
- and explicit disposable resources.

These APIs share the same broad failure mode: code allocates work that can outlive the current scope, then loses the handle needed to stop it. They do not share the same cleanup primitive. A timer must be cleared, a listener must be removed with the same target/type/callback tuple, an observer must disconnect, a process must be killed or awaited, and a stream may need destroy/end/close semantics.

Treating every cleanup rule as one generic pattern would create noisy diagnostics and weak migration advice.

## Decision

Keep cleanup rule families explicit in names, docs, tests, and presets.

- Timer rules focus on retaining handles from APIs such as `setTimeout`, `setInterval`, `requestAnimationFrame`, and related globals.
- Listener rules must prove that the callback and target can be paired with a later removal.
- Observer rules must reason about observer instance lifetime and `disconnect()`.
- Abort-controller rules must reason about signal propagation and abort ownership.
- Worker, stream, child-process, and disposable rules must each document their resource-specific cleanup semantics.

Shared infrastructure can normalize rule metadata, docs URLs, and preset wiring, but matcher logic should stay close to the resource family it understands.

## Rationale

1. **Clear cleanup advice**: diagnostics should name the exact handle or API the developer must preserve.
2. **Lower false-positive risk**: resource-specific matchers avoid pretending that every lifecycle API can be analyzed the same way.
3. **Better rule authoring discipline**: tests can cover the actual cleanup primitive instead of broad, generic leak language.
4. **Safer preset design**: stable presets can include syntax-only, low-noise checks while semantic ownership rules mature separately.

## Consequences

- Documentation and changelogs should identify the resource family a rule belongs to.
- New rules should declare their cleanup primitive and detection boundary up front.
- Autofixes should be rare for cleanup rules because safe cleanup location is usually semantic; suggestions are acceptable when they preserve intent.
- Preset promotion should be based on false-positive behavior per family, not on nominal API coverage.

## Revisit Triggers

Re-evaluate if:

- the project introduces a shared ownership model that can safely cover multiple resource families,
- or users report that the current family split no longer reflects how cleanup work is reviewed.
