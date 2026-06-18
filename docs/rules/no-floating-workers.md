# no-floating-workers

Require worker handles to be retained so they can be terminated during cleanup.

> **Rule catalog ID:** R004

## Targeted pattern scope

This rule targets worker constructors whose active thread or shared worker
connection should have an explicit lifecycle owner:

- `Worker`
- `SharedWorker`
- `window.Worker`, `self.Worker`, and `globalThis.Worker`
- `window.SharedWorker`, `self.SharedWorker`, and `globalThis.SharedWorker`
- `Worker` imported from `node:worker_threads` or `worker_threads`

The rule reports worker instances that are immediately discarded or chained
directly into a method call other than `.terminate()`. In both cases there is no
remaining worker handle available for teardown.

## What this rule reports

The rule reports:

- standalone worker construction expressions such as `new Worker("./worker.js");`
- voided worker construction such as `void new SharedWorker("./worker.js");`
- immediate worker method chains such as
  `new Worker("./worker.js").postMessage("start");`
- discarded Node.js `worker_threads` workers imported as `Worker`

It intentionally does not require same-function `terminate()` calls. Ownership
can be transferred to a component instance, resource manager, returned
disposable, `using` declaration, or longer-lived runtime owner.

## Why this rule exists

Workers run independently from the creating script. Browser `Worker` instances
can be stopped with `terminate()`, and Node.js `worker_threads.Worker`
instances expose `terminate()` and `Symbol.asyncDispose`. If the worker handle is
not retained, later cleanup cannot reliably stop the work or release the owning
runtime resource.

`SharedWorker` instances are intentionally shared across same-origin browsing
contexts, but the creating page still needs a retained handle for its port and
ownership bookkeeping. Discarding the handle makes that lifecycle implicit.

## Incorrect

```ts
new Worker("./worker.js");
```

```ts
void new SharedWorker("./shared-worker.js");
```

```ts
new Worker("./worker.js").postMessage("start");
```

```ts
import { Worker } from "node:worker_threads";

new Worker("./worker.js");
```

## Correct

```ts
const worker = new Worker("./worker.js");

worker.postMessage("start");
worker.terminate();
```

```ts
return new Worker("./worker.js");
```

```ts
registerWorker(new SharedWorker("./shared-worker.js"));
```

```ts
import { Worker } from "node:worker_threads";

await using worker = new Worker("./worker.js");
```

## Behavior and migration notes

Store worker instances in the lifecycle owner that will stop or dispose them.
For UI components, that is usually the component setup scope or a disposable
collection. For shared libraries, returning the worker or passing it to a
dedicated resource manager keeps ownership explicit.

This rule does not autofix. Choosing the owner and termination point is a
semantic decision, and inserting a variable without a matching `terminate()` or
disposal path would hide the lifecycle problem instead of fixing it.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## When not to use it

Do not enable this rule for code that intentionally creates page-lifetime or
process-lifetime workers and does not need an explicit cleanup owner. Prefer a
narrow disable comment with a reason when a worker is meant to live for the
whole runtime.

## Further reading

- [MDN: `Worker.terminate()`](https://developer.mozilla.org/docs/Web/API/Worker/terminate)
- [MDN: `SharedWorker`](https://developer.mozilla.org/docs/Web/API/SharedWorker)
- [Node.js: `worker_threads.Worker`](https://nodejs.org/api/worker_threads.html#class-worker)
