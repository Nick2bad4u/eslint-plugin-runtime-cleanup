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
            "ruleCount": 20,
            "ruleNames": [
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
                "projectService": true,
                "sourceType": "module",
              },
              "presetName": "runtime-cleanup:all",
              "ruleCount": 20,
              "ruleIds": [
                "runtime-cleanup/no-floating-abort-controllers",
                "runtime-cleanup/no-floating-audio-contexts",
                "runtime-cleanup/no-floating-broadcast-channels",
                "runtime-cleanup/no-floating-child-processes",
                "runtime-cleanup/no-floating-disposable-stacks",
                "runtime-cleanup/no-floating-file-watchers",
                "runtime-cleanup/no-floating-geolocation-watches",
                "runtime-cleanup/no-floating-infinite-animations",
                "runtime-cleanup/no-floating-media-streams",
                "runtime-cleanup/no-floating-message-channels",
                "runtime-cleanup/no-floating-network-connections",
                "runtime-cleanup/no-floating-object-urls",
                "runtime-cleanup/no-floating-observers",
                "runtime-cleanup/no-floating-servers",
                "runtime-cleanup/no-floating-streams",
                "runtime-cleanup/no-floating-timers",
                "runtime-cleanup/no-floating-wake-locks",
                "runtime-cleanup/no-floating-web-stream-locks",
                "runtime-cleanup/no-floating-workers",
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
              "ruleCount": 18,
              "ruleIds": [
                "runtime-cleanup/no-floating-abort-controllers",
                "runtime-cleanup/no-floating-audio-contexts",
                "runtime-cleanup/no-floating-broadcast-channels",
                "runtime-cleanup/no-floating-child-processes",
                "runtime-cleanup/no-floating-disposable-stacks",
                "runtime-cleanup/no-floating-file-watchers",
                "runtime-cleanup/no-floating-geolocation-watches",
                "runtime-cleanup/no-floating-media-streams",
                "runtime-cleanup/no-floating-message-channels",
                "runtime-cleanup/no-floating-network-connections",
                "runtime-cleanup/no-floating-object-urls",
                "runtime-cleanup/no-floating-observers",
                "runtime-cleanup/no-floating-servers",
                "runtime-cleanup/no-floating-streams",
                "runtime-cleanup/no-floating-timers",
                "runtime-cleanup/no-floating-wake-locks",
                "runtime-cleanup/no-floating-workers",
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
              "ruleCount": 20,
              "ruleIds": [
                "runtime-cleanup/no-floating-abort-controllers",
                "runtime-cleanup/no-floating-audio-contexts",
                "runtime-cleanup/no-floating-broadcast-channels",
                "runtime-cleanup/no-floating-child-processes",
                "runtime-cleanup/no-floating-disposable-stacks",
                "runtime-cleanup/no-floating-file-watchers",
                "runtime-cleanup/no-floating-geolocation-watches",
                "runtime-cleanup/no-floating-infinite-animations",
                "runtime-cleanup/no-floating-media-streams",
                "runtime-cleanup/no-floating-message-channels",
                "runtime-cleanup/no-floating-network-connections",
                "runtime-cleanup/no-floating-object-urls",
                "runtime-cleanup/no-floating-observers",
                "runtime-cleanup/no-floating-servers",
                "runtime-cleanup/no-floating-streams",
                "runtime-cleanup/no-floating-timers",
                "runtime-cleanup/no-floating-wake-locks",
                "runtime-cleanup/no-floating-web-stream-locks",
                "runtime-cleanup/no-floating-workers",
                "runtime-cleanup/no-unmanaged-event-listeners",
              ],
            },
            {
              "configKey": "strict",
              "parserOptions": {
                "ecmaVersion": "latest",
                "projectService": true,
                "sourceType": "module",
              },
              "presetName": "runtime-cleanup:strict",
              "ruleCount": 20,
              "ruleIds": [
                "runtime-cleanup/no-floating-abort-controllers",
                "runtime-cleanup/no-floating-audio-contexts",
                "runtime-cleanup/no-floating-broadcast-channels",
                "runtime-cleanup/no-floating-child-processes",
                "runtime-cleanup/no-floating-disposable-stacks",
                "runtime-cleanup/no-floating-file-watchers",
                "runtime-cleanup/no-floating-geolocation-watches",
                "runtime-cleanup/no-floating-infinite-animations",
                "runtime-cleanup/no-floating-media-streams",
                "runtime-cleanup/no-floating-message-channels",
                "runtime-cleanup/no-floating-network-connections",
                "runtime-cleanup/no-floating-object-urls",
                "runtime-cleanup/no-floating-observers",
                "runtime-cleanup/no-floating-servers",
                "runtime-cleanup/no-floating-streams",
                "runtime-cleanup/no-floating-timers",
                "runtime-cleanup/no-floating-wake-locks",
                "runtime-cleanup/no-floating-web-stream-locks",
                "runtime-cleanup/no-floating-workers",
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
