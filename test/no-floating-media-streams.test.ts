/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-media-streams.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-media-streams";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "navigator.mediaDevices.getUserMedia({ audio: true });",
            errors: [{ messageId: "floatingMediaStream" }],
            name: "reports discarded getUserMedia requests",
        },
        {
            code: "void navigator.mediaDevices.getDisplayMedia({ video: true });",
            errors: [{ messageId: "floatingMediaStream" }],
            name: "reports voided getDisplayMedia requests",
        },
        {
            code: [
                "async function openCamera() {",
                "    await navigator.mediaDevices.getUserMedia({ video: true });",
                "}",
            ].join("\n"),
            errors: [{ messageId: "floatingMediaStream" }],
            name: "reports awaited but discarded MediaStreams",
        },
        {
            code: [
                "async function openScreen() {",
                "    await window.navigator.mediaDevices.getDisplayMedia({ video: true });",
                "}",
            ].join("\n"),
            errors: [{ messageId: "floatingMediaStream" }],
            name: "reports window navigator media capture",
        },
        {
            code: [
                "async function openCamera() {",
                "    await globalThis.navigator['mediaDevices']['getUserMedia']({ video: true });",
                "}",
            ].join("\n"),
            errors: [{ messageId: "floatingMediaStream" }],
            name: "reports computed global media capture",
        },
    ],
    valid: [
        {
            code: [
                "async function openCamera() {",
                "    const stream = await navigator.mediaDevices.getUserMedia({ video: true });",
                "    stream.getTracks().forEach((track) => track.stop());",
                "}",
            ].join("\n"),
            name: "allows retained MediaStreams",
        },
        {
            code: [
                "async function openScreen() {",
                "    return navigator.mediaDevices.getDisplayMedia({ video: true });",
                "}",
            ].join("\n"),
            name: "allows returned media capture promises",
        },
        {
            code: [
                "async function openCamera() {",
                "    registerStream(await navigator.mediaDevices.getUserMedia({ audio: true }));",
                "}",
            ].join("\n"),
            name: "allows MediaStreams passed to lifecycle managers",
        },
        {
            code: [
                "navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {",
                "    registerStream(stream);",
                "});",
            ].join("\n"),
            name: "allows promise chains that handle the MediaStream",
        },
        {
            code: [
                "const navigator = {",
                "    mediaDevices: { getUserMedia(_constraints: unknown) {} },",
                "};",
                "navigator.mediaDevices.getUserMedia({ video: true });",
            ].join("\n"),
            name: "ignores shadowed navigator bindings",
        },
    ],
});
