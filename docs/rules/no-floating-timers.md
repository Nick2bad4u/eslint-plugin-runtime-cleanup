# no-floating-timers

Require timer handles to be retained so they can be cleared during cleanup.

> **Rule catalog ID:** R001

## Targeted pattern scope

This rule targets timer APIs that return handles with an explicit cleanup
counterpart. It is intentionally conservative: the rule reports only calls where
the returned handle is immediately discarded.

### Matched patterns

The rule checks direct global calls to:

- `setTimeout`
- `setInterval`
- `setImmediate`
- `requestAnimationFrame`
- `requestIdleCallback`

It also checks the same methods when called through these global receivers:

- `globalThis`
- `window`
- `self`
- `global`

### Detection boundaries

The rule does not prove that every retained handle is cleared. That broader
lifetime analysis needs separate rules that understand cleanup blocks, effect
callbacks, disposal protocols, and framework lifecycle APIs.

The rule also skips locally declared or imported direct timer identifiers, so a
project-local helper named `setTimeout` is not treated as the platform timer API.

## What this rule reports

The rule reports timer calls when the returned handle is used only as a bare
expression or deliberately discarded with `void`.

## Why this rule exists

Floating timer handles make cleanup impossible. Intervals keep running, timeouts
can fire after teardown, animation callbacks can touch detached state, and idle
callbacks can outlive the component or request that scheduled them. Retaining
the handle is the first enforceable step toward calling the matching cleanup API
from the correct lifecycle boundary.

## ❌ Incorrect

```ts
setInterval(poll, 1000);
```

```ts
globalThis.setTimeout(flush, 250);
```

```ts
void window.requestAnimationFrame(render);
```

## ✅ Correct

```ts
const intervalId = setInterval(poll, 1000);

clearInterval(intervalId);
```

```ts
const timeoutId = globalThis.setTimeout(flush, 250);

clearTimeout(timeoutId);
```

```ts
return window.requestAnimationFrame(render);
```

```ts
timerRegistry.add(setTimeout(flush, 250));
```

## Behavior and migration notes

Start by storing each reported handle in a variable, returning it to the caller,
or passing it to an existing timer registry. Then clear the handle from the
nearest lifecycle cleanup path, such as a `finally` block, component cleanup
callback, request teardown hook, or disposable object.

This rule does not autofix because choosing the correct cleanup location is a
semantic decision. A mechanical fix that only introduces a variable would still
leave the resource alive.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for files that intentionally schedule process-lifetime
timers and have no teardown path. Prefer a narrow ESLint disable comment at the
call site with a reason when that pattern is deliberate.

## Further reading

- [MDN: `setTimeout`](https://developer.mozilla.org/docs/Web/API/Window/setTimeout)
- [MDN: `clearTimeout`](https://developer.mozilla.org/docs/Web/API/Window/clearTimeout)
- [MDN: `requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/Window/requestAnimationFrame)
- [Node.js timers](https://nodejs.org/api/timers.html)
