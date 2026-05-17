/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-network-connections.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-network-connections";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: 'new WebSocket("wss://example.com/socket");',
            errors: [{ messageId: "floatingNetworkConnection" }],
            name: "reports discarded WebSocket instances",
        },
        {
            code: 'void new EventSource("/events");',
            errors: [{ messageId: "floatingNetworkConnection" }],
            name: "reports voided EventSource instances",
        },
        {
            code: 'new WebSocket("wss://example.com/socket").send("hello");',
            errors: [{ messageId: "floatingNetworkConnection" }],
            name: "reports immediate WebSocket send calls",
        },
        {
            code: [
                'new EventSource("/events").addEventListener("message", onMessage);',
            ].join("\n"),
            errors: [{ messageId: "floatingNetworkConnection" }],
            name: "reports immediate EventSource listener registration",
        },
        {
            code: '(new WebSocket(url) as WebSocket).addEventListener("open", onOpen);',
            errors: [{ messageId: "floatingNetworkConnection" }],
            name: "reports TypeScript-wrapped connection method chains",
        },
        {
            code: 'new globalThis.WebSocket("wss://example.com/socket");',
            errors: [{ messageId: "floatingNetworkConnection" }],
            name: "reports globalThis WebSocket instances",
        },
        {
            code: 'new window["EventSource"]("/events").addEventListener("message", onMessage);',
            errors: [{ messageId: "floatingNetworkConnection" }],
            name: "reports computed global EventSource method chains",
        },
    ],
    valid: [
        {
            code: [
                'const socket = new WebSocket("wss://example.com/socket");',
                'socket.addEventListener("message", onMessage);',
                "socket.close();",
            ].join("\n"),
            name: "allows retained WebSocket instances",
        },
        {
            code: [
                'const source = new EventSource("/events");',
                'source.addEventListener("message", onMessage);',
                "source.close();",
            ].join("\n"),
            name: "allows retained EventSource instances",
        },
        {
            code: "return new WebSocket(url);",
            name: "allows returned connections that transfer ownership",
        },
        {
            code: "registerConnection(new EventSource(url));",
            name: "allows connections passed to a lifecycle manager",
        },
        {
            code: "new WebSocket(url).close();",
            name: "allows immediate close calls",
        },
        {
            code: "new EventSource(url).close();",
            name: "allows immediate EventSource close calls",
        },
        {
            code: [
                "class WebSocket {",
                "    send(_message: string) {}",
                "}",
                'new WebSocket("test").send("hello");',
            ].join("\n"),
            name: "ignores shadowed WebSocket constructors",
        },
    ],
});
