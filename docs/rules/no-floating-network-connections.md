# no-floating-network-connections

Require browser network connection handles to be retained so they can be
closed.

> **Rule catalog ID:** R009

## Targeted pattern scope

This rule targets browser connection constructors with explicit `.close()`
lifecycle APIs:

- `WebSocket`
- `EventSource`
- `window.WebSocket`, `self.WebSocket`, and `globalThis.WebSocket`
- `window.EventSource`, `self.EventSource`, and `globalThis.EventSource`

The rule reports connection instances that are immediately discarded or chained
directly into a method call other than `.close()`. In both cases there is no
remaining connection handle available for teardown.

## What this rule reports

The rule reports:

- standalone connection construction such as `new WebSocket(url);`
- voided connection construction such as `void new EventSource(url);`
- immediate send or listener chains such as `new WebSocket(url).send(message);`
- immediate `EventSource` listener registration on a discarded instance

It intentionally does not require same-function `close()` calls. Ownership can
be transferred to a component instance, connection manager, returned value, or
longer-lived runtime owner.

## Why this rule exists

`WebSocket` and `EventSource` create long-lived network connections. If the
handle is not retained, code cannot reliably call `.close()`, remove listeners,
or coordinate reconnect and shutdown behavior. Discarding the handle makes the
connection lifecycle implicit and usually leaks work until the page or runtime
exits.

## Incorrect

```ts
new WebSocket("wss://example.com/socket");
```

```ts
void new EventSource("/events");
```

```ts
new WebSocket(url).send("hello");
```

```ts
new EventSource("/events").addEventListener("message", onMessage);
```

## Correct

```ts
const socket = new WebSocket("wss://example.com/socket");

socket.addEventListener("message", onMessage);
socket.close();
```

```ts
const source = new EventSource("/events");

source.addEventListener("message", onMessage);
source.close();
```

```ts
return new WebSocket(url);
```

```ts
registerConnection(new EventSource(url));
```

## Behavior and migration notes

Store the connection handle in the owner that will close it. For UI code, that
is usually the component or route lifecycle. For shared libraries, returning
the connection or passing it to a connection manager makes the ownership
contract explicit.

This rule does not autofix. Introducing a variable without a matching close
path would hide the lifecycle problem instead of solving it.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for code that intentionally creates page-lifetime
connections and does not need explicit teardown. Prefer a narrow disable
comment with a reason when a connection is meant to live for the whole runtime.

## Further reading

- [MDN: `WebSocket`](https://developer.mozilla.org/docs/Web/API/WebSocket)
- [MDN: `WebSocket.close()`](https://developer.mozilla.org/docs/Web/API/WebSocket/close)
- [MDN: `EventSource`](https://developer.mozilla.org/docs/Web/API/EventSource)
- [MDN: `EventSource.close()`](https://developer.mozilla.org/docs/Web/API/EventSource/close)
