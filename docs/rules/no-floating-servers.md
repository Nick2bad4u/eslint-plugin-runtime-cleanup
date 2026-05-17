# no-floating-servers

Require Node.js server handles to be retained so they can be closed.

> **Rule catalog ID:** R013

## Targeted pattern scope

This rule targets server factory calls from Node.js core networking modules:

- `http.createServer`
- `https.createServer`
- `http2.createServer`
- `http2.createSecureServer`
- `net.createServer`
- equivalent named imports, namespace imports, default imports, destructured
  `require(...)` calls, and inline `require(...).createServer(...)` calls

The rule reports server handles that are immediately discarded, including
discarded `.listen(...)` chains. It does not require type information because
the recognized factories are tied to import and `require` sources.

## What this rule reports

The rule reports:

- standalone server creation such as `createServer(handler);`
- voided server creation such as `void http.createServer(handler);`
- discarded listen chains such as `http.createServer(handler).listen(3000);`
- discarded method chains that start from an unretained server handle

It intentionally does not require same-function `close()` calls. Ownership can
be transferred to a framework adapter, test harness, returned value, or shutdown
manager.

## Why this rule exists

Node.js server factories create long-lived handles that can keep the process
alive and hold open ports. Once a server is listening, retaining the `Server`
object is the normal way to call `.close()`, coordinate graceful shutdown, and
stop accepting new work.

## Incorrect

```ts
import { createServer } from "node:http";

createServer(handler);
```

```ts
import http from "node:http";

http.createServer(handler).listen(3000);
```

```ts
const http2 = require("http2");

http2.createSecureServer(options, handler).listen(8443);
```

## Correct

```ts
import { createServer } from "node:http";

const server = createServer(handler);

server.listen(3000);
server.close();
```

```ts
import * as http from "node:http";

const server = http.createServer(handler).listen(3000);

server.close();
```

```ts
return createServer(handler).listen(3000);
```

```ts
registerServer(createServer(handler).listen(3000));
```

## Behavior and migration notes

Store the returned server handle in the owner that will shut it down. In
applications, that is usually the process lifecycle or graceful-shutdown
coordinator. In tests, it is usually the test fixture cleanup hook.

This rule allows immediate `.close()` calls and returned or passed server
handles. It reports discarded `.listen(...)` chains because `listen()` returns
the server object; discarding that returned handle makes later shutdown
coordination difficult.

This rule does not autofix. Choosing whether the owner is a module variable,
dependency-injected lifecycle manager, framework adapter, or test fixture is a
semantic decision.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for tiny one-off scripts where the server is
intentionally process-lifetime and never needs graceful shutdown. Prefer a
narrow disable comment with a reason in those files rather than weakening the
rule globally.

## Further reading

- [Node.js: `http.createServer()`](https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener)
- [Node.js: `server.close()`](https://nodejs.org/api/http.html#serverclosecallback)
- [Node.js: `net.createServer()`](https://nodejs.org/api/net.html#netcreateserveroptions-connectionlistener)
- [Node.js: `net.Server.close()`](https://nodejs.org/api/net.html#serverclosecallback)
