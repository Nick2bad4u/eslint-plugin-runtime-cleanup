/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-workers.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-workers";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: 'new Worker("./worker.js");',
            errors: [
                {
                    data: { workerName: "Worker" },
                    messageId: "floatingWorker",
                },
            ],
            name: "reports discarded browser workers",
        },
        {
            code: 'void new SharedWorker("./shared-worker.js");',
            errors: [
                {
                    data: { workerName: "SharedWorker" },
                    messageId: "floatingWorker",
                },
            ],
            name: "reports voided shared workers",
        },
        {
            code: 'new window.Worker("./worker.js");',
            errors: [
                {
                    data: { workerName: "Worker" },
                    messageId: "floatingWorker",
                },
            ],
            name: "reports discarded global member worker instances",
        },
        {
            code: 'new Worker("./worker.js").postMessage("start");',
            errors: [
                {
                    data: { workerName: "Worker" },
                    messageId: "floatingWorker",
                },
            ],
            name: "reports immediate worker method calls without a retained handle",
        },
        {
            code: '(new Worker("./worker.js") as Worker).postMessage("start");',
            errors: [
                {
                    data: { workerName: "Worker" },
                    messageId: "floatingWorker",
                },
            ],
            name: "reports immediate worker method calls through TS wrappers",
        },
        {
            code: [
                'import { Worker } from "node:worker_threads";',
                'new Worker("./worker.js");',
            ].join("\n"),
            errors: [
                {
                    data: { workerName: "Worker" },
                    messageId: "floatingWorker",
                },
            ],
            name: "reports discarded node worker_threads workers",
        },
    ],
    valid: [
        {
            code: [
                'const worker = new Worker(new URL("./worker.js", import.meta.url));',
                'worker.postMessage("start");',
                "worker.terminate();",
            ].join("\n"),
            name: "allows retained browser workers that can be terminated",
        },
        {
            code: 'return new Worker("./worker.js");',
            name: "allows returned workers that transfer ownership",
        },
        {
            code: 'registerWorker(new SharedWorker("./shared-worker.js"));',
            name: "allows worker instances passed to a manager",
        },
        {
            code: ["class Worker {}", "new Worker();"].join("\n"),
            name: "ignores shadowed browser worker constructors",
        },
        {
            code: 'new CustomWorker("./worker.js").postMessage("start");',
            name: "ignores custom worker-like constructors",
        },
        {
            code: [
                'import { Worker } from "node:worker_threads";',
                'const worker = new Worker("./worker.js");',
                "worker.terminate();",
            ].join("\n"),
            name: "allows retained node worker_threads workers",
        },
        {
            code: 'new Worker("./worker.js").terminate();',
            name: "allows immediate browser worker termination",
        },
    ],
});
