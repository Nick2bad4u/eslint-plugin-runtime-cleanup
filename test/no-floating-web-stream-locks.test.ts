/**
 * @packageDocumentation
 * Typed RuleTester coverage for no-floating-web-stream-locks.
 */
import { getPluginRule } from "./_internal/ruleTester";
import {
    typedRuleTester,
    warmTypedParserServices,
} from "./_internal/typed-rule-tester";

const ruleName = "no-floating-web-stream-locks";
const ruleTester = typedRuleTester;

warmTypedParserServices("file.ts");

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "new ReadableStream<Uint8Array>().getReader();",
            errors: [{ messageId: "floatingWebStreamLock" }],
            name: "reports discarded readable stream readers",
        },
        {
            code: "void new WritableStream<Uint8Array>().getWriter();",
            errors: [{ messageId: "floatingWebStreamLock" }],
            name: "reports voided writable stream writers",
        },
        {
            code: [
                "const stream = new ReadableStream<Uint8Array>();",
                "stream.getReader().read();",
            ].join("\n"),
            errors: [{ messageId: "floatingWebStreamLock" }],
            name: "reports immediate reader method use that loses the lock",
        },
        {
            code: [
                "const stream = new WritableStream<Uint8Array>();",
                "stream.getWriter().write(new Uint8Array());",
            ].join("\n"),
            errors: [{ messageId: "floatingWebStreamLock" }],
            name: "reports immediate writer method use that loses the lock",
        },
    ],
    valid: [
        {
            code: [
                "const stream = new ReadableStream<Uint8Array>();",
                "const reader = stream.getReader();",
                "reader.releaseLock();",
            ].join("\n"),
            name: "allows retained readable stream readers",
        },
        {
            code: [
                "function createReader(stream: ReadableStream<Uint8Array>) {",
                "    return stream.getReader();",
                "}",
            ].join("\n"),
            name: "allows returned readers",
        },
        {
            code: [
                "const stream = new WritableStream<Uint8Array>();",
                "registerWriter(stream.getWriter());",
            ].join("\n"),
            name: "allows writers passed to lifecycle managers",
        },
        {
            code: "new ReadableStream<Uint8Array>().getReader().releaseLock();",
            name: "allows immediate releaseLock calls",
        },
        {
            code: [
                "const custom = {",
                "    getReader() { return { read() {} }; },",
                "};",
                "custom.getReader().read();",
            ].join("\n"),
            name: "ignores non-Web Stream getReader methods",
        },
    ],
});
