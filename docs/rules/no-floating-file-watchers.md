# no-floating-file-watchers

Require Node.js file watcher handles to be retained so they can be closed.

> **Rule catalog ID:** R010

## Targeted pattern scope

This rule targets Node.js `fs.watch()` calls from `fs` and `node:fs`:

- `watch`
- `fs.watch`
- `require("fs").watch`
- `require("node:fs").watch`

The rule reports watcher handles that are immediately discarded or chained
directly into a method call other than `.close()`. It does not target
`node:fs/promises` async iterator watchers because those use different
ownership and cancellation patterns.

## What this rule reports

The rule reports:

- standalone watcher creation such as `watch("src", onChange);`
- voided watcher creation such as `void fs.watch("src", onChange);`
- discarded CommonJS namespace or destructured `watch` calls
- immediate event registration on an unowned watcher such as
  `fs.watch("src").on("error", onError);`

It intentionally does not require same-function `close()` calls. Watcher
ownership can be transferred by returning the watcher or passing it to a
dedicated lifecycle manager.

## Why this rule exists

`fs.watch()` returns an `FSWatcher`. Active watchers can keep the Node.js event
loop alive and continue receiving file-system events until they are closed. If
the watcher handle is discarded, later cleanup cannot reliably call `.close()`
or coordinate shutdown behavior.

## Incorrect

```ts
import { watch } from "node:fs";

watch("src", onChange);
```

```ts
import * as fs from "node:fs";

void fs.watch("src", onChange);
```

```ts
import * as fs from "node:fs";

fs.watch("src", onChange).on("error", onError);
```

## Correct

```ts
import { watch } from "node:fs";

const watcher = watch("src", onChange);

watcher.close();
```

```ts
import * as fs from "node:fs";

return fs.watch("src", onChange);
```

```ts
registerWatcher(fs.watch("src", onChange));
```

## Behavior and migration notes

Keep the watcher handle in the owner that will close it during teardown. For
development tools, that is usually the process-level watcher manager. For
library code, returning the watcher or passing it to a lifecycle manager makes
the ownership contract explicit.

This rule does not autofix. Introducing a variable without a matching close
path would hide the lifecycle problem instead of fixing it.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [runtimeCleanup.configs.recommended];
```

## When not to use it

Do not enable this rule for scripts where a watcher intentionally lives until
process exit and no explicit shutdown path is needed. Prefer a narrow disable
comment with a reason for those cases.

## Further reading

- [Node.js: `fs.watch()`](https://nodejs.org/api/fs.html#fswatchfilename-options-listener)
- [Node.js: `FSWatcher.close()`](https://nodejs.org/api/fs.html#watcherclose)
