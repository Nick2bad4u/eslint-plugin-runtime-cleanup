/**
 * Synchronize or validate the README rules matrix from canonical rule metadata.
 */
/* eslint-disable jsdoc/require-throws -- Sync script failures intentionally surface as thrown CLI errors. */
// @ts-check

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import builtPlugin from "../dist/plugin.js";
import {
    runtimeCleanupConfigMetadataByName,
    runtimeCleanupConfigNamesByReadmeOrder,
    runtimeCleanupConfigReferenceToName,
} from "../dist/_internal/runtime-cleanup-config-references.js";

/**
 * @typedef {Readonly<{
 *     meta?:
 *         | {
 *               docs?:
 *                   | {
 *                         runtimeCleanupConfigs?: readonly string[] | string;
 *                         url?: string | undefined;
 *                     }
 *                   | undefined;
 *               fixable?: string | undefined;
 *               hasSuggestions?: boolean | undefined;
 *           }
 *         | undefined;
 * }>} ReadmeRuleModule
 */

/** @typedef {Readonly<Record<string, ReadmeRuleModule>>} ReadmeRulesMap */

/** @typedef {import("../dist/_internal/runtime-cleanup-config-references.js").RuntimeCleanupConfigName} PresetName */

const presetOrder = [...runtimeCleanupConfigNamesByReadmeOrder];
const presetNameSet = new Set(presetOrder);

const rulesSectionHeading = "## Rules";
const PRESET_DOCS_URL_BASE =
    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/presets";

/**
 * @param {string} markdown
 *
 * @returns {"\n" | "\r\n"}
 */
const detectLineEnding = (markdown) =>
    markdown.includes("\r\n") ? "\r\n" : "\n";

/**
 * @param {string} markdown
 * @param {"\n" | "\r\n"} lineEnding
 *
 * @returns {string}
 */
const normalizeMarkdownLineEndings = (markdown, lineEnding) =>
    markdown.replace(/\r?\n/gv, lineEnding);

/**
 * Locate the rules section bounds within README markdown.
 *
 * @param {string} markdown
 *
 * @returns {Readonly<{ endOffset: number; startOffset: number }>}
 */
const getReadmeRulesSectionBounds = (markdown) => {
    const startOffset = markdown.indexOf(rulesSectionHeading);

    if (startOffset < 0) {
        throw new Error("README.md is missing the '## Rules' section heading.");
    }

    const nextHeadingOffset = markdown.indexOf(
        "\n## ",
        startOffset + rulesSectionHeading.length
    );

    return {
        endOffset: nextHeadingOffset < 0 ? markdown.length : nextHeadingOffset,
        startOffset,
    };
};

/**
 * Extract the README rules section without including the blank separator line
 * that belongs to the following section.
 *
 * @param {string} markdown
 *
 * @returns {string}
 */
export const extractReadmeRulesSection = (markdown) => {
    const { endOffset, startOffset } = getReadmeRulesSectionBounds(markdown);

    return markdown.slice(startOffset, endOffset);
};

/**
 * Normalize markdown table row spacing so formatter-aligned columns compare
 * equivalently to compact generated rows.
 *
 * @param {string} markdown
 *
 * @returns {string}
 */
export const normalizeRulesSectionMarkdown = (markdown) =>
    markdown
        .replaceAll("\r\n", "\n")
        .split("\n")
        .map((line) => {
            const trimmedLine = line.trimEnd();

            if (!/^\|.*\|$/v.test(trimmedLine)) {
                return trimmedLine;
            }

            const cells = trimmedLine
                .split("|")
                .slice(1, -1)
                .map((cell) => {
                    const trimmedCell = cell.trim();

                    if (!/^:?-+:?$/v.test(trimmedCell)) {
                        return trimmedCell;
                    }

                    const hasStartColon = trimmedCell.startsWith(":");
                    const hasEndColon = trimmedCell.endsWith(":");

                    if (hasStartColon && hasEndColon) {
                        return ":-:";
                    }

                    if (hasStartColon) {
                        return ":--";
                    }

                    if (hasEndColon) {
                        return "--:";
                    }

                    return "---";
                });

            return `| ${cells.join(" | ")} |`;
        })
        .join("\n")
        .trimEnd();

