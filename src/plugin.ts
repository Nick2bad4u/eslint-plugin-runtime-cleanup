/**
 * @packageDocumentation
 * Public plugin entrypoint for eslint-plugin-runtime-cleanup exports and preset wiring.
 */
import type { ESLint, Linter } from "eslint";
import type { Except } from "type-fest";

import tsParser from "@typescript-eslint/parser";
import { objectFromEntries, objectHasOwn } from "ts-extras";

// eslint-disable-next-line import-x/extensions -- Avoid importing from the ESM entrypoint to preserve CJS compatibility
import packageJson from "../package.json" with { type: "json" };
import { runtimeCleanupRules } from "./_internal/rules-registry.js";
import {
    type RuntimeCleanupConfigName as InternalRuntimeCleanupConfigName,
    runtimeCleanupConfigMetadataByName,
    runtimeCleanupConfigNames,
} from "./_internal/runtime-cleanup-config-references.js";

/** Default file globs targeted by plugin presets when `files` is omitted. */
const TS_FILES = ["**/*.{ts,tsx,mts,cts}"] as const;

/**
 * Canonical flat-config preset keys exposed through `plugin.configs`.
 *
 * @remarks
 * These names are used by consumers when composing presets in ESLint flat
 * config arrays.
 */
export type RuntimeCleanupConfigName = InternalRuntimeCleanupConfigName;

/**
 * Flat-config preset shape produced by this plugin.
 *
 * @remarks
 * The `rules` map is required so preset composition can always merge concrete
 * rule severity entries without additional null checks.
 */
export type RuntimeCleanupPresetConfig = Linter.Config & {
    rules: NonNullable<Linter.Config["rules"]>;
};

/** Internal alias for flat config objects handled by preset builders. */
type FlatConfig = Linter.Config;

/** Normalized language-options shape for preset composition helpers. */
type FlatLanguageOptions = NonNullable<FlatConfig["languageOptions"]>;

/** Normalized parser-options shape for preset composition helpers. */
type FlatParserOptions = NonNullable<FlatLanguageOptions["parserOptions"]>;

/** Contract for the `configs` object exported by this plugin. */
type RuntimeCleanupConfigsContract = Record<
    RuntimeCleanupConfigName,
    RuntimeCleanupPresetConfig
>;

/** Fully assembled plugin contract used by the runtime default export. */
type RuntimeCleanupPluginContract = Except<ESLint.Plugin, "configs" | "rules"> & {
    configs: RuntimeCleanupConfigsContract;
    meta: {
        name: string;
        namespace: string;
        version: string;
    };
    processors: NonNullable<ESLint.Plugin["processors"]>;
    rules: NonNullable<ESLint.Plugin["rules"]>;
};

/**
 * Resolve package version from package.json data.
 *
 * @param pkg - Parsed package metadata value.
 *
 * @returns The package version, or `0.0.0` when unavailable.
 */
function getPackageVersion(pkg: unknown): string {
    if (typeof pkg !== "object" || pkg === null) {
        return "0.0.0";
    }

    const version: unknown = Reflect.get(pkg, "version");

    return typeof version === "string" ? version : "0.0.0";
}

/** Parser module reused across preset construction. */
const tsParserValue: FlatLanguageOptions["parser"] = tsParser;

/** Default parser options applied when a preset omits parser options. */
const defaultParserOptions = {
    ecmaVersion: "latest",
    sourceType: "module",
} satisfies FlatParserOptions;

/**
 * Normalize unknown parser options into a mutable parser-options object.
 */
const normalizeParserOptions = (
    parserOptions: FlatLanguageOptions["parserOptions"]
): FlatParserOptions =>
    parserOptions !== null &&
    typeof parserOptions === "object" &&
    !Array.isArray(parserOptions)
        ? { ...parserOptions }
        : { ...defaultParserOptions };

/**
 * Fully-qualified ESLint rule id used by this plugin.
 *
 * @remarks
 * Consumers typically use this when building strongly typed rule maps or helper
 * utilities that require namespaced rule identifiers.
 */
