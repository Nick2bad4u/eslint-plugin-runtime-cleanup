# Presets

`eslint-plugin-runtime-cleanup` exposes stable flat-config presets so consumers
can adopt the package shape before concrete rules are published.

## Preset list

| Preset | Type information | Intended use |
| --- | :-: | --- |
| `runtime-cleanup.configs.minimal` | No | Lowest-noise cleanup rules. |
| `runtime-cleanup.configs.recommended` | No | Broadly safe cleanup rules. |
| `runtime-cleanup.configs["recommended-type-checked"]` | Yes | Recommended rules that need TypeScript type information. |
| `runtime-cleanup.configs.strict` | No | Stronger cleanup enforcement. |
| `runtime-cleanup.configs.all` | No | All stable rules. |
| `runtime-cleanup.configs.experimental` | No | Rules still proving out behavior. |

## Rule matrix

Runtime-cleanup rules are listed below. Each rule documents the exact resource-lifetime pattern it enforces.

- `Fix` legend:
  - `fix` = autofixable
  - `suggest` = suggestions available
  - `-` = report only
- `Preset key` legend:
  - [M](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/minimal) - [`runtime-cleanup.configs.minimal`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/minimal)
  - [R](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) - [`runtime-cleanup.configs.recommended`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended)
  - [T](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) - [`runtime-cleanup.configs["recommended-type-checked"]`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked)
  - [S](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) - [`runtime-cleanup.configs.strict`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict)
  - [A](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) - [`runtime-cleanup.configs.all`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all)
  - [E](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/experimental) - [`runtime-cleanup.configs.experimental`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/experimental)

| Rule | Fix | Preset key |
| --- | :-: | :-- |
| [`no-floating-child-processes`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-child-processes) | - | [R](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [T](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [S](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [A](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-observers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-observers) | - | [R](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [T](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [S](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [A](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-timers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-timers) | - | [R](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [T](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [S](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [A](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-floating-workers`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-floating-workers) | - | [R](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [T](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [S](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [A](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
| [`no-unmanaged-event-listeners`](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/no-unmanaged-event-listeners) | - | [R](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended) [T](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/recommended-type-checked) [S](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/strict) [A](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets/all) |
