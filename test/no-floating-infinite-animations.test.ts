/**
 * @packageDocumentation
 * Typed RuleTester coverage for no-floating-infinite-animations.
 */
import { getPluginRule } from "./_internal/ruleTester";
import {
    typedRuleTester,
    warmTypedParserServices,
} from "./_internal/typed-rule-tester";

const ruleName = "no-floating-infinite-animations";
const ruleTester = typedRuleTester;

warmTypedParserServices("file.ts");

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "document.body.animate([], { duration: 1000, iterations: Infinity });",
            errors: [{ messageId: "floatingInfiniteAnimation" }],
            name: "reports discarded infinite Element animations",
        },
        {
            code: "document.body.animate([], { iterations: Number.POSITIVE_INFINITY }).play();",
            errors: [{ messageId: "floatingInfiniteAnimation" }],
            name: "reports immediate non-cleanup use of infinite animations",
        },
        {
            code: [
                "const element = document.createElement('div');",
                "element.animate([], { iterations: globalThis.Number['POSITIVE_INFINITY'] });",
            ].join("\n"),
            errors: [{ messageId: "floatingInfiniteAnimation" }],
            name: "reports computed positive infinity timing options",
        },
    ],
    valid: [
        {
            code: "document.body.animate([], { duration: 1000, iterations: 1 });",
            name: "allows discarded finite animations",
        },
        {
            code: [
                "const animation = document.body.animate([], { iterations: Infinity });",
                "animation.cancel();",
            ].join("\n"),
            name: "allows retained infinite animations",
        },
        {
            code: "document.body.animate([], { iterations: Infinity }).cancel();",
            name: "allows immediate cancel calls",
        },
        {
            code: [
                "function animateForever(element: Element) {",
                "    return element.animate([], { iterations: Infinity });",
                "}",
            ].join("\n"),
            name: "allows returned infinite animations",
        },
        {
            code: [
                "const custom = {",
                "    animate(_frames: unknown, _options: unknown) { return { play() {} }; },",
                "};",
                "custom.animate([], { iterations: Infinity }).play();",
            ].join("\n"),
            name: "ignores non-Element animate methods",
        },
    ],
});
