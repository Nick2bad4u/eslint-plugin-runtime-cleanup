# no-unmanaged-event-listeners

Require event listeners to have an abort signal or a matching cleanup call.

> **Rule catalog ID:** R002

## Targeted pattern scope

This rule targets `EventTarget#addEventListener(...)` calls where the listener
registration has no visible cleanup path.

The rule accepts two cleanup models:

- passing an options object with a `signal` property, so an `AbortController`
  owns listener teardown;
- or calling `removeEventListener(...)` with the same target, event type,
  listener, and capture mode in the same function or program boundary.

## What this rule reports

The rule reports `addEventListener(...)` calls when both of these are true:

- the third argument does not resolve to an object with a `signal` property;
- and no matching `removeEventListener(...)` call exists in the same lexical
  boundary.

The same-boundary requirement is intentional. Cleanup in a different function is
often real, but matching cross-function ownership without framework knowledge is
too noisy for a syntax-only rule.

## Capture matching

`removeEventListener(...)` only removes the original listener when the capture
mode matches. This rule tracks the common capture forms:

- no options argument, which is treated as `false`;
- boolean options such as `true`;
- object options such as `{ capture: true }`.

Opaque option values are only considered a match when the same option expression
is passed to both calls.

## Why this rule exists

Listeners keep callbacks and their captured state alive. In browser code, that
can retain component state after unmount. In long-lived services, repeated
registration without teardown creates duplicate work and memory leaks.

An abort signal is usually the clearest ownership model for modern event
targets. A matching `removeEventListener(...)` call is still valid when the
lifecycle boundary is small and obvious.

## Incorrect

```ts
button.addEventListener("click", handleClick);
```

```ts
window.addEventListener("resize", () => layout());
```

```ts
target.addEventListener("scroll", onScroll, true);
target.removeEventListener("scroll", onScroll, false);
```

```ts
function setup() {
 window.addEventListener("resize", onResize);
}

function cleanup() {
 window.removeEventListener("resize", onResize);
}
```

## Correct

```ts
const controller = new AbortController();

button.addEventListener("click", handleClick, {
 signal: controller.signal,
});

controller.abort();
```

```ts
button.addEventListener("click", handleClick);
button.removeEventListener("click", handleClick);
```

```ts
target.addEventListener("scroll", onScroll, { capture: true });
target.removeEventListener("scroll", onScroll, { capture: true });
```

```ts
function setup() {
 window.addEventListener("resize", onResize);

 return () => {
  window.removeEventListener("resize", onResize);
 };
}
```

## Behavior and migration notes

Prefer an `AbortController` when listener ownership belongs to a component,
request, disposable object, or other lifecycle boundary that may later own
multiple resources.

Use `removeEventListener(...)` when the add/remove pair is intentionally local
and the same callback reference is available. Inline callbacks without a signal
are reported because there is no stable callback reference to remove later.

This rule does not autofix because choosing the right cleanup lifetime is a
semantic decision.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## When not to use it

Do not enable this rule for code that intentionally registers process-lifetime
or page-lifetime listeners. Prefer a narrow disable comment with a reason when
the listener is meant to live for the whole runtime.

## Further reading

- [MDN: `addEventListener`](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)
- [MDN: `removeEventListener`](https://developer.mozilla.org/docs/Web/API/EventTarget/removeEventListener)
- [MDN: `AbortController`](https://developer.mozilla.org/docs/Web/API/AbortController)
