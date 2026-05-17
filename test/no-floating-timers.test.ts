/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-timers.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-timers";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "setInterval(tick, 1000);",
            errors: [
                {
                    data: { timerName: "setInterval" },
                    messageId: "floatingTimer",
                },
            ],
            name: "reports discarded setInterval handles",
        },
        {
            code: "globalThis.setTimeout(run, 100);",
            errors: [
                {
                    data: { timerName: "setTimeout" },
                    messageId: "floatingTimer",
                },
            ],
            name: "reports discarded globalThis setTimeout handles",
        },
        {
            code: "void window.requestAnimationFrame(render);",
            errors: [
                {
                    data: { timerName: "requestAnimationFrame" },
                    messageId: "floatingTimer",
                },
            ],
            name: "reports deliberately voided animation frame handles",
        },
        {
            code: "self.requestIdleCallback(work);",
            errors: [
                {
                    data: { timerName: "requestIdleCallback" },
                    messageId: "floatingTimer",
                },
            ],
            name: "reports discarded idle callback handles",
        },
        {
            code: "setImmediate(flush);",
            errors: [
                {
                    data: { timerName: "setImmediate" },
                    messageId: "floatingTimer",
                },
            ],
            name: "reports discarded setImmediate handles",
        },
    ],
    valid: [
        {
            code: "const timeoutId = setTimeout(callback, 100); clearTimeout(timeoutId);",
            name: "allows retained timeout handles",
        },
        {
            code: "let intervalId: ReturnType<typeof setInterval>; intervalId = setInterval(tick, 1000);",
            name: "allows assigning interval handles after declaration",
        },
        {
            code: "function createTimer() { return setInterval(tick, 1000); }",
            name: "allows returned timer handles",
        },
        {
            code: "registerTimer(setTimeout(callback, 100));",
            name: "allows timer handles passed to registration helpers",
        },
        {
            code: "const frame = window.requestAnimationFrame(render); window.cancelAnimationFrame(frame);",
            name: "allows retained animation frame handles",
        },
        {
            code: "function setTimeout(callback: () => void, ms: number) { callback(); return ms; } setTimeout(() => {}, 1);",
            name: "ignores locally shadowed direct timer identifiers",
        },
        {
            code: "scheduler.setInterval(task, 1000);",
            name: "ignores non-global receiver methods",
        },
    ],
});
