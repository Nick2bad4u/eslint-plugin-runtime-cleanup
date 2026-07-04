# eslint-plugin-runtime-cleanup

[![npm license.](https://flat.badgen.net/npm/license/eslint-plugin-runtime-cleanup?color=purple)](https://github.com/Nick2bad4u/eslint-plugin-runtime-cleanup/blob/main/LICENSE) [![npm total downloads.](https://flat.badgen.net/npm/dt/eslint-plugin-runtime-cleanup?color=pink)](https://www.npmjs.com/package/eslint-plugin-runtime-cleanup) [![latest GitHub release.](https://flat.badgen.net/github/release/Nick2bad4u/eslint-plugin-runtime-cleanup?color=cyan)](https://github.com/Nick2bad4u/eslint-plugin-runtime-cleanup/releases) [![GitHub stars.](https://flat.badgen.net/github/stars/Nick2bad4u/eslint-plugin-runtime-cleanup?color=yellow)](https://github.com/Nick2bad4u/eslint-plugin-runtime-cleanup/stargazers) [![GitHub forks.](https://flat.badgen.net/github/forks/Nick2bad4u/eslint-plugin-runtime-cleanup?color=green)](https://github.com/Nick2bad4u/eslint-plugin-runtime-cleanup/forks) [![GitHub open issues.](https://flat.badgen.net/github/open-issues/Nick2bad4u/eslint-plugin-runtime-cleanup?color=red)](https://github.com/Nick2bad4u/eslint-plugin-runtime-cleanup/issues) [![codecov.](https://codecov.io/gh/Nick2bad4u/eslint-plugin-runtime-cleanup/branch/main/graph/badge.svg)](https://codecov.io/gh/Nick2bad4u/eslint-plugin-runtime-cleanup)

ESLint plugin for rules that require explicit cleanup of runtime resources such
as timers, event listeners, observers, abort controllers, workers, streams,
child processes, and disposable handles.

The runtime, preset surfaces, documentation structure, tests, and release gates
are in place so cleanup rules can stay consistent across rule metadata,
generated docs, and flat config presets.

## Install

```sh
npm install --save-dev eslint-plugin-runtime-cleanup typescript
```

## Usage

```ts
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

The recommended preset targets JavaScript and TypeScript files by default:
`**/*.{js,mjs,cjs,ts,tsx,mts,cts}`. Type-aware presets stay scoped to
TypeScript-family files, but they do not configure TypeScript parser services
for you.

Configure type-aware parsing in the consuming flat config before adding a
type-aware preset:

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

## Presets

| Preset                                                | Purpose                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `runtime-cleanup.configs.minimal`                     | Low-noise cleanup baseline.                                           |
| `runtime-cleanup.configs.recommended`                 | Broadly safe cleanup rules for JS and TS files.                       |
| `runtime-cleanup.configs["recommended-type-checked"]` | Recommended cleanup rules plus checks that need TypeScript type data. |
| `runtime-cleanup.configs.strict`                      | Stronger cleanup enforcement for TypeScript-family files.             |
| `runtime-cleanup.configs.all`                         | All stable cleanup rules for TypeScript-family files.                 |
| `runtime-cleanup.configs.experimental`                | Rules still proving out behavior or fix safety.                       |

## Rules

Runtime-cleanup rules are listed below. Each rule documents the exact resource-lifetime pattern it enforces.

- `Fix` legend:
  - `fix` = autofixable
  - `suggest` = suggestions available
  - `-` = report only
- `Preset emoji` legend:
  - [🟢](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/minimal) - [`runtime-cleanup.configs.minimal`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/minimal)
  - [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) - [`runtime-cleanup.configs.recommended`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended)
  - [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) - [`runtime-cleanup.configs["recommended-type-checked"]`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked)
  - [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) - [`runtime-cleanup.configs.strict`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict)
  - [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) - [`runtime-cleanup.configs.all`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all)
  - [🧪](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/experimental) - [`runtime-cleanup.configs.experimental`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/experimental)

| Rule                                                                                                                                       | Fix | Presets                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------ | :-: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`no-floating-abort-controllers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-abort-controllers)     |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-audio-contexts`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-audio-contexts)           |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-broadcast-channels`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-broadcast-channels)   |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-child-processes`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-child-processes)         |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-disposable-stacks`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-disposable-stacks)     |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-file-watchers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-file-watchers)             |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-geolocation-watches`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-geolocation-watches) |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-infinite-animations`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-infinite-animations) |  -  | [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all)                                                                                                 |
| [`no-floating-media-streams`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-media-streams)             |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-message-channels`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-message-channels)       |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-network-connections`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-network-connections) |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-object-urls`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-object-urls)                 |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-observers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-observers)                     |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-servers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-servers)                         |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-streams`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-streams)                         |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-timers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-timers)                           |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-wake-locks`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-wake-locks)                   |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-web-stream-locks`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-web-stream-locks)       |  -  | [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all)                                                                                                 |
| [`no-floating-workers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-workers)                         |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-unmanaged-event-listeners`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-unmanaged-event-listeners)       |  -  | [🟡](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [🧬](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [🔴](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [🟣](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |

## Rule Roadmap

The plugin is intended to cover resource lifetime hazards where missed cleanup
causes leaks, duplicate work, stuck processes, or stale callbacks. Concrete
rules should be added only when the AST strategy, false-positive boundaries,
and fix/suggestion behavior are explicit.

Likely future rule families:

- timers created by `setTimeout`, `setInterval`, and related scheduling APIs
- event listeners that need matching `removeEventListener` calls or signal
  cleanup
- observers such as `MutationObserver`, `ResizeObserver`, and
  `IntersectionObserver`
- `AbortController` and `AbortSignal` lifecycle management
- workers, streams, child processes, and disposable handles

## Development

```sh
npm run build
npm run typecheck
npm run test
npm run lint:nocache
```

The release gate is:

```sh
npm run release:verify
```

## Documentation

The Docusaurus documentation site lives under `docs/docusaurus` and consumes
the hand-authored rule and preset docs under `docs/rules`.
