/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-observers.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-observers";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "new ResizeObserver(handleResize);",
            errors: [
                {
                    data: { observerName: "ResizeObserver" },
                    messageId: "floatingObserver",
                },
            ],
            name: "reports discarded resize observers",
        },
        {
            code: "void new MutationObserver(handleMutations);",
            errors: [
                {
                    data: { observerName: "MutationObserver" },
                    messageId: "floatingObserver",
                },
            ],
            name: "reports voided observer instances",
        },
        {
            code: "new IntersectionObserver(handleIntersections).observe(element);",
            errors: [
                {
                    data: { observerName: "IntersectionObserver" },
                    messageId: "floatingObserver",
                },
            ],
            name: "reports immediately observed intersection observers",
        },
        {
            code: '(new PerformanceObserver(handleEntries) as PerformanceObserver).observe({ entryTypes: ["mark"] });',
            errors: [
                {
                    data: { observerName: "PerformanceObserver" },
                    messageId: "floatingObserver",
                },
            ],
            name: "reports immediately observed observers through TS wrappers",
        },
        {
            code: "new window.ResizeObserver(handleResize);",
            errors: [
                {
                    data: { observerName: "ResizeObserver" },
                    messageId: "floatingObserver",
                },
            ],
            name: "reports discarded global member observer instances",
        },
    ],
    valid: [
        {
            code: [
                "const observer = new ResizeObserver(handleResize);",
                "observer.observe(element);",
                "observer.disconnect();",
            ].join("\n"),
            name: "allows retained observers that can be disconnected",
        },
        {
            code: "return new MutationObserver(handleMutations);",
            name: "allows returned observers that transfer ownership",
        },
        {
            code: "registerObserver(new IntersectionObserver(handleIntersections));",
            name: "allows observer instances passed to a manager",
        },
        {
            code: [
                "class ResizeObserver {}",
                "new ResizeObserver();",
            ].join("\n"),
            name: "ignores shadowed observer constructors",
        },
        {
            code: "new CustomObserver(handleChange).observe(element);",
            name: "ignores custom observer constructors",
        },
    ],
});
