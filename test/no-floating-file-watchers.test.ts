/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-file-watchers.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-file-watchers";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: [
                'import { watch } from "node:fs";',
                'watch("src", onChange);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "watch" },
                    messageId: "floatingFileWatcher",
                },
            ],
            name: "reports discarded named fs.watch calls",
        },
        {
            code: [
                'import * as fs from "node:fs";',
                'void fs.watch("src", onChange);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "watch" },
                    messageId: "floatingFileWatcher",
                },
            ],
            name: "reports voided namespace fs.watch calls",
        },
        {
            code: [
                'const fs = require("fs");',
                'fs.watch("src", onChange);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "watch" },
                    messageId: "floatingFileWatcher",
                },
            ],
            name: "reports discarded require namespace watchers",
        },
        {
            code: [
                'const { watch } = require("node:fs");',
                'watch("src", onChange);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "watch" },
                    messageId: "floatingFileWatcher",
                },
            ],
            name: "reports discarded require destructured watchers",
        },
        {
            code: 'require("node:fs").watch("src", onChange);',
            errors: [
                {
                    data: { factoryName: "watch" },
                    messageId: "floatingFileWatcher",
                },
            ],
            name: "reports discarded inline require member watchers",
        },
        {
            code: [
                'import * as fs from "node:fs";',
                'fs.watch("src", onChange).on("error", onError);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "watch" },
                    messageId: "floatingFileWatcher",
                },
            ],
            name: "reports immediate event registration on unowned watchers",
        },
    ],
    valid: [
        {
            code: [
                'import { watch } from "node:fs";',
                'const watcher = watch("src", onChange);',
                "watcher.close();",
            ].join("\n"),
            name: "allows retained watchers that can be closed",
        },
        {
            code: [
                'import * as fs from "node:fs";',
                'return fs.watch("src", onChange);',
            ].join("\n"),
            name: "allows returned watchers that transfer ownership",
        },
        {
            code: [
                'import * as fs from "node:fs";',
                'registerWatcher(fs.watch("src", onChange));',
            ].join("\n"),
            name: "allows watchers passed to lifecycle managers",
        },
        {
            code: [
                'import * as fs from "node:fs";',
                'fs.watch("src", onChange).close();',
            ].join("\n"),
            name: "allows immediate close calls",
        },
        {
            code: [
                "function watch(_path: string) {",
                "    return {};",
                "}",
                'watch("src");',
            ].join("\n"),
            name: "ignores shadowed watch functions",
        },
        {
            code: [
                'import { watch as watchFiles } from "node:fs";',
                'const watcher = watchFiles("src", onChange);',
                "watcher.close();",
            ].join("\n"),
            name: "allows retained aliased imports",
        },
        {
            code: [
                'import { watch } from "node:fs/promises";',
                'watch("src");',
            ].join("\n"),
            name: "ignores fs/promises async iterator watchers",
        },
    ],
});
