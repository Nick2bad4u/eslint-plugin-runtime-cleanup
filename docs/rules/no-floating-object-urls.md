# no-floating-object-urls

Require object URLs to be retained so they can be revoked.

> **Rule catalog ID:** R017

## Targeted pattern scope

This rule targets browser object URL creation APIs:

- `URL.createObjectURL(...)`
- `globalThis.URL.createObjectURL(...)`
- `window.URL.createObjectURL(...)`
- `self.URL.createObjectURL(...)`

The rule reports object URLs that are immediately discarded or explicitly
voided. It ignores locally shadowed `URL` bindings so project-local helpers with
the same name are not treated as the platform API.

## What this rule reports

The rule reports:

- standalone `URL.createObjectURL(...)` calls
- `void URL.createObjectURL(...)`
- static computed global forms such as:

  ```ts
  window["URL"]["createObjectURL"](blob);
  ```

The rule intentionally allows object URLs that are stored, returned, or passed to
a lifecycle manager. It does not try to prove that every retained URL is later
revoked.

## Why this rule exists

`URL.createObjectURL()` creates a URL that keeps the backing `Blob`, `File`, or
media source reachable until the URL is revoked. Discarding the returned string
means cleanup code cannot call `URL.revokeObjectURL()` for that object URL.

## Incorrect

```ts
URL.createObjectURL(blob);
```

```ts
void window.URL.createObjectURL(file);
```

## Correct

```ts
const objectUrl = URL.createObjectURL(blob);

try {
    image.src = objectUrl;
} finally {
    URL.revokeObjectURL(objectUrl);
}
```

```ts
function createDownloadUrl(file: File) {
    return URL.createObjectURL(file);
}
```

```ts
objectUrlRegistry.add(URL.createObjectURL(blob));
```

## Behavior and migration notes

Store the object URL in the owner that will revoke it. For UI code, that is
usually a component cleanup hook, image preview controller, download manager, or
temporary asset registry.

This rule does not autofix. Adding a generated variable without adding
`URL.revokeObjectURL()` would make the lint error disappear while preserving the
resource leak.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for throwaway snippets where the document lifetime is
the intended cleanup boundary. Prefer a narrow disable comment for those cases.

## Further reading

- [MDN: `URL.createObjectURL()`](https://developer.mozilla.org/docs/Web/API/URL/createObjectURL_static)
- [MDN: `URL.revokeObjectURL()`](https://developer.mozilla.org/docs/Web/API/URL/revokeObjectURL_static)
