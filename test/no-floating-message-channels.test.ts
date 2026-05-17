/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-message-channels.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-message-channels";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "new MessageChannel();",
            errors: [{ messageId: "floatingMessageChannel" }],
            name: "reports discarded MessageChannel instances",
        },
        {
            code: "void new MessageChannel();",
            errors: [{ messageId: "floatingMessageChannel" }],
            name: "reports voided MessageChannel instances",
        },
        {
            code: "new MessageChannel().port1.postMessage(message);",
            errors: [{ messageId: "floatingMessageChannel" }],
            name: "reports immediate port message sends",
        },
        {
            code: "const port = new MessageChannel().port2;",
            errors: [{ messageId: "floatingMessageChannel" }],
            name: "reports retaining only one immediately accessed port",
        },
        {
            code: "(new MessageChannel() as MessageChannel).port1.start();",
            errors: [{ messageId: "floatingMessageChannel" }],
            name: "reports TypeScript-wrapped port access",
        },
        {
            code: "new globalThis.MessageChannel().port1.close();",
            errors: [{ messageId: "floatingMessageChannel" }],
            name: "reports globalThis MessageChannel port access",
        },
        {
            code: 'new window["MessageChannel"]().port2.postMessage(message);',
            errors: [{ messageId: "floatingMessageChannel" }],
            name: "reports computed global MessageChannel constructors",
        },
    ],
    valid: [
        {
            code: [
                "const channel = new MessageChannel();",
                "channel.port1.addEventListener('message', onMessage);",
                "channel.port1.close();",
                "channel.port2.close();",
            ].join("\n"),
            name: "allows retained channel handles",
        },
        {
            code: [
                "const { port1, port2 } = new MessageChannel();",
                "port1.postMessage(message);",
                "port1.close();",
                "port2.close();",
            ].join("\n"),
            name: "allows destructuring both ports for explicit cleanup",
        },
        {
            code: "return new MessageChannel();",
            name: "allows returned channels that transfer ownership",
        },
        {
            code: "registerChannel(new MessageChannel());",
            name: "allows channels passed to lifecycle managers",
        },
        {
            code: [
                "class MessageChannel {",
                "    readonly port1 = { postMessage(_message: string) {} };",
                "}",
                "new MessageChannel().port1.postMessage('hello');",
            ].join("\n"),
            name: "ignores shadowed MessageChannel constructors",
        },
    ],
});