/** @type {Readonly<Record<PresetName, string>>} */
const presetDocsSlugByName = {
    all: "all",
    experimental: "experimental",
    minimal: "minimal",
    recommended: "recommended",
    "recommended-type-checked": "recommended-type-checked",
    strict: "strict",
};

/** @type {Readonly<Record<PresetName, string>>} */
const presetConfigReferenceByName = {
    all: "runtime-cleanup.configs.all",
    experimental: "runtime-cleanup.configs.experimental",
    minimal: "runtime-cleanup.configs.minimal",
    recommended: "runtime-cleanup.configs.recommended",
    "recommended-type-checked":
        'runtime-cleanup.configs["recommended-type-checked"]',
    strict: "runtime-cleanup.configs.strict",
};

/**
 * @param {PresetName} presetName
 *
 * @returns {string}
 */
const createPresetDocsUrl = (presetName) =>
    `${PRESET_DOCS_URL_BASE}/${presetDocsSlugByName[presetName]}`;

/**
 * @returns {readonly string[]}
 */
const createPresetLegendLines = () =>
    presetOrder.map((presetName) => {
        const docsUrl = createPresetDocsUrl(presetName);
        const presetIcon = runtimeCleanupConfigMetadataByName[presetName].icon;
        const configReference = presetConfigReferenceByName[presetName];

        return `  - [${presetIcon}](${docsUrl}) - [\`${configReference}\`](${docsUrl})`;
    });

/**
 * @param {string} reference
 *
 * @returns {null | PresetName}
 */
const normalizeRuntimeCleanupConfigName = (reference) => {
    if (Object.hasOwn(runtimeCleanupConfigReferenceToName, reference)) {
        const referenceKey =
            /** @type {keyof typeof runtimeCleanupConfigReferenceToName} */ (
                reference
            );

        return runtimeCleanupConfigReferenceToName[referenceKey];
    }

    const presetName = /** @type {PresetName} */ (reference);

    return presetNameSet.has(presetName) ? presetName : null;
};

/**
 * @param {readonly string[] | string | undefined} runtimeCleanupConfigs
 *
 * @returns {readonly PresetName[]}
 */
const normalizeRuntimeCleanupConfigNames = (runtimeCleanupConfigs) => {
    const references = Array.isArray(runtimeCleanupConfigs)
        ? runtimeCleanupConfigs
        : [runtimeCleanupConfigs];

    /** @type {PresetName[]} */
    const names = [];
    /** @type {Set<PresetName>} */
    const seenPresetNames = new Set();

    for (const reference of references) {
        if (typeof reference !== "string") {
            continue;
        }

        const configName = normalizeRuntimeCleanupConfigName(reference);

        if (configName === null || !presetNameSet.has(configName)) {
            continue;
        }

        if (!seenPresetNames.has(configName)) {
            seenPresetNames.add(configName);
            names.push(configName);
        }
    }

    return names;
};

/**
 * @param {ReadmeRuleModule} ruleModule
 *
 * @returns {"-" | "fix" | "suggest" | "fix suggest"}
 */
const getRuleFixIndicator = (ruleModule) => {
    const fixable = ruleModule.meta?.fixable === "code";
    const hasSuggestions = ruleModule.meta?.hasSuggestions === true;

    if (fixable && hasSuggestions) {
        return "fix suggest";
    }

    if (fixable) {
        return "fix";
    }

    if (hasSuggestions) {
        return "suggest";
    }

    return "-";
};

/**
 * @param {ReadmeRuleModule} ruleModule
 *
 * @returns {string}
 */
const getPresetIndicator = (ruleModule) => {
    const docsRuntimeCleanupConfigs =
        ruleModule.meta?.docs?.runtimeCleanupConfigs;
    const presetNames = normalizeRuntimeCleanupConfigNames(
        docsRuntimeCleanupConfigs
    );
    const presetNamesSet = new Set(presetNames);

    /** @type {string[]} */
    const icons = [];

    for (const presetName of presetOrder) {
        if (presetNamesSet.has(presetName)) {
            const docsUrl = createPresetDocsUrl(presetName);
            const presetIcon =
                runtimeCleanupConfigMetadataByName[presetName].icon;

            icons.push(`[${presetIcon}](${docsUrl})`);
        }
    }

    return icons.length === 0 ? "-" : icons.join(" ");
};

