/**
 * @packageDocumentation
 * RuleTester coverage for no-unmanaged-event-listeners.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-unmanaged-event-listeners";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: 'button.addEventListener("click", handleClick);',
            errors: [{ messageId: "unmanagedEventListener" }],
            name: "reports listeners without signal options or matching removal",
        },
        {
            code: 'window.addEventListener("resize", () => layout());',
            errors: [{ messageId: "unmanagedEventListener" }],
            name: "reports inline listeners that cannot be removed later",
        },
        {
            code: [
                'target.addEventListener("scroll", onScroll, true);',
                'target.removeEventListener("scroll", onScroll, false);',
            ].join("\n"),
            errors: [{ messageId: "unmanagedEventListener" }],
            name: "reports mismatched boolean capture cleanup",
        },
        {
            code: [
                'target.addEventListener("scroll", onScroll, { capture: true });',
                'target.removeEventListener("scroll", onScroll);',
            ].join("\n"),
            errors: [{ messageId: "unmanagedEventListener" }],
            name: "reports missing matching capture cleanup for captured listeners",
        },
        {
            code: [
                "function setup() {",
                '    window.addEventListener("resize", onResize);',
                "}",
                "function cleanup() {",
                '    window.removeEventListener("resize", onResize);',
                "}",
            ].join("\n"),
            errors: [{ messageId: "unmanagedEventListener" }],
            name: "does not count cleanup in a different function boundary",
        },
    ],
    valid: [
        {
            code: 'button.addEventListener("click", handleClick, { signal: controller.signal });',
            name: "allows listeners with inline abort signal options",
        },
        {
            code: [
                "const listenerOptions = { signal: controller.signal };",
                'button.addEventListener("click", handleClick, listenerOptions);',
            ].join("\n"),
            name: "allows listeners with const object signal options",
        },
        {
            code: [
                'button.addEventListener("click", handleClick);',
                'button.removeEventListener("click", handleClick);',
            ].join("\n"),
            name: "allows matching listener removal in the same boundary",
        },
        {
            code: [
                'target.addEventListener("scroll", onScroll, true);',
                'target.removeEventListener("scroll", onScroll, true);',
            ].join("\n"),
            name: "allows matching boolean capture cleanup",
        },
        {
            code: [
                'target.addEventListener("scroll", onScroll, { capture: true });',
                'target.removeEventListener("scroll", onScroll, { capture: true });',
            ].join("\n"),
            name: "allows matching object capture cleanup",
        },
        {
            code: [
                "function setup() {",
                '    window.addEventListener("resize", onResize);',
                '    window.removeEventListener("resize", onResize);',
                "}",
            ].join("\n"),
            name: "allows matching cleanup inside the same function boundary",
        },
        {
            code: [
                "const options = getListenerOptions();",
                'target.addEventListener("message", onMessage, options);',
                'target.removeEventListener("message", onMessage, options);',
            ].join("\n"),
            name: "allows matching opaque listener options",
        },
        {
            code: 'customTarget["addEventListener"]("ready", onReady);',
            name: "ignores computed addEventListener properties",
        },
    ],
});
