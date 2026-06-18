# no-floating-child-processes

Require child process handles to be retained so they can be killed during
cleanup.

> **Rule catalog ID:** R005

## Targeted pattern scope

This rule targets asynchronous Node.js child process factories whose returned
handle is needed for cleanup:

- `spawn`
- `exec`
- `execFile`
- `fork`

The rule recognizes those factories when they come from `node:child_process` or
`child_process` through named imports, default or namespace imports, CommonJS
`require(...)` module bindings, destructured `require(...)`, or direct
`require("node:child_process").spawn(...)` calls.

The rule reports child process handles that are immediately discarded or chained
directly into a method call other than `.kill()` or `.disconnect()`.

## What this rule reports

The rule reports:

- standalone child process calls such as `spawn("node", ["worker.js"]);`
- voided child process calls such as `void childProcess.exec("node worker.js");`
- immediate method chains such as
  `childProcess.fork("./worker.js").on("exit", handleExit);`
- inline require calls such as
  `require("node:child_process").spawn("node", ["worker.js"]);`

It intentionally does not require same-function `kill()` calls. Ownership can be
transferred to a supervisor, returned handle, disposable collection, or
process-lifetime owner.

## Why this rule exists

Asynchronous child process factories return a `ChildProcess` handle. That handle
is the API surface for terminating the process, disconnecting IPC, inspecting
exit state, and wiring teardown. Discarding it leaves no explicit owner that can
clean up the subprocess when the surrounding runtime scope ends.

## Incorrect

```ts
import { spawn } from "node:child_process";

spawn("node", ["worker.js"]);
```

```ts
import childProcess from "node:child_process";

void childProcess.exec("node worker.js");
```

```ts
import * as childProcess from "child_process";

childProcess.fork("./worker.js").on("exit", handleExit);
```

```ts
require("node:child_process").spawn("node", ["worker.js"]);
```

## Correct

```ts
import { spawn } from "node:child_process";

const child = spawn("node", ["worker.js"]);

child.kill();
```

```ts
import { fork } from "node:child_process";

return fork("./worker.js");
```

```ts
import childProcess from "node:child_process";

registerChildProcess(childProcess.spawn("node", ["worker.js"]));
```

## Behavior and migration notes

Store the `ChildProcess` handle in the owner that will terminate or supervise
the subprocess. For test helpers and task runners, that is usually a local
cleanup scope. For long-running services, it can be a process supervisor or
resource registry.

This rule does not autofix. Inserting a variable without a real shutdown path
would only make ownership look explicit while preserving the leak.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## When not to use it

Do not enable this rule for scripts that intentionally start detached,
process-lifetime children and do not own their cleanup. Prefer a narrow disable
comment with a reason for those launch points.

## Further reading

- [Node.js: asynchronous process creation](https://nodejs.org/api/child_process.html#asynchronous-process-creation)
- [Node.js: `subprocess.kill()`](https://nodejs.org/api/child_process.html#subprocesskillsignal)
