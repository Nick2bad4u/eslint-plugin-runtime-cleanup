/**
 * @packageDocumentation
 * Parsing and memoization helpers for plugin-level runtime settings.
 */
import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

import { getProgramNode } from "./ast-node.js";

/** Top-level `settings` key for this plugin. */
const RUNTIME_CLEANUP_SETTINGS_KEY = "runtime-cleanup";

/** Flag that disables all plugin autofix behavior. */
const DISABLE_ALL_AUTOFIXES_KEY = "disableAllAutofixes";

/**
 * Normalized per-program settings consumed by fix-generation helpers.
 */
interface ProgramSettings {
    disableAllAutofixes: boolean;
}

/**
 * Cache of parsed settings keyed by the Program node for the active file.
 */
const settingsByProgram = new WeakMap<TSESTree.Program, ProgramSettings>();

/**
 * Narrow an unknown value to an object-like record.
 *
 * @param value - Value to narrow.
 *
 * @returns `true` when the value is a non-null, non-array object.
 */
const isObject = (
    value: unknown
): value is Readonly<Record<string, unknown>> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Extract the `settings["runtime-cleanup"]` object when present and valid.
 *
 * @param settings - ESLint settings value from rule context.
 *
 * @returns Parsed plugin settings object when valid; otherwise `null`.
 */
const getRuntimeCleanupSettings = (
    settings: unknown
): null | Readonly<Record<string, unknown>> => {
    if (!isObject(settings)) {
        return null;
    }

    const pluginSettings = settings[RUNTIME_CLEANUP_SETTINGS_KEY];

    return isObject(pluginSettings) ? pluginSettings : null;
};

/**
 * Read a strict boolean flag (`true`) from an object by key.
 *
 * @param object - Source settings object.
 * @param key - Flag key to read.
 *
 * @returns `true` only when the key exists and equals literal `true`.
 */
const readBooleanFlag = (
    object: Readonly<Record<string, unknown>>,
    key: string
): boolean => Object.hasOwn(object, key) && object[key] === true;

/**
 * Reads the global autofix disable flag from plugin settings.
 *
 * @param settings - ESLint settings value from rule context.
 *
 * @returns `true` when all plugin autofixes are explicitly disabled.
 */
const readDisableAllAutofixesFromSettings = (settings: unknown): boolean => {
    const pluginSettings = getRuntimeCleanupSettings(settings);
    if (pluginSettings === null) {
        return false;
    }

    return readBooleanFlag(pluginSettings, DISABLE_ALL_AUTOFIXES_KEY);
};

/**
 * Register parsed plugin settings for the current file program.
 *
 * @param context - Active ESLint rule context.
 *
 * @returns Memoized immutable settings for the context's program node.
 */
export const registerProgramSettingsForContext = (
    context: Readonly<TSESLint.RuleContext<string, readonly unknown[]>>
): Readonly<ProgramSettings> => {
    const programNode = context.sourceCode.ast;

    const parsedSettings: Readonly<ProgramSettings> = Object.freeze({
        disableAllAutofixes: readDisableAllAutofixesFromSettings(
            context.settings
        ),
    });

    const existingProgramSettings = settingsByProgram.get(programNode);
    if (existingProgramSettings !== undefined) {
        return existingProgramSettings;
    }

    settingsByProgram.set(programNode, parsedSettings);

    return parsedSettings;
};

/**
 * Determine whether autofixes are globally disabled for the file containing the
 * provided node.
 *
 * @param node - AST node used to resolve the enclosing Program.
 *
 * @returns `true` when fixes should be suppressed.
 */
export const areAutofixesDisabledForNode = (
    node: Readonly<TSESTree.Node>
): boolean => {
    const programNode = getProgramNode(node);
    if (programNode === null) {
        return false;
    }

    const settings = settingsByProgram.get(programNode);

    return settings?.disableAllAutofixes === true;
};
