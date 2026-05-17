/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-child-processes.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-child-processes";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: [
                'import { spawn } from "node:child_process";',
                'spawn("node", ["worker.js"]);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "spawn" },
                    messageId: "floatingChildProcess",
                },
            ],
            name: "reports discarded spawned child processes",
        },
        {
            code: [
                'import childProcess from "node:child_process";',
                'void childProcess.exec("node worker.js");',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "exec" },
                    messageId: "floatingChildProcess",
                },
            ],
            name: "reports voided child process handles from module bindings",
        },
        {
            code: [
                'import * as childProcess from "child_process";',
                'childProcess.fork("./worker.js").on("exit", handleExit);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "fork" },
                    messageId: "floatingChildProcess",
                },
            ],
            name: "reports immediate child process method calls without a retained handle",
        },
        {
            code: [
                'const childProcess = require("node:child_process");',
                'childProcess.execFile("node", ["worker.js"]);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "execFile" },
                    messageId: "floatingChildProcess",
                },
            ],
            name: "reports discarded child processes from require module bindings",
        },
        {
            code: [
                'const { spawn } = require("child_process");',
                'spawn("node", ["worker.js"]);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "spawn" },
                    messageId: "floatingChildProcess",
                },
            ],
            name: "reports discarded child processes from destructured require bindings",
        },
        {
            code: [
                'import { spawn as run } from "node:child_process";',
                'run("node", ["worker.js"]);',
            ].join("\n"),
            errors: [
                {
                    data: { factoryName: "spawn" },
                    messageId: "floatingChildProcess",
                },
            ],
            name: "reports discarded child processes from renamed named imports",
        },
        {
            code: 'require("node:child_process").spawn("node", ["worker.js"]);',
            errors: [
                {
                    data: { factoryName: "spawn" },
                    messageId: "floatingChildProcess",
                },
            ],
            name: "reports discarded child processes from inline require calls",
        },
    ],
    valid: [
        {
            code: [
                'import { spawn } from "node:child_process";',
                'const child = spawn("node", ["worker.js"]);',
                'child.kill();',
            ].join("\n"),
            name: "allows retained child process handles that can be killed",
        },
        {
            code: [
                'import { fork } from "node:child_process";',
                'return fork("./worker.js");',
            ].join("\n"),
            name: "allows returned child processes that transfer ownership",
        },
        {
            code: [
                'import childProcess from "node:child_process";',
                'registerChildProcess(childProcess.spawn("node", ["worker.js"]));',
            ].join("\n"),
            name: "allows child process handles passed to a manager",
        },
        {
            code: [
                'function spawn(command: string): void {',
                "    console.log(command);",
                "}",
                'spawn("node");',
            ].join("\n"),
            name: "ignores locally defined functions with child-process-like names",
        },
        {
            code: [
                'const childProcess = require("custom-child-process");',
                'childProcess.spawn("node", ["worker.js"]);',
            ].join("\n"),
            name: "ignores non-child-process modules",
        },
        {
            code: [
                'import { spawn } from "node:child_process";',
                'spawn("node", ["worker.js"]).kill();',
            ].join("\n"),
            name: "allows immediate child process cleanup calls",
        },
    ],
});
