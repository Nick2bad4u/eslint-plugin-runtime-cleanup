/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-servers.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-servers";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: [
                "import { createServer } from 'node:http';",
                "createServer(handler);",
            ].join("\n"),
            errors: [{ messageId: "floatingServer" }],
            name: "reports discarded named HTTP servers",
        },
        {
            code: [
                "import * as net from 'node:net';",
                "void net.createServer(onConnection);",
            ].join("\n"),
            errors: [{ messageId: "floatingServer" }],
            name: "reports voided namespace TCP servers",
        },
        {
            code: [
                "import http from 'http';",
                "http.createServer(handler).listen(3000);",
            ].join("\n"),
            errors: [{ messageId: "floatingServer" }],
            name: "reports discarded listen chains",
        },
        {
            code: [
                "import { createServer } from 'node:https';",
                "createServer(options, handler).listen(443).on('error', onError);",
            ].join("\n"),
            errors: [{ messageId: "floatingServer" }],
            name: "reports discarded chained server method calls",
        },
        {
            code: [
                "const { createServer: makeServer } = require('node:http');",
                "makeServer(handler);",
            ].join("\n"),
            errors: [{ messageId: "floatingServer" }],
            name: "reports destructured CommonJS server factories",
        },
        {
            code: [
                "const http2 = require('http2');",
                "http2.createSecureServer(options, handler).listen(8443);",
            ].join("\n"),
            errors: [{ messageId: "floatingServer" }],
            name: "reports HTTP/2 secure server chains",
        },
        {
            code: "require('node:net').createServer(onConnection);",
            errors: [{ messageId: "floatingServer" }],
            name: "reports inline require member server factories",
        },
    ],
    valid: [
        {
            code: [
                "import { createServer } from 'node:http';",
                "const server = createServer(handler);",
                "server.listen(3000);",
                "server.close();",
            ].join("\n"),
            name: "allows retained server handles",
        },
        {
            code: [
                "import * as http from 'node:http';",
                "const server = http.createServer(handler).listen(3000);",
                "server.close();",
            ].join("\n"),
            name: "allows retained listen chains",
        },
        {
            code: [
                "import { createServer } from 'node:net';",
                "return createServer(onConnection).listen(3000);",
            ].join("\n"),
            name: "allows returned server handles",
        },
        {
            code: [
                "import { createServer } from 'node:http';",
                "registerServer(createServer(handler).listen(3000));",
            ].join("\n"),
            name: "allows server handles passed to lifecycle managers",
        },
        {
            code: [
                "import { createServer } from 'node:http';",
                "createServer(handler).close();",
            ].join("\n"),
            name: "allows immediately closed server handles",
        },
        {
            code: [
                "function createServer(_handler: unknown) {",
                "    return { listen() {} };",
                "}",
                "createServer(handler).listen(3000);",
            ].join("\n"),
            name: "ignores local factories named createServer",
        },
        {
            code: [
                "import * as http from 'node:http';",
                "http.createSecureServer(options, handler).listen(8443);",
            ].join("\n"),
            name: "ignores HTTP/2-only factories on non-HTTP/2 modules",
        },
    ],
});
