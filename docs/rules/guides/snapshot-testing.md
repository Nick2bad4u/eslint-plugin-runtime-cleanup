---
description: How to use Vitest snapshots safely and effectively in eslint-plugin-runtime-cleanup.
---

# Snapshot testing

Prefer explicit assertions for rule behavior. Snapshots are useful only for
stable generated surfaces such as preset matrices or public contract summaries.

## Good snapshot targets

- plugin preset contract summaries
- generated README rule tables
- generated docs navigation fragments

## Avoid snapshots for rule fixes

Autofix output should be written as explicit strings in RuleTester cases. That
keeps cleanup transformations reviewable and prevents accidental acceptance of
unsafe fixer behavior.