export type RuntimeCleanupRuleId = `runtime-cleanup/${RuntimeCleanupRuleName}`;

/** Unqualified rule name supported by `eslint-plugin-runtime-cleanup`. */
export type RuntimeCleanupRuleName = keyof typeof runtimeCleanupRules;

/**
 * ESLint-compatible rule map view of the strongly typed internal rule record.
 */
const runtimeCleanupEslintRules: NonNullable<ESLint.Plugin["rules"]> &
    typeof runtimeCleanupRules =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Internal registry is intentionally narrowed to ESLint's plugin rule map contract.
    runtimeCleanupRules as NonNullable<ESLint.Plugin["rules"]> &
        typeof runtimeCleanupRules;

/**
 * Build an ESLint rules map that enables each provided rule at error level.
 *
 * @param ruleNames - Rule names to enable.
 *
 * @returns Rules config object compatible with flat config.
 */
function errorRulesFor(
    ruleNames: readonly RuntimeCleanupRuleName[]
): RuntimeCleanupPresetConfig["rules"] {
    const rules: RuntimeCleanupPresetConfig["rules"] = {};

    for (const ruleName of ruleNames) {
        rules[`runtime-cleanup/${ruleName}`] = "error";
    }

    return rules;
}

/** Effective per-preset rule lists after applying derived policy overlays. */
const effectivePresetRuleNamesByConfig: Readonly<
    Record<RuntimeCleanupConfigName, readonly RuntimeCleanupRuleName[]>
> = {
    all: [
        "no-floating-abort-controllers",
        "no-floating-audio-contexts",
        "no-floating-broadcast-channels",
        "no-floating-child-processes",
        "no-floating-disposable-stacks",
        "no-floating-file-watchers",
        "no-floating-geolocation-watches",
        "no-floating-infinite-animations",
        "no-floating-media-streams",
        "no-floating-message-channels",
        "no-floating-network-connections",
        "no-floating-object-urls",
        "no-floating-observers",
        "no-floating-servers",
        "no-floating-streams",
        "no-floating-timers",
        "no-floating-wake-locks",
        "no-floating-web-stream-locks",
        "no-floating-workers",
        "no-unmanaged-event-listeners",
    ],
    experimental: [],
    minimal: [],
    recommended: [
        "no-floating-abort-controllers",
        "no-floating-audio-contexts",
        "no-floating-broadcast-channels",
        "no-floating-child-processes",
        "no-floating-disposable-stacks",
        "no-floating-file-watchers",
        "no-floating-geolocation-watches",
        "no-floating-media-streams",
        "no-floating-message-channels",
        "no-floating-network-connections",
        "no-floating-object-urls",
        "no-floating-observers",
        "no-floating-servers",
        "no-floating-streams",
        "no-floating-timers",
        "no-floating-wake-locks",
        "no-floating-workers",
        "no-unmanaged-event-listeners",
    ],
    "recommended-type-checked": [
        "no-floating-abort-controllers",
        "no-floating-audio-contexts",
        "no-floating-broadcast-channels",
        "no-floating-child-processes",
        "no-floating-disposable-stacks",
        "no-floating-file-watchers",
        "no-floating-geolocation-watches",
        "no-floating-infinite-animations",
        "no-floating-media-streams",
        "no-floating-message-channels",
        "no-floating-network-connections",
        "no-floating-object-urls",
        "no-floating-observers",
        "no-floating-servers",
        "no-floating-streams",
        "no-floating-timers",
        "no-floating-wake-locks",
        "no-floating-web-stream-locks",
        "no-floating-workers",
        "no-unmanaged-event-listeners",
    ],
    strict: [
        "no-floating-abort-controllers",
        "no-floating-audio-contexts",
        "no-floating-broadcast-channels",
        "no-floating-child-processes",
        "no-floating-disposable-stacks",
        "no-floating-file-watchers",
        "no-floating-geolocation-watches",
        "no-floating-infinite-animations",
        "no-floating-media-streams",
        "no-floating-message-channels",
        "no-floating-network-connections",
        "no-floating-object-urls",
        "no-floating-observers",
        "no-floating-servers",
        "no-floating-streams",
        "no-floating-timers",
        "no-floating-wake-locks",
        "no-floating-web-stream-locks",
        "no-floating-workers",
        "no-unmanaged-event-listeners",
    ],
};

