# no-floating-infinite-animations

Require infinite Web Animations to be retained so they can be canceled.

> **Rule catalog ID:** R020

## Targeted pattern scope

This type-aware rule targets `Element#animate(...)` calls whose timing options
explicitly use infinite iterations:

- `{ iterations: Infinity }`
- `{ iterations: +Infinity }`
- `{ iterations: Number.POSITIVE_INFINITY }`
- `{ iterations: globalThis.Number.POSITIVE_INFINITY }`

The rule uses TypeScript parser services to confirm that the receiver is a DOM
`Element`. That keeps project-local `animate(...)` methods out of scope.

## What this rule reports

The rule reports infinite animations when the returned `Animation` is discarded
or immediately used through a non-cleanup member:

- standalone infinite `element.animate(...)` calls
- immediate chains such as `element.animate(...).play()`

Finite one-shot animations are intentionally allowed. Fire-and-forget finite
animations are common and do not have the same long-running cleanup risk.
Immediate `cancel()` and `finish()` calls are allowed.

## Why this rule exists

`Element#animate()` returns an `Animation` object. Infinite animations continue
until canceled, finished, the effect is removed, or the document lifecycle ends.
If the returned `Animation` is discarded, component or route cleanup code cannot
reliably stop it.

## Incorrect

```ts
element.animate(keyframes, {
    duration: 1000,
    iterations: Infinity,
});
```

```ts
element.animate(keyframes, {
    iterations: Number.POSITIVE_INFINITY,
}).play();
```

## Correct

```ts
const animation = element.animate(keyframes, {
    duration: 1000,
    iterations: Infinity,
});

cleanupCallbacks.add(() => animation.cancel());
```

```ts
function startPulse(element: Element) {
    return element.animate(keyframes, {
        duration: 1000,
        iterations: Infinity,
    });
}
```

```ts
element.animate(keyframes, {
    iterations: 1,
});
```

## Behavior and migration notes

This rule is deliberately narrower than a general `Element#animate()` rule. It
only targets explicitly infinite animations because one-shot animations are often
safe to let complete naturally.

This rule does not autofix. A safe fix needs to choose the correct lifecycle
owner and cancellation point.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs["recommended-type-checked"],
];
```

## When not to use it

Do not enable this rule without TypeScript parser services. For intentionally
page-lifetime infinite decorative animations, use a narrow disable comment near
the animation start.

## Further reading

- [MDN: `Element.animate()`](https://developer.mozilla.org/docs/Web/API/Element/animate)
- [MDN: `Animation.cancel()`](https://developer.mozilla.org/docs/Web/API/Animation/cancel)
- [MDN: `Animation.finish()`](https://developer.mozilla.org/docs/Web/API/Animation/finish)

