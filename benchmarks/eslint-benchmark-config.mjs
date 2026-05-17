/**
 * Shared benchmark config helpers.
 */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types, jsdoc/no-undefined-types -- Benchmark helper JSDoc is consumed by TypeScript's JS checker. */
// @ts-check

import runtimeCleanupPlugin from "../dist/plugin.js";

/** @typedef {Readonly<Record<string, "error">>} BenchmarkRuleSet */
/** @typedef {Readonly<{ rules?: BenchmarkRuleSet }>} BenchmarkConfigOptions */

/**
 * Create a flat ESLint config array for runtime-cleanup benchmark scenarios.
 *
 * @param {BenchmarkConfigOptions} options - Config creation options.
 *
 * @returns {import("eslint").Linter.Config[]}
 */
export function createRuntimeCleanupFlatConfig({ rules = {} } = {}) {
    return [
        {
            files: ["**/*.ts"],
            languageOptions: {
                parserOptions: {
                    ecmaVersion: "latest",
                    sourceType: "module",
                },
            },
            name: "benchmark:runtime-cleanup",
            plugins: {
                "runtime-cleanup": runtimeCleanupPlugin,
            },
            rules,
        },
    ];
}

/** Initial empty benchmark rule sets. */
export const runtimeCleanupRuleSets = Object.freeze({
    all: Object.freeze({}),
    recommended: Object.freeze({}),
    strict: Object.freeze({}),
});

/* eslint-enable @typescript-eslint/explicit-module-boundary-types, jsdoc/no-undefined-types -- Re-enable for any future additions below. */
