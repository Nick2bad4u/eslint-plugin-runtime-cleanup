# no-floating-media-streams

Require captured `MediaStream` handles to be retained so their tracks can be
stopped.

> **Rule catalog ID:** R015

## Targeted pattern scope

This rule targets browser media capture APIs:

- `navigator.mediaDevices.getUserMedia(...)`
- `navigator.mediaDevices.getDisplayMedia(...)`
- `window.navigator.mediaDevices.getUserMedia(...)`
- `globalThis.navigator.mediaDevices.getDisplayMedia(...)`

The rule reports capture requests whose resulting `MediaStream` is immediately
discarded, including `await` expressions that do not store, return, or pass the
stream to another owner.

## What this rule reports

The rule reports:

- standalone media capture requests
- voided media capture requests
- `await navigator.mediaDevices.getUserMedia(...)` used as a standalone
  expression
- `await navigator.mediaDevices.getDisplayMedia(...)` used as a standalone
  expression

It intentionally allows promise chains and lifecycle-manager calls that receive
the stream. The rule focuses on obviously unowned stream handles, not on proving
that every possible owner eventually stops every track.

## Why this rule exists

`getUserMedia()` and `getDisplayMedia()` return `MediaStream` objects backed by
media tracks. Tracks can keep cameras, microphones, screen capture, indicators,
or permission-sensitive resources active. `MediaStreamTrack.stop()` tells the
browser that a track's source is no longer needed. If the stream handle is
discarded, cleanup code cannot reliably stop its tracks.

## Incorrect

```ts
navigator.mediaDevices.getUserMedia({ video: true });
```

```ts
void navigator.mediaDevices.getDisplayMedia({ video: true });
```

```ts
async function openCamera() {
    await navigator.mediaDevices.getUserMedia({ video: true });
}
```

## Correct

```ts
async function openCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    stream.getTracks().forEach((track) => track.stop());
}
```

```ts
async function openScreen() {
    return navigator.mediaDevices.getDisplayMedia({ video: true });
}
```

```ts
async function openCamera() {
    registerStream(
        await navigator.mediaDevices.getUserMedia({ audio: true }),
    );
}
```

## Behavior and migration notes

Store the stream in the lifecycle owner that will stop its tracks. For UI code,
that is usually a component cleanup hook, route cleanup hook, recording
controller, or media session manager.

This rule does not autofix. Introducing a local variable without a matching
track-stop lifecycle would hide the cleanup bug instead of solving it.

## ESLint flat config example

```js
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    runtimeCleanup.configs.recommended,
];
```

## When not to use it

Do not enable this rule for short demo snippets where the browser page lifetime
is the intended cleanup boundary. Prefer narrow disable comments for those
snippets rather than weakening the rule globally.

## Further reading

- [MDN: `MediaDevices.getUserMedia()`](https://developer.mozilla.org/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: `MediaDevices.getDisplayMedia()`](https://developer.mozilla.org/docs/Web/API/MediaDevices/getDisplayMedia)
- [MDN: `MediaStreamTrack.stop()`](https://developer.mozilla.org/docs/Web/API/MediaStreamTrack/stop)
