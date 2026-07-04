/**
 * @packageDocumentation
 * Vitest coverage for exported flat-config preset behavior.
 */
import tsParser from "@typescript-eslint/parser";
import { ESLint } from "eslint";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

import {
    runtimeCleanupConfigMetadataByName,
    runtimeCleanupConfigNames,
} from "../src/_internal/runtime-cleanup-config-references";
import runtimeCleanupPlugin from "../src/plugin";

const jsAndTsFiles = ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"] as const;
const typeCheckedFiles = ["**/*.{ts,tsx,mts,cts}"] as const;

interface FlatConfigLike {
    files?: unknown;
    languageOptions?: Record<string, unknown> & {
        parser?: unknown;
        parserOptions?: unknown;
    };
    name?: unknown;
    plugins?: Record<string, unknown>;
    rules?: Record<string, unknown>;
}

/**
 * Resolve a named plugin preset config from a dynamic `plugin.configs` map.
 *
 * @param configs - Dynamic plugin configs record.
 * @param configName - Preset key to resolve.
 *
 * @returns Parsed flat-config-like preset when present and object-shaped.
 */
function getConfig(
    configs: Readonly<null | Record<string, unknown>>,
    configName: string
): FlatConfigLike | undefined {
    const config = configs?.[configName];

    return isObject(config) ? config : undefined;
}

/**
 * Check whether a dynamic value is an object-like record.
 *
 * @param value - Runtime value under inspection.
 *
 * @returns `true` when value is object-like, non-null, and not an array.
 */
function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireConfig(
    configs: Readonly<null | Record<string, unknown>>,
    configName: string
): FlatConfigLike {
    const config = getConfig(configs, configName);

    if (config === undefined) {
        throw new TypeError(`Expected config '${configName}' to be exported.`);
    }

    return config;
}

