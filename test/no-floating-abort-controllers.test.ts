/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-abort-controllers.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-abort-controllers";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "new AbortController();",
            errors: [{ messageId: "floatingAbortController" }],
            name: "reports discarded AbortController instances",
        },
        {
            code: "void new AbortController();",
            errors: [{ messageId: "floatingAbortController" }],
            name: "reports voided AbortController instances",
        },
        {
            code: 'fetch("/api", { signal: new AbortController().signal });',
            errors: [{ messageId: "floatingAbortController" }],
            name: "reports inline signal handoff without a retained controller",
        },
        {
            code: "const signal = new AbortController().signal;",
            errors: [{ messageId: "floatingAbortController" }],
            name: "reports signal-only retention",
        },
        {
            code: [
                "const request = {",
                "    signal: (new AbortController() as AbortController).signal,",
                "};",
            ].join("\n"),
            errors: [{ messageId: "floatingAbortController" }],
            name: "reports signal access through TypeScript wrappers",
        },
        {
            code: 'fetch("/api", { signal: new globalThis.AbortController().signal });',
            errors: [{ messageId: "floatingAbortController" }],
            name: "reports globalThis AbortController signal handoff",
        },
        {
            code: 'fetch("/api", { signal: new window["AbortController"]().signal });',
            errors: [{ messageId: "floatingAbortController" }],
            name: "reports computed global AbortController signal handoff",
        },
    ],
    valid: [
        {
            code: [
                "const controller = new AbortController();",
                'fetch("/api", { signal: controller.signal });',
                "controller.abort();",
            ].join("\n"),
            name: "allows retained controllers that can be aborted",
        },
        {
            code: "return new AbortController();",
            name: "allows returned controllers that transfer ownership",
        },
        {
            code: "registerAbortController(new AbortController());",
            name: "allows controllers passed to a lifecycle manager",
        },
        {
            code: ["class AbortController {}", "new AbortController();"].join(
                "\n"
            ),
            name: "ignores shadowed AbortController constructors",
        },
        {
            code: "new AbortController().abort();",
            name: "allows immediate abort calls",
        },
        {
            code: "const signal = AbortSignal.timeout(1000);",
            name: "ignores AbortSignal factory helpers",
        },
    ],
});
