import nickTwoBadFourU from "eslint-config-nick2bad4u";

import plugin from "./plugin.mjs";

const baseConfig =
    /** @type {import("eslint").Linter.Config[]} */ (
        /** @type {unknown} */ (
            nickTwoBadFourU.configs.withoutRuntimeCleanup
        )
    );

const runtimeCleanupExperimentalConfig =
    plugin.configs?.["experimental"];

if (
    runtimeCleanupExperimentalConfig === undefined ||
    Array.isArray(runtimeCleanupExperimentalConfig)
) {
    throw new TypeError(
        "Expected runtime-cleanup experimental config to be a flat config object."
    );
}

const runtimeCleanupExperimentalRules =
    /** @type {import("eslint").Linter.Config["rules"]} */ (
        runtimeCleanupExperimentalConfig.rules ?? {}
    );

// Local Plugin Config
// This lets us use the plugin's rules in this repository without needing to publish the plugin first.
const localRuntimeCleanupConfig = {
    ...runtimeCleanupExperimentalConfig,
    name: "Local Runtime Cleanup",
    plugins: {
        "runtime-cleanup": plugin,
    },
    rules: runtimeCleanupExperimentalRules,
};

const config =
    /** @type {import("eslint").Linter.Config[]} */ (
        /** @type {unknown} */ ([
            ...baseConfig,
            {
                ignores: ["test/__snapshots__/**/*.md"],
                name: "Generated Markdown Snapshots",
            },
            localRuntimeCleanupConfig,
            {
                files: ["docs/docusaurus/docusaurus.config.ts"],
                languageOptions: {
                    globals: {
                        process: "readonly",
                    },
                },
                name: "Docusaurus Node Globals",
            },
            {
                files: ["docs/docusaurus/src/**/*.{ts,tsx}"],
                languageOptions: {
                    globals: {
                        clearTimeout: "readonly",
                        document: "readonly",
                        location: "readonly",
                        setTimeout: "readonly",
                    },
                },
                name: "Docusaurus Browser Globals",
                rules: {
                    "sonarjs/no-implicit-dependencies": [
                        "warn",
                        {
                            whitelist: [
                                "@docusaurus/Head",
                                "@docusaurus/Link",
                                "@docusaurus/useBaseUrl",
                                "@theme/Heading",
                                "@theme/Layout",
                            ],
                        },
                    ],
                },
            },
            // Add repository-specific config entries below as needed.
        ])
    );

export default config;
