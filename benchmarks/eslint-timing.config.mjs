import {
    createRuntimeCleanupFlatConfig,
    runtimeCleanupRuleSets,
} from "./eslint-benchmark-config.mjs";

/** @type {import("eslint").Linter.Config[]} */
const benchmarkTimingConfig = createRuntimeCleanupFlatConfig({
    rules: runtimeCleanupRuleSets.recommended,
});

export default benchmarkTimingConfig;
