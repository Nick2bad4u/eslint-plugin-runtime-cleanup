# no-floating-wake-locks

Require `WakeLockSentinel` handles to be retained so they can be released.

> **Rule catalog ID:** R016

## Targeted pattern scope

This rule targets screen wake lock requests:

- `navigator.wakeLock.request(...)`
- `window.navigator.wakeLock.request(...)`
- `globalThis.navigator.wakeLock.request(...)`

The rule reports wake lock requests whose resulting `WakeLockSentinel` is
immediately discarded, including `await` expressions that do not store, return,
or pass the sentinel to another owner.

## What this rule reports

The rule reports:

- standalone wake lock requests such as
  `navigator.wakeLock.request("screen");`
- voided wake lock requests such as
  `void navigator.wakeLock.request("screen");`
- awaited standalone requests such as
  `await navigator.wakeLock.request("screen");`

It intentionally allows promise chains and lifecycle-manager calls that receive
the sentinel. The rule focuses on obviously unowned wake lock handles.

## Why this rule exists

`navigator.wakeLock.request()` resolves to a `WakeLockSentinel`. The sentinel is
the handle that can be released manually with `release()`, and applications
usually need to retain it to update UI, react to release events, or release the
wake lock during cleanup.

## Incorrect

```ts
navigator.wakeLock.request("screen");
```

```ts
void navigator.wakeLock.request("screen");
```

```ts
async function keepAwake() {
    await navigator.wakeLock.request("screen");
}
```

## Correct

```ts
async function keepAwake() {
    const sentinel = await navigator.wakeLock.request("screen");

    await sentinel.release();
}
```

```ts
async function keepAwake() {
    return navigator.wakeLock.request("screen");
}
```

```ts
async function keepAwake() {
    registerWakeLock(await navigator.wakeLock.request("screen"));
}
```

## Behavior and migration notes

Store the sentinel in the owner that will call `release()`. For UI code, that is
usually a component, route, or media/session controller. Applications should
also consider listening for the sentinel's `release` event because user agents
can release wake locks automatically.

This rule does not autofix. Choosing the owning lifecycle and release behavior
is a semantic decision.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for code where wake lock ownership is intentionally
hidden inside an abstraction that the rule cannot see. Prefer wrapping
`navigator.wakeLock.request()` in that abstraction and disabling the rule only
inside the wrapper if needed.

## Further reading

- [MDN: Screen Wake Lock API](https://developer.mozilla.org/docs/Web/API/Screen_Wake_Lock_API)
- [MDN: `WakeLockSentinel`](https://developer.mozilla.org/docs/Web/API/WakeLockSentinel)
- [MDN: `WakeLockSentinel.release()`](https://developer.mozilla.org/docs/Web/API/WakeLockSentinel/release)
