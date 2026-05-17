/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-streams.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-streams";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: [
                'import { createReadStream } from "node:fs";',
                'createReadStream("input.txt");',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "createReadStream" },
                    messageId: "floatingStream",
                },
            ],
            name: "reports discarded named read streams",
        },
        {
            code: [
                'import * as fs from "node:fs";',
                'void fs.createWriteStream("output.txt");',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "createWriteStream" },
                    messageId: "floatingStream",
                },
            ],
            name: "reports voided namespace write streams",
        },
        {
            code: [
                'const fs = require("fs");',
                'fs.createReadStream("input.txt");',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "createReadStream" },
                    messageId: "floatingStream",
                },
            ],
            name: "reports discarded require namespace read streams",
        },
        {
            code: [
                'const { createWriteStream } = require("node:fs");',
                'createWriteStream("output.txt");',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "createWriteStream" },
                    messageId: "floatingStream",
                },
            ],
            name: "reports discarded require destructured write streams",
        },
        {
            code: 'require("node:fs").createReadStream("input.txt");',
            errors: [
                {
                    data: { factoryName: "createReadStream" },
                    messageId: "floatingStream",
                },
            ],
            name: "reports discarded inline require member streams",
        },
    ],
    valid: [
        {
            code: [
                'import { createReadStream } from "node:fs";',
                'const stream = createReadStream("input.txt");',
                "stream.destroy();",
            ].join("\n"),
            name: "allows retained streams that can be destroyed",
        },
        {
            code: [
                'import * as fs from "node:fs";',
                'return fs.createWriteStream("output.txt");',
            ].join("\n"),
            name: "allows returned streams that transfer ownership",
        },
        {
            code: [
                'import * as fs from "node:fs";',
                'registerStream(fs.createReadStream("input.txt"));',
            ].join("\n"),
            name: "allows streams passed to lifecycle managers",
        },
        {
            code: [
                'import * as fs from "node:fs";',
                'fs.createReadStream("input.txt").pipe(response);',
            ].join("\n"),
            name: "allows immediately piped streams",
        },
        {
            code: [
                "function createReadStream() {",
                "    return {};",
                "}",
                'createReadStream("input.txt");',
            ].join("\n"),
            name: "ignores shadowed stream factory names",
        },
        {
            code: [
                'import { createReadStream as read } from "node:fs";',
                'const stream = read("input.txt");',
                "stream.destroy();",
            ].join("\n"),
            name: "allows retained aliased imports",
        },
    ],
});
