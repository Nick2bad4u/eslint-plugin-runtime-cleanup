# recommended-type-checked

`runtime-cleanup.configs["recommended-type-checked"]` is reserved for
recommended cleanup rules that need TypeScript parser services.

This preset does not set `parserOptions.projectService`. Configure type-aware
parsing in your own flat config before adding it:

```ts
import tsParser from "@typescript-eslint/parser";
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
 {
  files: ["**/*.{ts,tsx,mts,cts}"],
  languageOptions: {
   parser: tsParser,
   parserOptions: {
    projectService: true,
    tsconfigRootDir: import.meta.dirname,
   },
  },
 },
 runtimeCleanup.configs["recommended-type-checked"],
];
```

## Rules in this preset

This preset enables recommended rules and any type-aware recommended additions.

- `Fix` legend:
  - `fix` = autofixable
  - `suggest` = suggestions available
  - `-` = report only

### Type-aware additions over `recommended`

| Rule                                                                                                                                       | Fix |
| ------------------------------------------------------------------------------------------------------------------------------------------ | :-: |
| [`no-floating-infinite-animations`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-infinite-animations) |  -  |
| [`no-floating-web-stream-locks`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-web-stream-locks)       |  -  |

### Baseline rules inherited from `recommended`

| Rule                                                                                                                                       | Fix |
| ------------------------------------------------------------------------------------------------------------------------------------------ | :-: |
| [`no-floating-abort-controllers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-abort-controllers)     |  -  |
| [`no-floating-audio-contexts`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-audio-contexts)           |  -  |
| [`no-floating-broadcast-channels`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-broadcast-channels)   |  -  |
| [`no-floating-child-processes`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-child-processes)         |  -  |
| [`no-floating-disposable-stacks`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-disposable-stacks)     |  -  |
| [`no-floating-file-watchers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-file-watchers)             |  -  |
| [`no-floating-geolocation-watches`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-geolocation-watches) |  -  |
| [`no-floating-media-streams`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-media-streams)             |  -  |
| [`no-floating-message-channels`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-message-channels)       |  -  |
| [`no-floating-network-connections`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-network-connections) |  -  |
| [`no-floating-object-urls`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-object-urls)                 |  -  |
| [`no-floating-observers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-observers)                     |  -  |
| [`no-floating-servers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-servers)                         |  -  |
| [`no-floating-streams`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-streams)                         |  -  |
| [`no-floating-timers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-timers)                           |  -  |
| [`no-floating-wake-locks`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-wake-locks)                   |  -  |
| [`no-floating-workers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-workers)                         |  -  |
| [`no-unmanaged-event-listeners`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-unmanaged-event-listeners)       |  -  |
