/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-audio-contexts.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-audio-contexts";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "new AudioContext();",
            errors: [{ messageId: "floatingAudioContext" }],
            name: "reports discarded AudioContext instances",
        },
        {
            code: "void new AudioContext();",
            errors: [{ messageId: "floatingAudioContext" }],
            name: "reports voided AudioContext instances",
        },
        {
            code: "new window.AudioContext();",
            errors: [{ messageId: "floatingAudioContext" }],
            name: "reports window AudioContext instances",
        },
        {
            code: "new globalThis['webkitAudioContext']();",
            errors: [{ messageId: "floatingAudioContext" }],
            name: "reports computed webkitAudioContext instances",
        },
        {
            code: "new AudioContext().resume();",
            errors: [{ messageId: "floatingAudioContext" }],
            name: "reports immediate non-cleanup use of an unowned AudioContext",
        },
    ],
    valid: [
        {
            code: "const context = new AudioContext();",
            name: "allows retained AudioContext instances",
        },
        {
            code: "function createAudioContext() { return new AudioContext(); }",
            name: "allows returned AudioContext instances",
        },
        {
            code: "audioContexts.add(new AudioContext());",
            name: "allows AudioContext instances passed to lifecycle managers",
        },
        {
            code: "new AudioContext().close();",
            name: "allows immediate close calls",
        },
        {
            code: [
                "class AudioContext {",
                "    resume() {}",
                "}",
                "new AudioContext().resume();",
            ].join("\n"),
            name: "ignores shadowed AudioContext bindings",
        },
    ],
});

