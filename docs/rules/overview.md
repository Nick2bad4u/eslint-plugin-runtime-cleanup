# Rules overview

`eslint-plugin-runtime-cleanup` rules target runtime resource lifetimes that are
easy to leak when allocation and teardown drift apart.

## Stable rules

- [`no-floating-timers`](./no-floating-timers.md) requires timer handles to be
  retained so they can be cleared during cleanup.
- [`no-unmanaged-event-listeners`](./no-unmanaged-event-listeners.md) requires
  event listeners to use an `AbortSignal` option or a matching
  `removeEventListener` cleanup call.
- [`no-floating-observers`](./no-floating-observers.md) requires native
  observer instances to be retained so they can be disconnected during cleanup.
- [`no-floating-workers`](./no-floating-workers.md) requires worker handles to
  be retained so they can be terminated during cleanup.
- [`no-floating-child-processes`](./no-floating-child-processes.md) requires
  child process handles to be retained so they can be killed during cleanup.

Future rules should continue to target explicit runtime resource lifetimes,
including timers, listeners, observers, abort controllers, workers, streams,
child processes, and disposable handles.

## Rule authoring expectations

Runtime cleanup rules should be conservative:

- report only resource allocation patterns with a clear cleanup obligation
- avoid whole-file heuristics that create noisy false positives
- use type information only when it materially improves precision
- prefer suggestions over autofixes when cleanup placement is ambiguous
- document the exact lifecycle pattern the rule expects

## Presets

The preset pages describe the exported config keys and are ready for future
rules:

- [`minimal`](./presets/minimal.md)
- [`recommended`](./presets/recommended.md)
- [`recommended-type-checked`](./presets/recommended-type-checked.md)
- [`strict`](./presets/strict.md)
- [`all`](./presets/all.md)
- [`experimental`](./presets/experimental.md)
