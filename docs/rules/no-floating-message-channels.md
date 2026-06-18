# no-floating-message-channels

Require `MessageChannel` ports to be retained so they can be closed.

> **Rule catalog ID:** R012

## Targeted pattern scope

This rule targets browser `MessageChannel` constructors:

- `MessageChannel`
- `window.MessageChannel`
- `self.MessageChannel`
- `globalThis.MessageChannel`

The rule reports channel instances that are immediately discarded or whose
`port1`/`port2` properties are accessed directly from the temporary channel
object. Keeping only one inline port loses the peer port and makes full
teardown ambiguous.

## What this rule reports

The rule reports:

- standalone channel construction such as `new MessageChannel();`
- voided channel construction such as `void new MessageChannel();`
- immediate port sends such as `new MessageChannel().port1.postMessage(message);`
- retaining a single inline port such as `const port = new MessageChannel().port1;`

It intentionally does not require same-function `close()` calls. Ownership can
be transferred to a component instance, channel manager, returned value, or both
destructured `MessagePort` handles.

## Why this rule exists

`MessageChannel` creates two linked `MessagePort` handles. `MessagePort.close()`
disconnects a port so it is no longer active. If the channel object is discarded
or only one port is retained from an inline expression, code cannot reliably
close both sides of the channel during cleanup.

## Incorrect

```ts
new MessageChannel();
```

```ts
void new MessageChannel();
```

```ts
new MessageChannel().port1.postMessage(message);
```

```ts
const port = new MessageChannel().port2;
```

## Correct

```ts
const channel = new MessageChannel();

channel.port1.addEventListener("message", onMessage);
channel.port1.close();
channel.port2.close();
```

```ts
const { port1, port2 } = new MessageChannel();

port1.postMessage(message);
port1.close();
port2.close();
```

```ts
return new MessageChannel();
```

```ts
registerChannel(new MessageChannel());
```

## Behavior and migration notes

Store either the `MessageChannel` object or both `MessagePort` handles in the
owner that will close them. For UI code, that owner is usually a component,
worker bridge, route lifecycle, or application-level channel manager.

This rule does not autofix. Introducing a variable without selecting the owner
and teardown point would hide the lifecycle problem instead of solving it.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## When not to use it

Do not enable this rule for code that intentionally creates runtime-lifetime
message ports and does not need explicit teardown. Prefer a narrow disable
comment with a reason when a channel is meant to live for the whole runtime.

## Further reading

- [MDN: `MessageChannel`](https://developer.mozilla.org/docs/Web/API/MessageChannel)
- [MDN: `MessagePort`](https://developer.mozilla.org/docs/Web/API/MessagePort)
- [MDN: `MessagePort.close()`](https://developer.mozilla.org/docs/Web/API/MessagePort/close)
