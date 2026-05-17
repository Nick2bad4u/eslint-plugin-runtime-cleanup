# no-floating-disposable-stacks

Require `DisposableStack` handles to be retained so registered disposers run.

> **Rule catalog ID:** R008

## Targeted pattern scope

This rule targets the standard explicit resource-management stack
constructors:

- `DisposableStack`
- `AsyncDisposableStack`
- `globalThis.DisposableStack`, `window.DisposableStack`, and
  `self.DisposableStack`
- `globalThis.AsyncDisposableStack`, `window.AsyncDisposableStack`, and
  `self.AsyncDisposableStack`

The rule reports disposable stack instances that are immediately discarded or
chained directly into a method call other than `.dispose()` or
`.disposeAsync()`. In both cases there is no remaining stack handle available to
dispose registered resources.

## What this rule reports

The rule reports:

- standalone stack construction such as `new DisposableStack();`
- voided stack construction such as `void new AsyncDisposableStack();`
- immediate registration calls such as `new DisposableStack().defer(cleanup);`
- immediate async registration calls such as
  `new AsyncDisposableStack().use(resource);`

It intentionally does not require same-function disposal for retained stacks.
Ownership can be handled by a `using` or `await using` declaration, a returned
stack, or a dedicated lifecycle manager.

## Why this rule exists

`DisposableStack` and `AsyncDisposableStack` are ownership containers. They only
provide cleanup if the stack itself is retained and later disposed. Discarding
the stack after registering work silently drops the only object that can run the
registered disposers.

## Incorrect

```ts
new DisposableStack();
```

```ts
void new AsyncDisposableStack();
```

```ts
new DisposableStack().defer(cleanup);
```

```ts
new AsyncDisposableStack().use(resource);
```

## Correct

```ts
using stack = new DisposableStack();

stack.defer(cleanup);
```

```ts
await using stack = new AsyncDisposableStack();

stack.use(resource);
```

```ts
return new DisposableStack();
```

```ts
registerDisposableStack(new AsyncDisposableStack());
```

## Behavior and migration notes

Keep the stack in the same lifecycle owner that will dispose it. Prefer
`using` for synchronous stacks and `await using` for asynchronous stacks when
the current runtime and compiler settings support explicit resource
management. If a framework or library owns disposal, pass the stack directly to
that owner.

This rule does not autofix. Choosing between `using`, `await using`, returning
the stack, or wiring a lifecycle manager changes ownership semantics and must
be decided by the developer.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for generated code or compatibility layers that
intentionally construct disposable stack shims for feature detection. Prefer a
narrow disable comment with a reason for those cases.

## Further reading

- [MDN: JavaScript resource management](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Resource_management)
- [MDN: `DisposableStack`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DisposableStack)
- [MDN: `AsyncDisposableStack`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/AsyncDisposableStack)
- [TypeScript 5.2: Explicit Resource Management](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html)
