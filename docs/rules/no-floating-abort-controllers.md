# no-floating-abort-controllers

Require `AbortController` handles to be retained so work can be aborted during
cleanup.

> **Rule catalog ID:** R006

## Targeted pattern scope

This rule targets `AbortController` construction where the controller handle is
lost before the owning lifecycle can call `abort()`:

- `new AbortController()`
- `new window.AbortController()`
- `new self.AbortController()`
- `new globalThis.AbortController()`
- `new AbortController().signal`

The rule reports controllers that are immediately discarded and inline
`.signal` handoffs that keep only the signal. A signal can observe cancellation,
but it cannot initiate cancellation; the controller is the cleanup handle.

## What this rule reports

The rule reports:

- standalone controller construction such as `new AbortController();`
- voided controller construction such as `void new AbortController();`
- inline signal-only ownership such as
  `fetch(url, { signal: new AbortController().signal })`
- assignments that keep only `new AbortController().signal`

It intentionally does not require a same-function `abort()` call. Ownership can
be transferred to a component instance, request manager, disposable collection,
returned object, or another lifecycle owner.

## Why this rule exists

`AbortController` is the cancellation handle for an `AbortSignal`. APIs such as
`fetch()` and `addEventListener()` accept a signal, and calling
`AbortController.abort()` later cancels or removes the associated work. If code
passes only `new AbortController().signal`, no reachable owner remains that can
abort the work during cleanup.

## Incorrect

```ts
new AbortController();
```

```ts
void new AbortController();
```

```ts
fetch("/api", {
 signal: new AbortController().signal,
});
```

```ts
const signal = new AbortController().signal;
```

## Correct

```ts
const controller = new AbortController();

fetch("/api", {
 signal: controller.signal,
});

controller.abort();
```

```ts
return new AbortController();
```

```ts
registerAbortController(new AbortController());
```

```ts
using controller = createAbortControllerDisposable();
```

## Behavior and migration notes

Store the controller in the same owner that is responsible for cancelling the
work. In UI code, that is usually the component setup scope or a cleanup
callback. In service code, it may be a request context, operation manager, or
explicit disposable.

When a controller is intentionally owned elsewhere, pass the controller itself
to that owner instead of passing only the signal. A signal-only API boundary is
appropriate for consumers that should observe cancellation but should not be
able to cancel the operation.

This rule does not autofix. Introducing a new controller variable without
placing the matching `abort()` call in the correct lifecycle path would make the
code look managed without actually solving cleanup.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## When not to use it

Do not enable this rule for code that intentionally creates page-lifetime or
process-lifetime cancellation signals and never expects to abort them. Prefer a
narrow disable comment with a reason when the lifecycle is intentionally owned
by the whole runtime.

## Further reading

- [MDN: `AbortController`](https://developer.mozilla.org/docs/Web/API/AbortController)
- [MDN: `AbortSignal`](https://developer.mozilla.org/docs/Web/API/AbortSignal)
- [MDN: `addEventListener()` signal option](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)