describe("runtime-cleanup plugin configs", () => {
    const configs = isObject(runtimeCleanupPlugin.configs)
        ? runtimeCleanupPlugin.configs
        : null;
    const noFloatingAbortControllersRuleId =
        "runtime-cleanup/no-floating-abort-controllers";
    const noFloatingAudioContextsRuleId =
        "runtime-cleanup/no-floating-audio-contexts";
    const noFloatingBroadcastChannelsRuleId =
        "runtime-cleanup/no-floating-broadcast-channels";
    const noFloatingDisposableStacksRuleId =
        "runtime-cleanup/no-floating-disposable-stacks";
    const noFloatingFileWatchersRuleId =
        "runtime-cleanup/no-floating-file-watchers";
    const noFloatingGeolocationWatchesRuleId =
        "runtime-cleanup/no-floating-geolocation-watches";
    const noFloatingInfiniteAnimationsRuleId =
        "runtime-cleanup/no-floating-infinite-animations";
    const noFloatingMessageChannelsRuleId =
        "runtime-cleanup/no-floating-message-channels";
    const noFloatingMediaStreamsRuleId =
        "runtime-cleanup/no-floating-media-streams";
    const noFloatingNetworkConnectionsRuleId =
        "runtime-cleanup/no-floating-network-connections";
    const noFloatingObjectUrlsRuleId =
        "runtime-cleanup/no-floating-object-urls";
    const noFloatingObserversRuleId = "runtime-cleanup/no-floating-observers";
    const noFloatingServersRuleId = "runtime-cleanup/no-floating-servers";
    const noFloatingStreamsRuleId = "runtime-cleanup/no-floating-streams";
    const noFloatingChildProcessesRuleId =
        "runtime-cleanup/no-floating-child-processes";
    const noFloatingTimersRuleId = "runtime-cleanup/no-floating-timers";
    const noFloatingWakeLocksRuleId = "runtime-cleanup/no-floating-wake-locks";
    const noFloatingWebStreamLocksRuleId =
        "runtime-cleanup/no-floating-web-stream-locks";
    const noFloatingWorkersRuleId = "runtime-cleanup/no-floating-workers";
    const noUnmanagedEventListenersRuleId =
        "runtime-cleanup/no-unmanaged-event-listeners";
    const expectedRulesByConfig = {
        all: {
            [noFloatingAbortControllersRuleId]: "error",
            [noFloatingAudioContextsRuleId]: "error",
            [noFloatingBroadcastChannelsRuleId]: "error",
            [noFloatingChildProcessesRuleId]: "error",
            [noFloatingDisposableStacksRuleId]: "error",
            [noFloatingFileWatchersRuleId]: "error",
            [noFloatingGeolocationWatchesRuleId]: "error",
            [noFloatingInfiniteAnimationsRuleId]: "error",
            [noFloatingMediaStreamsRuleId]: "error",
            [noFloatingMessageChannelsRuleId]: "error",
            [noFloatingNetworkConnectionsRuleId]: "error",
            [noFloatingObjectUrlsRuleId]: "error",
            [noFloatingObserversRuleId]: "error",
            [noFloatingServersRuleId]: "error",
            [noFloatingStreamsRuleId]: "error",
            [noFloatingTimersRuleId]: "error",
            [noFloatingWakeLocksRuleId]: "error",
            [noFloatingWebStreamLocksRuleId]: "error",
            [noFloatingWorkersRuleId]: "error",
            [noUnmanagedEventListenersRuleId]: "error",
        },
        experimental: {},
        minimal: {},
        recommended: {
            [noFloatingAbortControllersRuleId]: "error",
            [noFloatingAudioContextsRuleId]: "error",
            [noFloatingBroadcastChannelsRuleId]: "error",
            [noFloatingChildProcessesRuleId]: "error",
            [noFloatingDisposableStacksRuleId]: "error",
            [noFloatingFileWatchersRuleId]: "error",
            [noFloatingGeolocationWatchesRuleId]: "error",
            [noFloatingMediaStreamsRuleId]: "error",
            [noFloatingMessageChannelsRuleId]: "error",
            [noFloatingNetworkConnectionsRuleId]: "error",
            [noFloatingObjectUrlsRuleId]: "error",
            [noFloatingObserversRuleId]: "error",
            [noFloatingServersRuleId]: "error",
            [noFloatingStreamsRuleId]: "error",
            [noFloatingTimersRuleId]: "error",
            [noFloatingWakeLocksRuleId]: "error",
            [noFloatingWorkersRuleId]: "error",
            [noUnmanagedEventListenersRuleId]: "error",
        },
        "recommended-type-checked": {
            [noFloatingAbortControllersRuleId]: "error",
            [noFloatingAudioContextsRuleId]: "error",
            [noFloatingBroadcastChannelsRuleId]: "error",
            [noFloatingChildProcessesRuleId]: "error",
            [noFloatingDisposableStacksRuleId]: "error",
            [noFloatingFileWatchersRuleId]: "error",
            [noFloatingGeolocationWatchesRuleId]: "error",
            [noFloatingInfiniteAnimationsRuleId]: "error",
            [noFloatingMediaStreamsRuleId]: "error",
            [noFloatingMessageChannelsRuleId]: "error",
            [noFloatingNetworkConnectionsRuleId]: "error",
            [noFloatingObjectUrlsRuleId]: "error",
            [noFloatingObserversRuleId]: "error",
            [noFloatingServersRuleId]: "error",
            [noFloatingStreamsRuleId]: "error",
            [noFloatingTimersRuleId]: "error",
            [noFloatingWakeLocksRuleId]: "error",
            [noFloatingWebStreamLocksRuleId]: "error",
            [noFloatingWorkersRuleId]: "error",
            [noUnmanagedEventListenersRuleId]: "error",
        },
        strict: {
            [noFloatingAbortControllersRuleId]: "error",
            [noFloatingAudioContextsRuleId]: "error",
            [noFloatingBroadcastChannelsRuleId]: "error",
            [noFloatingChildProcessesRuleId]: "error",
            [noFloatingDisposableStacksRuleId]: "error",
            [noFloatingFileWatchersRuleId]: "error",
            [noFloatingGeolocationWatchesRuleId]: "error",
            [noFloatingInfiniteAnimationsRuleId]: "error",
            [noFloatingMediaStreamsRuleId]: "error",
            [noFloatingMessageChannelsRuleId]: "error",
            [noFloatingNetworkConnectionsRuleId]: "error",
            [noFloatingObjectUrlsRuleId]: "error",
            [noFloatingObserversRuleId]: "error",
            [noFloatingServersRuleId]: "error",
            [noFloatingStreamsRuleId]: "error",
            [noFloatingTimersRuleId]: "error",
            [noFloatingWakeLocksRuleId]: "error",
            [noFloatingWebStreamLocksRuleId]: "error",
            [noFloatingWorkersRuleId]: "error",
            [noUnmanagedEventListenersRuleId]: "error",
        },
    } as const satisfies Record<string, Record<string, "error">>;

    it("exports exactly the supported config keys", () => {
        expect.hasAssertions();

        const keys = Object.keys(configs ?? {});

        expect(keys).toHaveLength(runtimeCleanupConfigNames.length);
        expect(new Set(keys)).toStrictEqual(new Set(runtimeCleanupConfigNames));
    });

    it("keeps languageOptions objects isolated per preset", () => {
        expect.hasAssertions();

        const recommendedPresetConfig = requireConfig(configs, "recommended");
        const strictPresetConfig = requireConfig(configs, "strict");
        const allPresetConfig = requireConfig(configs, "all");

        expect(recommendedPresetConfig.languageOptions).not.toBe(
            strictPresetConfig.languageOptions
        );
        expect(recommendedPresetConfig.languageOptions).not.toBe(
            allPresetConfig.languageOptions
        );

        expect(recommendedPresetConfig.languageOptions?.parserOptions).not.toBe(
            strictPresetConfig.languageOptions?.parserOptions
        );
        expect(strictPresetConfig.languageOptions?.parserOptions).not.toBe(
            allPresetConfig.languageOptions?.parserOptions
        );
    });

    it("every exported config registers plugin and TypeScript parser defaults", () => {
        expect.hasAssertions();

        for (const configName of runtimeCleanupConfigNames) {
            const config = requireConfig(configs, configName);
            const expectedFiles = runtimeCleanupConfigMetadataByName[configName]
                .requiresTypeChecking
                ? [...typeCheckedFiles]
                : [...jsAndTsFiles];

            expect(config).toStrictEqual(
                expect.objectContaining({
                    files: expectedFiles,
                    plugins: expect.objectContaining({
                        "runtime-cleanup": expect.anything(),
                    }),
                })
            );
            expect(isObject(config.rules)).toBe(true);

            expect(config.languageOptions).toStrictEqual(
                expect.objectContaining({
                    parser: expect.anything(),
                    parserOptions: expect.objectContaining({
                        ecmaVersion: "latest",
                        sourceType: "module",
                    }),
                })
            );
        }
    });

    it("enables the expected rules for each preset", () => {
        expect.hasAssertions();

        for (const configName of runtimeCleanupConfigNames) {
            const config = requireConfig(configs, configName);

            expect(config.rules).toStrictEqual(
                expectedRulesByConfig[configName]
            );
        }
    });

    it("does not enable parser projectService from exported presets", () => {
        expect.hasAssertions();

        for (const configName of runtimeCleanupConfigNames) {
            const config = requireConfig(configs, configName);

            const parserOptions = config.languageOptions?.parserOptions;
            const hasProjectServiceEnabled =
                isObject(parserOptions) &&
                parserOptions["projectService"] === true;

            expect(hasProjectServiceEnabled).toBe(false);
        }
    });

    it("runs type-aware preset rules when the consumer config owns projectService", async () => {
        expect.hasAssertions();

        const lintFilePath = path.join(
            process.cwd(),
            "typed-rule-consumer-config.ts"
        );
        const eslint = new ESLint({
            ignore: false,
            overrideConfig: [
                {
                    files: ["**/*.{ts,tsx,mts,cts}"],
                    languageOptions: {
                        parser: tsParser,
                        parserOptions: {
                            ecmaVersion: "latest",
                            projectService: {
                                allowDefaultProject: [
                                    "typed-rule-consumer-config.ts",
                                ],
                                defaultProject: "tsconfig.eslint.json",
                            },
                            sourceType: "module",
                            tsconfigRootDir: process.cwd(),
                        },
                    },
                },
                runtimeCleanupPlugin.configs["recommended-type-checked"],
            ],
            overrideConfigFile: true,
        });

        const results = await eslint.lintText(
            "document.body.animate([], { iterations: Infinity });",
            { filePath: lintFilePath }
        );

        expect(results).toStrictEqual([
            expect.objectContaining({
                messages: expect.arrayContaining([
                    expect.objectContaining({
                        ruleId: "runtime-cleanup/no-floating-infinite-animations",
                    }),
                ]),
            }),
        ]);
    });
});