/**
 * Apply parser and plugin metadata required by all plugin presets.
 *
 * @param config - Preset-specific config fragment.
 * @param plugin - Plugin object registered under the `runtime-cleanup`
 *   namespace.
 * @param options - Preset-level wiring options.
 *
 * @returns Normalized preset config.
 */
function withRuntimeCleanupPlugin(
    config: Readonly<RuntimeCleanupPresetConfig>,
    plugin: Readonly<ESLint.Plugin>,
    options: Readonly<{ requiresTypeChecking: boolean }>
): RuntimeCleanupPresetConfig {
    const existingLanguageOptions = config.languageOptions ?? {};
    const existingParserOptions = existingLanguageOptions["parserOptions"];
    const parserOptions = normalizeParserOptions(existingParserOptions);

    if (
        options.requiresTypeChecking &&
        !objectHasOwn(parserOptions, "projectService")
    ) {
        Reflect.set(parserOptions, "projectService", true);
    }

    const languageOptions: FlatLanguageOptions = {
        ...existingLanguageOptions,
        parser: existingLanguageOptions["parser"] ?? tsParserValue,
        parserOptions,
    };

    return {
        ...config,
        files: config.files ?? [...TS_FILES],
        languageOptions,
        plugins: {
            ...config.plugins,
            "runtime-cleanup": plugin,
        },
    };
}

/** Minimal plugin object used when assembling flat-config presets. */
const pluginForConfigs: ESLint.Plugin = {
    rules: runtimeCleanupEslintRules,
};

const createPresetConfig = (
    configName: RuntimeCleanupConfigName
): RuntimeCleanupPresetConfig => {
    const configMetadata = runtimeCleanupConfigMetadataByName[configName];

    return withRuntimeCleanupPlugin(
        {
            name: configMetadata.presetName,
            rules: errorRulesFor(effectivePresetRuleNamesByConfig[configName]),
        },
        pluginForConfigs,
        {
            requiresTypeChecking: configMetadata.requiresTypeChecking,
        }
    );
};

/**
 * Flat config presets distributed by eslint-plugin-runtime-cleanup.
 */
const createRuntimeCleanupConfigsDefinition =
    (): RuntimeCleanupConfigsContract =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Object.fromEntries cannot preserve the finite preset-key union.
        objectFromEntries(
            runtimeCleanupConfigNames.map((configName) => [
                configName,
                createPresetConfig(configName),
            ])
        ) as RuntimeCleanupConfigsContract;

const runtimeCleanupConfigsDefinition = createRuntimeCleanupConfigsDefinition();

/** Finalized typed view of all exported preset configurations. */
const runtimeCleanupConfigs: RuntimeCleanupConfigsContract =
    runtimeCleanupConfigsDefinition;

/**
 * Runtime type for the plugin's generated config presets.
 *
 * @remarks
 * Mirrors `plugin.configs` and is useful when composing typed preset-aware
 * tooling in external integrations.
 */
export type RuntimeCleanupConfigs = typeof runtimeCleanupConfigs;

/**
 * Main plugin object exported for ESLint consumption.
 */
const runtimeCleanupPlugin: RuntimeCleanupPluginContract = {
    configs: runtimeCleanupConfigs,
    meta: {
        name: "eslint-plugin-runtime-cleanup",
        namespace: "runtime-cleanup",
        version: getPackageVersion(packageJson),
    },
    processors: {},
    rules: runtimeCleanupEslintRules,
};

/**
 * Runtime type for the plugin object exported as default.
 *
 * @remarks
 * Includes resolved `meta`, `rules`, and `configs` contracts after plugin
 * assembly.
 */
export type RuntimeCleanupPlugin = typeof runtimeCleanupPlugin;

/**
 * Default plugin export consumed by ESLint flat config.
 */
export default runtimeCleanupPlugin;
