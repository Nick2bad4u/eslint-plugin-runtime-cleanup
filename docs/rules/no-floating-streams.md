# no-floating-streams

Require Node.js file stream handles to be retained so they can be closed during
cleanup.

> **Rule catalog ID:** R007

## Targeted pattern scope

This rule targets Node.js file stream factories from `fs` and `node:fs`:

- `createReadStream`
- `createWriteStream`
- `fs.createReadStream`
- `fs.createWriteStream`
- `require("fs").createReadStream`
- `require("node:fs").createWriteStream`

The rule reports only immediately discarded stream factory calls. It does not
report assigned, returned, manager-owned, or immediately piped streams.

## What this rule reports

The rule reports:

- standalone file stream creation such as `createReadStream(path);`
- voided file stream creation such as `void fs.createWriteStream(path);`
- discarded CommonJS namespace or destructured factory calls

It intentionally does not require same-function `destroy()` or `end()` calls.
Streams are often owned by a pipeline, HTTP response, higher-level resource
manager, or returned API contract.

## Why this rule exists

Node.js streams can hold file descriptors and other underlying resources until
they close or are destroyed. A discarded file stream has no reachable handle for
`destroy()`, `end()`, error handling, or ownership transfer. Unlike an
immediately piped stream, a bare discarded stream is almost always accidental.

## Incorrect

```ts
import { createReadStream } from "node:fs";

createReadStream("input.txt");
```

```ts
import * as fs from "node:fs";

void fs.createWriteStream("output.txt");
```

```ts
const fs = require("fs");

fs.createReadStream("input.txt");
```

## Correct

```ts
import { createReadStream } from "node:fs";

const stream = createReadStream("input.txt");

stream.destroy();
```

```ts
import * as fs from "node:fs";

return fs.createWriteStream("output.txt");
```

```ts
import * as fs from "node:fs";

fs.createReadStream("input.txt").pipe(response);
```

```ts
registerStream(fs.createReadStream("input.txt"));
```

## Behavior and migration notes

Keep the stream handle in the same lifecycle owner that will observe errors and
close or destroy the stream. If another API owns the stream, make that
ownership explicit by returning it, passing it to a resource manager, or piping
it into the destination that owns the pipeline.

This rule is intentionally narrow. It focuses on `fs` file stream factories
because they are common, have concrete resource ownership implications, and can
be detected reliably without type information.

This rule does not autofix. Choosing whether to store, return, pipe, or destroy
the stream changes ownership semantics and must be decided by the developer.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for generated code or one-off scripts where discarded
file stream construction is intentional and process lifetime owns the cleanup.
Prefer a narrow disable comment with a reason for those cases.

## Further reading

- [Node.js: Stream](https://nodejs.org/api/stream.html)
- [Node.js: File system streams](https://nodejs.org/api/fs.html#filehandlecreatereadstreamoptions)
