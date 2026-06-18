import nickTwoBadFourU from "eslint-config-nick2bad4u";
import sonarjs from "eslint-plugin-sonarjs";

import plugin from "./plugin.mjs";

const baseConfig = /** @type {import("eslint").Linter.Config[]} */ (
    /** @type {unknown} */ (nickTwoBadFourU.configs.withoutRuntimeCleanup)
);

const runtimeCleanupExperimentalConfig = plugin.configs?.["experimental"];

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

const config = /** @type {import("eslint").Linter.Config[]} */ (
    /** @type {unknown} */ ([
        ...baseConfig,
        {
            ignores: [
                "benchmark/**",
                "benchmarks/**",
                "docs/docusaurus/typedoc-plugins/**",
                "knip.config.ts",
                "test/__snapshots__/**/*.md",
                "vitest.stryker.config.ts",
            ],
            name: "Generated and Tooling Files Outside Typed Lint Projects",
        },
        localRuntimeCleanupConfig,
        {
            files: ["src/**/*.ts"],
            name: "Runtime Cleanup Rule Source Compatibility",
            rules: {
                "import-x/max-dependencies": "off",
                "unicorn/consistent-boolean-name": "off",
                "unicorn/no-break-in-nested-loop": "off",
                "unicorn/no-non-function-verb-prefix": "off",
                "unicorn/prefer-includes-over-repeated-comparisons": "off",
            },
        },
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
            plugins: {
                sonarjs,
            },
            rules: {
                "@typescript-eslint/no-dynamic-delete": "off",
                "@typescript-eslint/no-misused-spread": "off",
                "@typescript-eslint/prefer-readonly-parameter-types": "off",
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
                "unicorn/consistent-boolean-name": "off",
                "unicorn/filename-case": "off",
                "unicorn/no-break-in-nested-loop": "off",
                "unicorn/no-global-object-property-assignment": "off",
                "unicorn/no-incorrect-template-string-interpolation": "off",
                "unicorn/no-unnecessary-global-this": "off",
                "unicorn/prefer-global-this": "off",
            },
        },
        {
            files: ["docs/docusaurus/**/*.{ts,tsx}"],
            name: "Docusaurus Runtime Compatibility",
            rules: {
                "canonical/filename-no-index": "off",
                "n/no-process-env": "off",
                "unicorn/no-non-function-verb-prefix": "off",
                "unicorn/no-unreadable-new-expression": "off",
                "unicorn/prefer-short-arrow-method": "off",
                "unicorn/prefer-temporal": "off",
            },
        },
        {
            files: ["docs/docusaurus/src/**/*.css"],
            name: "Docusaurus Presentation CSS",
            rules: {
                "stylelint-2/stylelint": "off",
            },
        },
        {
            files: ["docs/**/*.md", "docs/**/*.mdx"],
            name: "Docusaurus Markdown Frontmatter",
            rules: {
                "markdown/no-multiple-h1": "off",
            },
        },
        {
            files: [
                ".ncurc.json",
                "eslint.config.mjs",
                "stryker.config.mjs",
                "vite.config.ts",
            ],
            name: "Config Tooling Compatibility",
            rules: {
                "@typescript-eslint/dot-notation": "off",
                "@typescript-eslint/no-unsafe-assignment": "off",
                "@typescript-eslint/no-unsafe-call": "off",
                "@typescript-eslint/no-unsafe-member-access": "off",
                "json-schema-validator-2/no-invalid": "off",
                "n/no-process-env": "off",
                "unicorn/prefer-number-coercion": "off",
            },
        },
        {
            files: ["test/**/*.ts"],
            name: "Legacy Test Conventions",
            rules: {
                "@typescript-eslint/no-unsafe-call": "off",
                "n/no-process-env": "off",
                "unicorn/consistent-boolean-name": "off",
                "unicorn/max-nested-calls": "off",
                "unicorn/no-top-level-side-effects": "off",
                "unicorn/no-unreadable-for-of-expression": "off",
                "unicorn/no-unsafe-string-replacement": "off",
                "unicorn/prefer-number-coercion": "off",
            },
        },
        // Add repository-specific config entries below as needed.
    ])
);

export default config;
