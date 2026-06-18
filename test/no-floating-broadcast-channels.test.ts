/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-broadcast-channels.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-broadcast-channels";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: 'new BroadcastChannel("updates");',
            errors: [{ messageId: "floatingBroadcastChannel" }],
            name: "reports discarded BroadcastChannel instances",
        },
        {
            code: 'void new BroadcastChannel("updates");',
            errors: [{ messageId: "floatingBroadcastChannel" }],
            name: "reports voided BroadcastChannel instances",
        },
        {
            code: 'new BroadcastChannel("updates").postMessage(message);',
            errors: [{ messageId: "floatingBroadcastChannel" }],
            name: "reports immediate postMessage calls",
        },
        {
            code: [
                'new BroadcastChannel("updates").addEventListener("message", onMessage);',
            ].join("\n"),
            errors: [{ messageId: "floatingBroadcastChannel" }],
            name: "reports immediate listener registration",
        },
        {
            code: "(new BroadcastChannel(name) as BroadcastChannel).postMessage(message);",
            errors: [{ messageId: "floatingBroadcastChannel" }],
            name: "reports TypeScript-wrapped channel method chains",
        },
        {
            code: 'new globalThis.BroadcastChannel("updates");',
            errors: [{ messageId: "floatingBroadcastChannel" }],
            name: "reports globalThis BroadcastChannel instances",
        },
        {
            code: 'new window["BroadcastChannel"]("updates").postMessage(message);',
            errors: [{ messageId: "floatingBroadcastChannel" }],
            name: "reports computed global BroadcastChannel method chains",
        },
    ],
    valid: [
        {
            code: [
                'const channel = new BroadcastChannel("updates");',
                'channel.addEventListener("message", onMessage);',
                "channel.close();",
            ].join("\n"),
            name: "allows retained channels",
        },
        {
            code: "return new BroadcastChannel(name);",
            name: "allows returned channels that transfer ownership",
        },
        {
            code: "registerChannel(new BroadcastChannel(name));",
            name: "allows channels passed to lifecycle managers",
        },
        {
            code: "new BroadcastChannel(name).close();",
            name: "allows immediate close calls",
        },
        {
            code: [
                "class BroadcastChannel {",
                "    postMessage(_message: string) {}",
                "}",
                'new BroadcastChannel("test").postMessage("hello");',
            ].join("\n"),
            name: "ignores shadowed BroadcastChannel constructors",
        },
    ],
});
