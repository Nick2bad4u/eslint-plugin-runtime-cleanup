/**
 * @packageDocumentation
 * Shared runtime-cleanup preset/config reference constants and type guards.
 */

/** Canonical flat-config preset keys exposed through `plugin.configs`. */
export const runtimeCleanupConfigNames = [
    "all",
    "experimental",
    "minimal",
    "recommended",
    "recommended-type-checked",
    "strict",
] as const;

/** Metadata contract shared across preset wiring, docs, and README rendering. */
export type RuntimeCleanupConfigMetadata = Readonly<{
    icon: string;
    presetName: `runtime-cleanup:${RuntimeCleanupConfigName}`;
    readmeOrder: number;
    requiresTypeChecking: boolean;
}>;

/** Canonical flat-config preset key type exposed through `plugin.configs`. */
export type RuntimeCleanupConfigName =
    (typeof runtimeCleanupConfigNames)[number];

/**
 * Canonical metadata for every exported `runtime-cleanup` preset key.
 */
export const runtimeCleanupConfigMetadataByName: Readonly<
    Record<RuntimeCleanupConfigName, RuntimeCleanupConfigMetadata>
> = {
    all: {
        icon: "🟣",
        presetName: "runtime-cleanup:all",
        readmeOrder: 5,
        requiresTypeChecking: true,
    },
    experimental: {
        icon: "🧪",
        presetName: "runtime-cleanup:experimental",
        readmeOrder: 6,
        requiresTypeChecking: false,
    },
    minimal: {
        icon: "🟢",
        presetName: "runtime-cleanup:minimal",
        readmeOrder: 1,
        requiresTypeChecking: false,
    },
    recommended: {
        icon: "🟡",
        presetName: "runtime-cleanup:recommended",
        readmeOrder: 2,
        requiresTypeChecking: false,
    },
    "recommended-type-checked": {
        icon: "🧬",
        presetName: "runtime-cleanup:recommended-type-checked",
        readmeOrder: 3,
        requiresTypeChecking: true,
    },
    strict: {
        icon: "🔴",
        presetName: "runtime-cleanup:strict",
        readmeOrder: 4,
        requiresTypeChecking: true,
    },
};

/** Stable README legend/rendering order for preset icons. */
export const runtimeCleanupConfigNamesByReadmeOrder: readonly RuntimeCleanupConfigName[] =
    [
        "minimal",
        "recommended",
        "recommended-type-checked",
        "strict",
        "all",
        "experimental",
    ];

/** Metadata references supported in rule `meta.docs.runtimeCleanupConfigs`. */
export const runtimeCleanupConfigReferenceToName: Readonly<{
    "runtime-cleanup.configs.all": "all";
    "runtime-cleanup.configs.experimental": "experimental";
    "runtime-cleanup.configs.minimal": "minimal";
    "runtime-cleanup.configs.recommended": "recommended";
    "runtime-cleanup.configs.recommended-type-checked": "recommended-type-checked";
    "runtime-cleanup.configs.strict": "strict";
    'runtime-cleanup.configs["recommended-type-checked"]': "recommended-type-checked";
}> = {
    "runtime-cleanup.configs.all": "all",
    "runtime-cleanup.configs.experimental": "experimental",
    "runtime-cleanup.configs.minimal": "minimal",
    "runtime-cleanup.configs.recommended": "recommended",
    "runtime-cleanup.configs.recommended-type-checked":
        "recommended-type-checked",
    "runtime-cleanup.configs.strict": "strict",
    'runtime-cleanup.configs["recommended-type-checked"]':
        "recommended-type-checked",
};

/** Fully-qualified preset reference type accepted in rule docs metadata. */
export type RuntimeCleanupConfigReference =
    keyof typeof runtimeCleanupConfigReferenceToName;

/**
 * Check whether a string is a supported rule docs preset reference.
 */
export const isRuntimeCleanupConfigReference = (
    value: string
): value is RuntimeCleanupConfigReference =>
    Object.hasOwn(runtimeCleanupConfigReferenceToName, value);
