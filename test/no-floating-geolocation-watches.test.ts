/**
 * @packageDocumentation
 * RuleTester coverage for no-floating-geolocation-watches.
 */
import { createRuleTester, getPluginRule } from "./_internal/ruleTester";

const ruleName = "no-floating-geolocation-watches";
const ruleTester = createRuleTester();

ruleTester.run(ruleName, getPluginRule(ruleName), {
    invalid: [
        {
            code: "navigator.geolocation.watchPosition(onPosition);",
            errors: [{ messageId: "floatingGeolocationWatch" }],
            name: "reports discarded geolocation watch IDs",
        },
        {
            code: "void navigator.geolocation.watchPosition(onPosition, onError);",
            errors: [{ messageId: "floatingGeolocationWatch" }],
            name: "reports voided geolocation watch IDs",
        },
        {
            code: "window.navigator.geolocation.watchPosition(onPosition);",
            errors: [{ messageId: "floatingGeolocationWatch" }],
            name: "reports window navigator geolocation watches",
        },
        {
            code: 'globalThis.navigator["geolocation"]["watchPosition"](onPosition);',
            errors: [{ messageId: "floatingGeolocationWatch" }],
            name: "reports computed global geolocation watch calls",
        },
        {
            code: "(navigator.geolocation.watchPosition(onPosition) as number);",
            errors: [{ messageId: "floatingGeolocationWatch" }],
            name: "reports TypeScript-wrapped discarded watch IDs",
        },
    ],
    valid: [
        {
            code: [
                "const watchId = navigator.geolocation.watchPosition(onPosition);",
                "navigator.geolocation.clearWatch(watchId);",
            ].join("\n"),
            name: "allows retained geolocation watch IDs",
        },
        {
            code: "return navigator.geolocation.watchPosition(onPosition);",
            name: "allows returned watch IDs that transfer ownership",
        },
        {
            code: "registerWatch(navigator.geolocation.watchPosition(onPosition));",
            name: "allows watch IDs passed to lifecycle managers",
        },
        {
            code: [
                "const navigator = {",
                "    geolocation: { watchPosition(_handler: unknown) {} },",
                "};",
                "navigator.geolocation.watchPosition(onPosition);",
            ].join("\n"),
            name: "ignores shadowed navigator bindings",
        },
        {
            code: "navigator.geolocation.getCurrentPosition(onPosition);",
            name: "ignores one-shot geolocation reads",
        },
    ],
});
