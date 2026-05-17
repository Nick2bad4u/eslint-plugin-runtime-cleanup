---
description: Choose the right eslint-plugin-runtime-cleanup preset and roll it out with minimal migration risk.
---

# Preset selection strategy

The package currently exposes empty presets. These keys are stable adoption
points for future runtime cleanup rules.

## Recommended path

1. Use `runtime-cleanup.configs.recommended` for broad, low-noise checks.
2. Add `runtime-cleanup.configs["recommended-type-checked"]` when type-aware
   rules are useful and project services are available.
3. Evaluate `runtime-cleanup.configs.strict` only after recommended findings are
   clean.
4. Use `runtime-cleanup.configs.experimental` in narrow CI jobs or local audits
   before making it a default.

## Direct rule enablement

For early rollout, enabling one concrete rule at a time is usually better than
turning on a broader preset. That gives reviewers a clear resource category and
cleanup strategy to evaluate.
