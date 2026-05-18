# no-floating-web-stream-locks

Require Web Stream readers and writers to be retained so their locks can be
released.

> **Rule catalog ID:** R019

## Targeted pattern scope

This type-aware rule targets lock-producing Web Streams methods:

- `ReadableStream#getReader()`
- `WritableStream#getWriter()`

The rule uses TypeScript parser services to confirm that the receiver is a Web
`ReadableStream` or `WritableStream`. That avoids flagging project-local
objects that happen to expose methods named `getReader()` or `getWriter()`.

## What this rule reports

The rule reports:

- discarded stream readers
- discarded stream writers
- immediately chained reader or writer use where the reader/writer handle is
  lost

Immediate `releaseLock()` calls are allowed. The rule focuses on cases where the
lock owner is unavailable to cleanup code.

## Why this rule exists

`getReader()` and `getWriter()` lock the stream to the returned reader or writer.
The lock should be released with `releaseLock()` when the owner is done with the
stream. If the reader or writer is discarded, later cleanup code cannot release
that lock.

## Incorrect

```ts
new ReadableStream<Uint8Array>().getReader();
```

```ts
stream.getReader().read();
```

```ts
stream.getWriter().write(chunk);
```

## Correct

```ts
const reader = stream.getReader();

try {
    await reader.read();
} finally {
    reader.releaseLock();
}
```

```ts
function createReader(stream: ReadableStream<Uint8Array>) {
    return stream.getReader();
}
```

```ts
streamReaderRegistry.add(stream.getReader());
```

## Behavior and migration notes

This rule is type-aware and requires parser services. Enable it through a
type-checked preset or configure `parserOptions.projectService` yourself.

This rule does not autofix. Rewriting `stream.getReader().read()` into a
retained reader requires a surrounding `try`/`finally` cleanup shape, which is
too context-dependent for a safe automatic fix.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs["recommended-type-checked"],
];
```

## When not to use it

Do not enable this rule in JavaScript-only projects without TypeScript parser
services. For code that intentionally locks a stream for the entire process
lifetime, use a narrow disable comment and document that ownership boundary.

## Further reading

- [MDN: `ReadableStream.getReader()`](https://developer.mozilla.org/docs/Web/API/ReadableStream/getReader)
- [MDN: `ReadableStreamDefaultReader.releaseLock()`](https://developer.mozilla.org/docs/Web/API/ReadableStreamDefaultReader/releaseLock)
- [MDN: `WritableStream.getWriter()`](https://developer.mozilla.org/docs/Web/API/WritableStream/getWriter)
- [MDN: `WritableStreamDefaultWriter.releaseLock()`](https://developer.mozilla.org/docs/Web/API/WritableStreamDefaultWriter/releaseLock)
