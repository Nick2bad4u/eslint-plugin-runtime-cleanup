# no-floating-broadcast-channels

Require `BroadcastChannel` handles to be retained so they can be closed.

> **Rule catalog ID:** R011

## Targeted pattern scope

This rule targets browser `BroadcastChannel` constructors:

- `BroadcastChannel`
- `window.BroadcastChannel`
- `self.BroadcastChannel`
- `globalThis.BroadcastChannel`

The rule reports channel instances that are immediately discarded or chained
directly into a method call other than `.close()`. In both cases there is no
remaining channel handle available for teardown.

## What this rule reports

The rule reports:

- standalone channel construction such as `new BroadcastChannel("updates");`
- voided channel construction such as `void new BroadcastChannel("updates");`
- immediate message sends such as
  `new BroadcastChannel("updates").postMessage(message);`
- immediate listener registration on a discarded channel

It intentionally does not require same-function `close()` calls. Ownership can
be transferred to a component instance, channel manager, returned value, or
longer-lived runtime owner.

## Why this rule exists

`BroadcastChannel.close()` terminates the connection to the underlying channel
and lets the browser know the channel is no longer needed. If the channel handle
is discarded, code cannot reliably call `.close()` or remove listeners during
cleanup.

## Incorrect

```ts
new BroadcastChannel("updates");
```

```ts
void new BroadcastChannel("updates");
```

```ts
new BroadcastChannel("updates").postMessage(message);
```

```ts
new BroadcastChannel("updates").addEventListener("message", onMessage);
```

## Correct

```ts
const channel = new BroadcastChannel("updates");

channel.addEventListener("message", onMessage);
channel.close();
```

```ts
return new BroadcastChannel(name);
```

```ts
registerChannel(new BroadcastChannel(name));
```

## Behavior and migration notes

Store the channel in the owner that will close it. For UI code, that is
usually the component, route, or application shell lifecycle. For shared
libraries, returning the channel or passing it to a channel manager keeps
ownership explicit.

This rule does not autofix. Choosing the owner and close point is a semantic
decision.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## When not to use it

Do not enable this rule for code that intentionally creates application-lifetime
channels and does not need explicit teardown. Prefer a narrow disable comment
with a reason when a channel is meant to live for the whole runtime.

## Further reading

- [MDN: `BroadcastChannel`](https://developer.mozilla.org/docs/Web/API/BroadcastChannel)
- [MDN: `BroadcastChannel.close()`](https://developer.mozilla.org/docs/Web/API/BroadcastChannel/close)