/**
 * @param {readonly [string, ReadmeRuleModule]} entry
 *
 * @returns {string}
 */
const toRuleTableRow = ([ruleName, ruleModule]) => {
    const docsUrl = ruleModule.meta?.docs?.url;

    if (typeof docsUrl !== "string" || docsUrl.trim().length === 0) {
        throw new TypeError(`Rule '${ruleName}' is missing meta.docs.url.`);
    }

    return `| [\`${ruleName}\`](${docsUrl}) | ${getRuleFixIndicator(ruleModule)} | ${getPresetIndicator(ruleModule)} |`;
};

/**
 * Generate the canonical README rules section from plugin rules metadata.
 *
 * @param {ReadmeRulesMap} rules - Plugin `rules` map.
 *
 * @returns {string} Full markdown section text starting at `## Rules`.
 */
export const generateReadmeRulesSectionFromRules = (rules) => {
    const ruleEntries = Object.entries(rules).toSorted((left, right) =>
        left[0].localeCompare(right[0])
    );

    const rows = ruleEntries.map(toRuleTableRow);
    const intro =
        rows.length === 0
            ? "No runtime-cleanup rules are published yet. The package currently exposes the plugin runtime, preset surfaces, docs structure, and quality gates without carrying over template rule behavior."
            : "Runtime-cleanup rules are listed below. Each rule documents the exact resource-lifetime pattern it enforces.";

    return [
        "## Rules",
        "",
        intro,
        "",
        "- `Fix` legend:",
        "  - `fix` = autofixable",
        "  - `suggest` = suggestions available",
        "  - `-` = report only",
        "- `Preset emoji` legend:",
        ...createPresetLegendLines(),
        "",
        "| Rule | Fix | Presets |",
        "| --- | :-: | :-- |",
        ...(rows.length === 0 ? ["| - | - | - |"] : rows),
        "",
    ].join("\n");
};

/**
 * Synchronize the README rules table with canonical plugin metadata.
 *
 * @param {{ writeChanges: boolean }} input
 *
 * @returns {Promise<Readonly<{ changed: boolean }>>}
 */
export const syncReadmeRulesTable = async ({ writeChanges }) => {
    const workspaceRoot = resolve(fileURLToPath(import.meta.url), "../..");
    const readmePath = resolve(workspaceRoot, "README.md");
    const readmeText = await readFile(readmePath, "utf8");
    const lineEnding = detectLineEnding(readmeText);

    const { endOffset, startOffset } = getReadmeRulesSectionBounds(readmeText);
    const readmePrefix = readmeText.slice(0, startOffset).trimEnd();
    const readmeSuffix = readmeText.slice(endOffset);

    const generatedRulesSection = generateReadmeRulesSectionFromRules(
        /** @type {ReadmeRulesMap} */ (builtPlugin.rules)
    );

    const existingRulesSection = extractReadmeRulesSection(readmeText);

    if (
        normalizeRulesSectionMarkdown(existingRulesSection) ===
        normalizeRulesSectionMarkdown(generatedRulesSection)
    ) {
        return {
            changed: false,
        };
    }

    const nextReadmeText = normalizeMarkdownLineEndings(
        `${readmePrefix}\n\n${generatedRulesSection}${readmeSuffix}`,
        lineEnding
    );

    if (readmeText === nextReadmeText) {
        return {
            changed: false,
        };
    }

    if (!writeChanges) {
        return {
            changed: true,
        };
    }

    await writeFile(readmePath, nextReadmeText, "utf8");

    return {
        changed: true,
    };
};

const runCli = async () => {
    const writeChanges = process.argv.includes("--write");
    const result = await syncReadmeRulesTable({ writeChanges });

    if (!result.changed) {
        console.log("README rules table is already synchronized.");

        return;
    }

    if (writeChanges) {
        console.log("README rules table synchronized from plugin metadata.");

        return;
    }

    console.error(
        "README rules table is out of sync. Run: npm run sync:readme-rules-table:write (or npm run sync:readme-rules-table:update to refresh snapshots too)."
    );
    process.exitCode = 1;
};

if (
    typeof process.argv[1] === "string" &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    await runCli();
}

/* eslint-enable jsdoc/require-throws */
