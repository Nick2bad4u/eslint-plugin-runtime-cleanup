/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-object-urls.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-object-urls";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "URL.createObjectURL(blob);",
            errors: [{ messageId: "floatingObjectUrl" }],
            name: "reports discarded object URLs",
        },
        {
            code: "void URL.createObjectURL(blob);",
            errors: [{ messageId: "floatingObjectUrl" }],
            name: "reports voided object URLs",
        },
        {
            code: "globalThis.URL.createObjectURL(blob);",
            errors: [{ messageId: "floatingObjectUrl" }],
            name: "reports globalThis URL object URLs",
        },
        {
            code: "window['URL']['createObjectURL'](blob);",
            errors: [{ messageId: "floatingObjectUrl" }],
            name: "reports computed global object URLs",
        },
    ],
    valid: [
        {
            code: "const objectUrl = URL.createObjectURL(blob);",
            name: "allows retained object URLs",
        },
        {
            code: "function createUrl(blob: Blob) { return URL.createObjectURL(blob); }",
            name: "allows returned object URLs",
        },
        {
            code: "objectUrlRegistry.add(URL.createObjectURL(blob));",
            name: "allows object URLs passed to lifecycle managers",
        },
        {
            code: [
                "const URL = {",
                "    createObjectURL(_blob: unknown) { return 'local'; },",
                "};",
                "URL.createObjectURL(blob);",
            ].join("\n"),
            name: "ignores shadowed URL bindings",
        },
    ],
});
