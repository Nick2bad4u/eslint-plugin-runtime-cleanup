# no-floating-geolocation-watches

Require geolocation watch IDs to be retained so they can be cleared.

> **Rule catalog ID:** R014

## Targeted pattern scope

This rule targets browser geolocation watcher registration:

- `navigator.geolocation.watchPosition(...)`
- `window.navigator.geolocation.watchPosition(...)`
- `globalThis.navigator.geolocation.watchPosition(...)`

The rule reports calls whose returned watch ID is immediately discarded. The
watch ID is the handle needed to unregister the watcher with
`navigator.geolocation.clearWatch(...)`.

## What this rule reports

The rule reports:

- standalone watcher registration such as
  `navigator.geolocation.watchPosition(onPosition);`
- voided watcher registration such as
  `void navigator.geolocation.watchPosition(onPosition);`
- TypeScript-wrapped expressions that still discard the returned watch ID

It intentionally does not require same-function `clearWatch()` calls. Ownership
can be transferred to a component instance, route lifecycle, returned value, or
watch manager.

## Why this rule exists

`watchPosition()` installs repeated location monitoring callbacks. The browser
returns a numeric ID for that watch, and `clearWatch(id)` uses that ID to remove
the registered monitoring handlers. If the ID is discarded, the code that owns
the lifecycle cannot reliably unregister the watcher.

## Incorrect

```ts
navigator.geolocation.watchPosition(onPosition);
```

```ts
void navigator.geolocation.watchPosition(onPosition, onError);
```

## Correct

```ts
const watchId = navigator.geolocation.watchPosition(onPosition);

navigator.geolocation.clearWatch(watchId);
```

```ts
return navigator.geolocation.watchPosition(onPosition);
```

```ts
registerWatch(navigator.geolocation.watchPosition(onPosition));
```

## Behavior and migration notes

Store the returned watch ID in the owner that will call `clearWatch()`. In UI
code, that is usually the component, route, or view lifecycle. In shared
libraries, returning the ID or passing it to a watcher manager keeps ownership
explicit.

This rule does not autofix. Choosing the owner and cleanup point is a semantic
decision.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## When not to use it

Do not enable this rule for code that intentionally creates page-lifetime
geolocation watches and does not need explicit teardown. Prefer a narrow disable
comment with a reason in those files.

## Further reading

- [MDN: `Geolocation.watchPosition()`](https://developer.mozilla.org/docs/Web/API/Geolocation/watchPosition)
- [MDN: `Geolocation.clearWatch()`](https://developer.mozilla.org/docs/Web/API/Geolocation/clearWatch)
