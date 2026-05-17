import nickTwoBadFourU from "eslint-config-nick2bad4u";

import plugin from "./plugin.mjs";

const experimentalConfig = plugin.configs?.["experimental"];
const baseConfigName = ["without", "Type", "fest"].join("");

/**
 * @param {unknown} value - Config value exposed by the shared config package.
 * @returns {value is import("eslint").Linter.Config[]} Whether the value is a flat config array.
 */
const isConfigArray = (value) => Array.isArray(value);

/**
 * @param {unknown} presets - Config preset bag exposed by the shared config package.
 * @returns {Record<string, import("eslint").Linter.Config[]>} Named flat config arrays.
 */
const collectConfigArrays = (presets) =>
    presets === null || typeof presets !== "object"
        ? {}
        : Object.fromEntries(
              Object.entries(presets).filter((entry) =>
                  isConfigArray(entry[1])
              )
          );

const sharedConfigPresets = collectConfigArrays(nickTwoBadFourU.configs);
const baseConfig =
    sharedConfigPresets[baseConfigName] ??
    sharedConfigPresets["recommended"] ??
    [];

/** @type {import("eslint").Linter.RulesRecord} */
const localExperimentalRules = {};

if (
    !Array.isArray(experimentalConfig) &&
    experimentalConfig?.rules !== undefined
) {
    for (const [ruleName, ruleConfig] of Object.entries(
        experimentalConfig.rules
    )) {
        if (ruleConfig !== undefined) {
            localExperimentalRules[ruleName] = ruleConfig;
        }
    }
}

/** @type {import("eslint").Linter.Config[]} */
const config = [
    ...baseConfig,

    // Local Plugin Config
    // This lets us use the plugin's rules in this repository without needing to publish the plugin first.
    {
        files: ["src/**/*.{ts,tsx,mts,cts}"],
        name: "Local Runtime Cleanup",
        plugins: {
            "runtime-cleanup": plugin,
        },
        rules: {
            ...localExperimentalRules,
        },
    },
    // Add repository-specific config entries below as needed.
];

export default config;
