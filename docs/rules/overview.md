# Rules overview

`eslint-plugin-runtime-cleanup` rules target runtime resource lifetimes that are
easy to leak when allocation and teardown drift apart.

## Rules

- [`no-floating-abort-controllers`](./no-floating-abort-controllers.md)
- [`no-floating-audio-contexts`](./no-floating-audio-contexts.md)
- [`no-floating-broadcast-channels`](./no-floating-broadcast-channels.md)
- [`no-floating-child-processes`](./no-floating-child-processes.md)
- [`no-floating-disposable-stacks`](./no-floating-disposable-stacks.md)
- [`no-floating-file-watchers`](./no-floating-file-watchers.md)
- [`no-floating-geolocation-watches`](./no-floating-geolocation-watches.md)
- [`no-floating-infinite-animations`](./no-floating-infinite-animations.md)
- [`no-floating-media-streams`](./no-floating-media-streams.md)
- [`no-floating-message-channels`](./no-floating-message-channels.md)
- [`no-floating-network-connections`](./no-floating-network-connections.md)
- [`no-floating-object-urls`](./no-floating-object-urls.md)
- [`no-floating-observers`](./no-floating-observers.md)
- [`no-floating-servers`](./no-floating-servers.md)
- [`no-floating-streams`](./no-floating-streams.md)
- [`no-floating-timers`](./no-floating-timers.md)
- [`no-floating-wake-locks`](./no-floating-wake-locks.md)
- [`no-floating-web-stream-locks`](./no-floating-web-stream-locks.md)
- [`no-floating-workers`](./no-floating-workers.md)
- [`no-unmanaged-event-listeners`](./no-unmanaged-event-listeners.md)

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
