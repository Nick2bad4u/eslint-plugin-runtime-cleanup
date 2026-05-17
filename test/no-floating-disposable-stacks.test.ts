/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-disposable-stacks.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-disposable-stacks";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "new DisposableStack();",
            errors: [{ messageId: "floatingDisposableStack" }],
            name: "reports discarded DisposableStack instances",
        },
        {
            code: "void new AsyncDisposableStack();",
            errors: [{ messageId: "floatingDisposableStack" }],
            name: "reports voided AsyncDisposableStack instances",
        },
        {
            code: "new DisposableStack().defer(cleanup);",
            errors: [{ messageId: "floatingDisposableStack" }],
            name: "reports immediate defer calls on unowned stacks",
        },
        {
            code: "new AsyncDisposableStack().use(resource);",
            errors: [{ messageId: "floatingDisposableStack" }],
            name: "reports immediate use calls on unowned async stacks",
        },
        {
            code: "(new DisposableStack() as DisposableStack).adopt(resource, cleanup);",
            errors: [{ messageId: "floatingDisposableStack" }],
            name: "reports TypeScript-wrapped stack method chains",
        },
        {
            code: "new globalThis.DisposableStack();",
            errors: [{ messageId: "floatingDisposableStack" }],
            name: "reports globalThis DisposableStack instances",
        },
        {
            code: 'new window["AsyncDisposableStack"]().defer(cleanup);',
            errors: [{ messageId: "floatingDisposableStack" }],
            name: "reports computed global AsyncDisposableStack method chains",
        },
    ],
    valid: [
        {
            code: [
                "const stack = new DisposableStack();",
                "stack.defer(cleanup);",
                "stack.dispose();",
            ].join("\n"),
            name: "allows retained stacks with explicit disposal",
        },
        {
            code: [
                "await using stack = new AsyncDisposableStack();",
                "stack.defer(cleanup);",
            ].join("\n"),
            name: "allows await using async disposable stacks",
        },
        {
            code: ["using stack = new DisposableStack();", "stack.defer(cleanup);"].join(
                "\n"
            ),
            name: "allows using disposable stacks",
        },
        {
            code: "return new DisposableStack();",
            name: "allows returned stacks that transfer ownership",
        },
        {
            code: "registerStack(new AsyncDisposableStack());",
            name: "allows stacks passed to a lifecycle manager",
        },
        {
            code: "new DisposableStack().dispose();",
            name: "allows immediate dispose calls",
        },
        {
            code: "new AsyncDisposableStack().disposeAsync();",
            name: "allows immediate async dispose calls",
        },
        {
            code: [
                "class DisposableStack {",
                "    defer(_cleanup: () => void) {}",
                "}",
                "new DisposableStack().defer(cleanup);",
            ].join("\n"),
            name: "ignores shadowed DisposableStack constructors",
        },
    ],
});
