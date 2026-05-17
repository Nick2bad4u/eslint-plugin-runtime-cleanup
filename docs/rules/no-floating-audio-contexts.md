# no-floating-audio-contexts

Require `AudioContext` instances to be retained so they can be closed.

> **Rule catalog ID:** R018

## Targeted pattern scope

This rule targets browser audio context construction:

- `new AudioContext(...)`
- `new webkitAudioContext(...)`
- `new window.AudioContext(...)`
- `new globalThis.AudioContext(...)`

The rule reports contexts that are immediately discarded, explicitly voided, or
used through an immediate non-cleanup method call such as
`new AudioContext().resume()`. It ignores locally shadowed direct constructor
bindings so project-local classes with the same name are not treated as browser
audio contexts.

## What this rule reports

The rule reports:

- standalone `new AudioContext()` expressions
- `void new AudioContext()`
- immediate non-cleanup use of an unowned context

Immediate `close()` calls are allowed because they do not leave an owned context
behind.

## Why this rule exists

`AudioContext` can hold audio hardware, decoding, graph, and scheduling
resources. `AudioContext.close()` releases system audio resources used by the
context. If the context is discarded, cleanup code cannot close it.

## Incorrect

```ts
new AudioContext();
```

```ts
void new window.AudioContext();
```

```ts
new AudioContext().resume();
```

## Correct

```ts
const context = new AudioContext();

try {
    await context.resume();
} finally {
    await context.close();
}
```

```ts
function createAudioContext() {
    return new AudioContext();
}
```

```ts
audioContextRegistry.add(new AudioContext());
```

## Behavior and migration notes

Store the context in the audio session, component, game engine, visualizer, or
test fixture that owns the audio graph. That owner should call `close()` during
cleanup.

This rule does not autofix because adding a variable without a matching
`close()` path would not fix the resource lifecycle.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for tiny one-page demos where the browser page lifetime
is intentionally the cleanup boundary. Use narrow inline disables for those
examples.

## Further reading

- [MDN: `AudioContext`](https://developer.mozilla.org/docs/Web/API/AudioContext)
- [MDN: `AudioContext.close()`](https://developer.mozilla.org/docs/Web/API/AudioContext/close)

