/**
 * @packageDocumentation
 * Snapshot coverage for stable public plugin contracts.
 */
import { describe, expect, it } from "vitest";

import runtimeCleanupPlugin from "../src/plugin";

interface ParserOptionsSnapshot {
    ecmaVersion: null | string;
    projectService: boolean;
    sourceType: null | string;
}

/** Plugin config type inferred from public plugin export. */
type PluginConfig =
    (typeof runtimeCleanupPlugin)["configs"][keyof (typeof runtimeCleanupPlugin)["configs"]];

interface PresetContractSnapshot {
    configKey: string;
    parserOptions: ParserOptionsSnapshot;
    presetName: null | string;
    ruleCount: number;
    ruleIds: readonly string[];
}

/** Guard dynamic values into object records. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

/**
 * Normalize parser options into a stable and snapshot-friendly shape.
 *
 * @param config - Public plugin preset config.
 *
 * @returns Stable parser option summary for snapshots.
 */
const getParserOptionsSnapshot = (
    config: Readonly<PluginConfig>
): ParserOptionsSnapshot => {
    const parserOptions = config.languageOptions?.["parserOptions"];

    if (!isRecord(parserOptions)) {
        return {
            ecmaVersion: null,
            projectService: false,
            sourceType: null,
        };
    }

    const ecmaVersion = parserOptions["ecmaVersion"];
    const sourceType = parserOptions["sourceType"];
    const projectService = parserOptions["projectService"];

    return {
        ecmaVersion: typeof ecmaVersion === "string" ? ecmaVersion : null,
        projectService: projectService === true,
        sourceType: typeof sourceType === "string" ? sourceType : null,
    };
};

/**
 * Collect sorted rule IDs for one config preset.
 *
 * @param config - Public plugin preset config.
 *
 * @returns Deterministically sorted qualified rule IDs.
 */
const getSortedRuleIds = (config: Readonly<PluginConfig>): readonly string[] =>
    Object.keys(config.rules).toSorted((left, right) =>
        left.localeCompare(right)
    );

/**
 * Build a stable snapshot payload for every exported preset.
 *
 * @returns Normalized preset contract snapshots sorted by config key.
 */
const getPresetContractSnapshot = (): readonly PresetContractSnapshot[] =>
    Object.entries(runtimeCleanupPlugin.configs)
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(([configKey, config]) => {
            const presetName = config.name;

            return {
                configKey,
                parserOptions: getParserOptionsSnapshot(config),
                presetName: typeof presetName === "string" ? presetName : null,
                ruleCount: getSortedRuleIds(config).length,
                ruleIds: getSortedRuleIds(config),
            };
        });

describe("plugin contract snapshots", () => {
    it("keeps stable exported rule names", () => {
        expect.hasAssertions();
        expect({
            ruleCount: Object.keys(runtimeCleanupPlugin.rules).length,
            ruleNames: Object.keys(runtimeCleanupPlugin.rules).toSorted(
                (left, right) => left.localeCompare(right)
            ),
        }).toMatchInlineSnapshot(`
          {
            "ruleCount": 3,
            "ruleNames": [
              "no-floating-observers",
              "no-floating-timers",
              "no-unmanaged-event-listeners",
            ],
          }
        `);
    });

    it("keeps stable preset contract matrix", () => {
        expect.hasAssertions();
        // eslint-disable-next-line vitest/no-large-snapshots -- The preset contract is intentionally reviewed as one stable matrix.
        expect(getPresetContractSnapshot()).toMatchInlineSnapshot(`
          [
            {
              "configKey": "all",
              "parserOptions": {
                "ecmaVersion": "latest",
                "projectService": false,
                "sourceType": "module",
              },
              "presetName": "runtime-cleanup:all",
              "ruleCount": 3,
              "ruleIds": [
                "runtime-cleanup/no-floating-observers",
                "runtime-cleanup/no-floating-timers",
                "runtime-cleanup/no-unmanaged-event-listeners",
              ],
            },
            {
              "configKey": "experimental",
              "parserOptions": {
                "ecmaVersion": "latest",
                "projectService": false,
                "sourceType": "module",
              },
              "presetName": "runtime-cleanup:experimental",
              "ruleCount": 0,
              "ruleIds": [],
            },
            {
              "configKey": "minimal",
              "parserOptions": {
                "ecmaVersion": "latest",
                "projectService": false,
                "sourceType": "module",
              },
              "presetName": "runtime-cleanup:minimal",
              "ruleCount": 0,
              "ruleIds": [],
            },
            {
              "configKey": "recommended",
              "parserOptions": {
                "ecmaVersion": "latest",
                "projectService": false,
                "sourceType": "module",
              },
              "presetName": "runtime-cleanup:recommended",
              "ruleCount": 3,
              "ruleIds": [
                "runtime-cleanup/no-floating-observers",
                "runtime-cleanup/no-floating-timers",
                "runtime-cleanup/no-unmanaged-event-listeners",
              ],
            },
            {
              "configKey": "recommended-type-checked",
              "parserOptions": {
                "ecmaVersion": "latest",
                "projectService": true,
                "sourceType": "module",
              },
              "presetName": "runtime-cleanup:recommended-type-checked",
              "ruleCount": 3,
              "ruleIds": [
                "runtime-cleanup/no-floating-observers",
                "runtime-cleanup/no-floating-timers",
                "runtime-cleanup/no-unmanaged-event-listeners",
              ],
            },
            {
              "configKey": "strict",
              "parserOptions": {
                "ecmaVersion": "latest",
                "projectService": false,
                "sourceType": "module",
              },
              "presetName": "runtime-cleanup:strict",
              "ruleCount": 3,
              "ruleIds": [
                "runtime-cleanup/no-floating-observers",
                "runtime-cleanup/no-floating-timers",
                "runtime-cleanup/no-unmanaged-event-listeners",
              ],
            },
          ]
        `);
    });

    it("keeps stable plugin identity metadata", () => {
        expect.hasAssertions();
        expect({
            name: runtimeCleanupPlugin.meta.name,
            namespace: runtimeCleanupPlugin.meta.namespace,
        }).toMatchInlineSnapshot(`
          {
            "name": "eslint-plugin-runtime-cleanup",
            "namespace": "runtime-cleanup",
          }
        `);
    });
});
