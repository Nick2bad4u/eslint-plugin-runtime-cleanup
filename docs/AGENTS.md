---
name: "Codex-Instructions-ESLint-Docs"
description: "Instructions for writing perfect ESLint rule documentation."
applyTo: "docs/**"
---

<instructions>
  <goal>

## Your Goal for ESLint Rule Documentation

- Your goal is to make every ESLint rule documentation file (`docs/rules/<rule-id>.md`) totally self-contained, allowing a developer to understand *why* the rule exists, *what* it flags, and *how* to fix it without looking at the source code.
- For adjacent docs in `docs/rules/` such as guides, preset pages, `overview.md`, or `getting-started.md`, keep the same tone and accuracy standards, but do not force rule-only sections where they do not fit.
- You adhere strictly to the `typescript-eslint` and standard ESLint documentation style guides.

  </goal>

  <structure>

## Documentation Structure

Rule documentation files in `docs/rules/<rule-id>.md` should follow this structure closely:

1.  **Title:** The bare rule ID as the H1 header (e.g., `# require-timer-cleanup`).
2.  **Description:** A short, one-sentence description of what the rule does.
3.  **Meta Badges (Optional):** Badges for `Recommended`, `Fixable`, or `Type Checked` only if the repository’s current docs pattern uses them.
4.  **Rule Details:** An explanation of the problem the rule solves. Why is this pattern bad?
5.  **Examples:**
    - Use `❌ Incorrect` and `✅ Correct` headers.
    - **Crucial:** Always include code blocks with specific comments explaining *why* a line is incorrect.
    - If the rule is configurable, show examples for different configurations.
6.  **Options (if applicable):**
    - A TypeScript interface definition of the options object.
    - Default values clearly marked.
    - Examples for each option.
7.  **When Not To Use It:** specific scenarios where disabling this rule is acceptable.
8.  **Further Reading:** Links to MDN, TypeScript docs, or relevant specs.

  </structure>

  <style>

## Style & Tone

- **Voice:** Professional, objective, and helpful. Avoid slang.
- **Clarity:** Use active voice. "This rule reports..." instead of "This rule is used to report...".
- **Code Blocks:**
  - Always tag code blocks with `ts` or `tsx` (since this is a TypeScript plugin).
  - Use `// eslint-disable-next-line` or specific comments in examples only if necessary to clarify context, but usually, just show the raw code that triggers the error.
- **Configuration:**
  - Assume **Flat Config** (`eslint.config.mjs`) for all configuration examples.
  - Do not use legacy `.eslintrc` JSON snippets.

  </style>

  <guidelines>

## Writing Guidelines

- **The "Why":** Never just say "Don't do X." Explain the consequence.
  - *Bad:* "Don't use `any`."
  - *Good:* "Using `any` bypasses the TypeScript type checker, which can lead to runtime errors that strict typing would otherwise catch."
- **The "Fix":** If the rule is `fixable`, explicitly state what the auto-fixer does (e.g., "The auto-fixer will replace `var` with `let`.").
- **Type Information:** If the rule requires type information (`parserServices`), add a specific note at the top of the docs:
  > ⚠️ This rule requires type information to run. It will not work without `projectService` (or equivalent typed parser setup) configured.
- **Preset awareness:** Repository presets such as `runtimeCleanup.configs["recommended-type-checked"]`, `runtimeCleanup.configs.strict`, and `runtimeCleanup.configs.all` already wire the typed parser setup for you; do not imply that users must always configure it manually.
- **Consistency:** Ensure the examples actually trigger the rule. Do not use hypothetical examples that strictly wouldn't fail the specific AST selector of the rule.

  </guidelines>

  <examples>

## Example Doc

```markdown
# require-timer-cleanup

Require timers created in long-lived scopes to be cleaned up before the owning scope exits.

Uncleared timers keep callbacks reachable and can continue mutating state after the owner is disposed.

## Targeted pattern scope

This rule focuses on timer handles created by `setTimeout` or `setInterval` in effect, lifecycle, or setup scopes.

- Timer handles assigned to variables.
- Timer handles returned from helper functions.
- Cleanup functions that call `clearTimeout` or `clearInterval`.

Alias indirection and custom scheduler abstractions are excluded unless the rule explicitly documents support for them.

## What this rule reports

This rule reports timer handles that are created without a matching cleanup call.

- `setTimeout(...)` handles that are never passed to `clearTimeout(...)`.
- `setInterval(...)` handles that are never passed to `clearInterval(...)`.

## Why this rule exists

Timers are process and browser resources. When code creates them without a cleanup path, callbacks can run after teardown and keep captured values alive longer than intended.

- Tests can leak pending timers.
- UI code can update disposed components.
- Long-running services can retain stale closures.

## ❌ Incorrect

```ts
const interval = setInterval(refreshCache, 1000);
```

## ✅ Correct

```ts
const interval = setInterval(refreshCache, 1000);

disposeCallbacks.push(() => {
    clearInterval(interval);
});
```

## Behavior and migration notes

- Cleanup must use the corresponding clear function.
- Rules should avoid reporting intentionally detached timers unless the configured policy forbids them.
- Autofixes should only add cleanup code when the owning cleanup scope is unambiguous.

## Additional examples

### ❌ Incorrect — Additional example

```ts
setTimeout(flushMetrics, 250);
```

### ✅ Correct — Additional example

```ts
const timeout = setTimeout(flushMetrics, 250);

return () => {
    clearTimeout(timeout);
};
```

### ✅ Correct — Repository-wide usage

```ts
const timeout = setTimeout(retryLater, delay);

using cleanup = {
    [Symbol.dispose]() {
        clearTimeout(timeout);
    },
};
```

## ESLint flat config example

```ts
import runtimeCleanup from "eslint-plugin-runtime-cleanup";

export default [
    {
        plugins: { "runtime-cleanup": runtimeCleanup },
        rules: {
            "runtime-cleanup/require-timer-cleanup": "error",
        },
    },
];
```

## When not to use it

Disable this rule in short-lived scripts where timers intentionally run until process exit and the codebase accepts that lifecycle.

> **Rule catalog ID:** R005

## Further reading

- [MDN: setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout)
- [MDN: setInterval](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)
- [TypeScript 5.2: Explicit Resource Management](https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/)

## Adoption resources

- [Rule adoption checklist](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/guides/adoption-checklist)
- [Preset selection strategy](https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/guides/preset-selection-strategy)

  </examples>
</instructions>
