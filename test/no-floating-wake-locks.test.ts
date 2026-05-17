/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-wake-locks.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-wake-locks";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: 'navigator.wakeLock.request("screen");',
            errors: [{ messageId: "floatingWakeLock" }],
            name: "reports discarded wake lock requests",
        },
        {
            code: 'void navigator.wakeLock.request("screen");',
            errors: [{ messageId: "floatingWakeLock" }],
            name: "reports voided wake lock requests",
        },
        {
            code: [
                "async function keepAwake() {",
                '    await navigator.wakeLock.request("screen");',
                "}",
            ].join("\n"),
            errors: [{ messageId: "floatingWakeLock" }],
            name: "reports awaited but discarded WakeLockSentinels",
        },
        {
            code: [
                "async function keepAwake() {",
                '    await window.navigator.wakeLock.request("screen");',
                "}",
            ].join("\n"),
            errors: [{ messageId: "floatingWakeLock" }],
            name: "reports window navigator wake lock requests",
        },
        {
            code: [
                "async function keepAwake() {",
                '    await globalThis.navigator["wakeLock"]["request"]("screen");',
                "}",
            ].join("\n"),
            errors: [{ messageId: "floatingWakeLock" }],
            name: "reports computed global wake lock requests",
        },
    ],
    valid: [
        {
            code: [
                "async function keepAwake() {",
                '    const sentinel = await navigator.wakeLock.request("screen");',
                "    await sentinel.release();",
                "}",
            ].join("\n"),
            name: "allows retained WakeLockSentinels",
        },
        {
            code: [
                "async function keepAwake() {",
                '    return navigator.wakeLock.request("screen");',
                "}",
            ].join("\n"),
            name: "allows returned wake lock request promises",
        },
        {
            code: [
                "async function keepAwake() {",
                '    registerWakeLock(await navigator.wakeLock.request("screen"));',
                "}",
            ].join("\n"),
            name: "allows WakeLockSentinels passed to lifecycle managers",
        },
        {
            code: [
                'navigator.wakeLock.request("screen").then((sentinel) => {',
                "    registerWakeLock(sentinel);",
                "});",
            ].join("\n"),
            name: "allows promise chains that handle the WakeLockSentinel",
        },
        {
            code: [
                "const navigator = {",
                "    wakeLock: { request(_type: string) {} },",
                "};",
                'navigator.wakeLock.request("screen");',
            ].join("\n"),
            name: "ignores shadowed navigator bindings",
        },
    ],
});
