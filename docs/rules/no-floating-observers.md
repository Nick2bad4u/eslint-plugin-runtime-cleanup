# no-floating-observers

Require observer instances to be retained so they can be disconnected during
cleanup.

> **Rule catalog ID:** R003

## Targeted pattern scope

This rule targets native observer constructors whose active observation must be
stopped with `disconnect()`:

- `IntersectionObserver`
- `MutationObserver`
- `PerformanceObserver`
- `ReportingObserver`
- `ResizeObserver`

The rule reports observer instances that are immediately discarded or chained
directly into `.observe(...)`. In both cases there is no remaining observer
handle available for teardown.

## What this rule reports

The rule reports:

- standalone observer construction expressions such as
  `new ResizeObserver(callback);`
- voided observer construction such as
  `void new MutationObserver(callback);`
- immediate observation chains such as
  `new IntersectionObserver(callback).observe(element);`

It intentionally does not require same-function `disconnect()` calls. That is a
separate ownership question, and many valid designs transfer observer ownership
to a manager, component instance, returned disposable, or framework lifecycle.

## Why this rule exists

Observer APIs hold callbacks and continue delivering records until disconnected.
If the observer instance is not retained, later cleanup cannot call
`disconnect()`, and the code has no explicit ownership point for the active
runtime resource.

## Incorrect

```ts
new ResizeObserver(handleResize);
```

```ts
void new MutationObserver(handleMutations);
```

```ts
new IntersectionObserver(handleIntersections).observe(element);
```

## Correct

```ts
const observer = new ResizeObserver(handleResize);

observer.observe(element);
observer.disconnect();
```

```ts
return new MutationObserver(handleMutations);
```

```ts
registerObserver(new IntersectionObserver(handleIntersections));
```

## Behavior and migration notes

Store observer instances in the same lifecycle owner that will disconnect them.
For components, that is usually the component setup scope or an owned disposable
collection. For shared utilities, returning the observer or passing it to a
dedicated resource manager is acceptable because ownership is explicit.

This rule does not autofix. Choosing the right owner and cleanup point is a
semantic decision, and inserting a variable without a matching `disconnect()`
would only make the leak less obvious.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for code that intentionally creates page-lifetime or
process-lifetime observers without later cleanup. Prefer a narrow disable
comment with a reason when an observer is meant to live for the whole runtime.

## Further reading

- [MDN: `IntersectionObserver`](https://developer.mozilla.org/docs/Web/API/IntersectionObserver)
- [MDN: `MutationObserver`](https://developer.mozilla.org/docs/Web/API/MutationObserver)
- [MDN: `PerformanceObserver`](https://developer.mozilla.org/docs/Web/API/PerformanceObserver)
- [MDN: `ResizeObserver`](https://developer.mozilla.org/docs/Web/API/ResizeObserver)
