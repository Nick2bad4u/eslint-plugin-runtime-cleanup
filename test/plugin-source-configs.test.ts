/**
 * @packageDocumentation
 * Integration coverage for source-level plugin preset wiring.
 */
import { describe, expect, it, vi } from "vitest";

import {
    runtimeCleanupConfigMetadataByName,
    runtimeCleanupConfigNames,
} from "../src/_internal/runtime-cleanup-config-references";

/** Import `src/plugin` fresh for each assertion set. */
const loadSourcePlugin = async () => {
    vi.resetModules();
    const pluginModule = await import("../src/plugin");
    return pluginModule.default;
};

describe("source plugin config wiring", () => {
    it("builds source presets from registered rules", async () => {
        expect.hasAssertions();

        const plugin = await loadSourcePlugin();
        const noFloatingAbortControllersRuleId =
            "runtime-cleanup/no-floating-abort-controllers";
        const noFloatingBroadcastChannelsRuleId =
            "runtime-cleanup/no-floating-broadcast-channels";
        const noFloatingDisposableStacksRuleId =
            "runtime-cleanup/no-floating-disposable-stacks";
        const noFloatingFileWatchersRuleId =
            "runtime-cleanup/no-floating-file-watchers";
        const noFloatingGeolocationWatchesRuleId =
            "runtime-cleanup/no-floating-geolocation-watches";
        const noFloatingMessageChannelsRuleId =
            "runtime-cleanup/no-floating-message-channels";
        const noFloatingMediaStreamsRuleId =
            "runtime-cleanup/no-floating-media-streams";
        const noFloatingNetworkConnectionsRuleId =
            "runtime-cleanup/no-floating-network-connections";
        const noFloatingObserversRuleId =
            "runtime-cleanup/no-floating-observers";
        const noFloatingServersRuleId = "runtime-cleanup/no-floating-servers";
        const noFloatingStreamsRuleId = "runtime-cleanup/no-floating-streams";
        const noFloatingChildProcessesRuleId =
            "runtime-cleanup/no-floating-child-processes";
        const noFloatingTimersRuleId = "runtime-cleanup/no-floating-timers";
        const noFloatingWakeLocksRuleId =
            "runtime-cleanup/no-floating-wake-locks";
        const noFloatingWorkersRuleId = "runtime-cleanup/no-floating-workers";
        const noUnmanagedEventListenersRuleId =
            "runtime-cleanup/no-unmanaged-event-listeners";
        const expectedRulesByConfig = {
            all: {
                [noFloatingAbortControllersRuleId]: "error",
                [noFloatingBroadcastChannelsRuleId]: "error",
                [noFloatingChildProcessesRuleId]: "error",
                [noFloatingDisposableStacksRuleId]: "error",
                [noFloatingFileWatchersRuleId]: "error",
                [noFloatingGeolocationWatchesRuleId]: "error",
                [noFloatingMediaStreamsRuleId]: "error",
                [noFloatingMessageChannelsRuleId]: "error",
                [noFloatingNetworkConnectionsRuleId]: "error",
                [noFloatingObserversRuleId]: "error",
                [noFloatingServersRuleId]: "error",
                [noFloatingStreamsRuleId]: "error",
                [noFloatingTimersRuleId]: "error",
                [noFloatingWakeLocksRuleId]: "error",
                [noFloatingWorkersRuleId]: "error",
                [noUnmanagedEventListenersRuleId]: "error",
            },
            experimental: {},
            minimal: {},
            recommended: {
                [noFloatingAbortControllersRuleId]: "error",
                [noFloatingBroadcastChannelsRuleId]: "error",
                [noFloatingChildProcessesRuleId]: "error",
                [noFloatingDisposableStacksRuleId]: "error",
                [noFloatingFileWatchersRuleId]: "error",
                [noFloatingGeolocationWatchesRuleId]: "error",
                [noFloatingMediaStreamsRuleId]: "error",
                [noFloatingMessageChannelsRuleId]: "error",
                [noFloatingNetworkConnectionsRuleId]: "error",
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
                [noFloatingBroadcastChannelsRuleId]: "error",
                [noFloatingChildProcessesRuleId]: "error",
                [noFloatingDisposableStacksRuleId]: "error",
                [noFloatingFileWatchersRuleId]: "error",
                [noFloatingGeolocationWatchesRuleId]: "error",
                [noFloatingMediaStreamsRuleId]: "error",
                [noFloatingMessageChannelsRuleId]: "error",
                [noFloatingNetworkConnectionsRuleId]: "error",
                [noFloatingObserversRuleId]: "error",
                [noFloatingServersRuleId]: "error",
                [noFloatingStreamsRuleId]: "error",
                [noFloatingTimersRuleId]: "error",
                [noFloatingWakeLocksRuleId]: "error",
                [noFloatingWorkersRuleId]: "error",
                [noUnmanagedEventListenersRuleId]: "error",
            },
            strict: {
                [noFloatingAbortControllersRuleId]: "error",
                [noFloatingBroadcastChannelsRuleId]: "error",
                [noFloatingChildProcessesRuleId]: "error",
                [noFloatingDisposableStacksRuleId]: "error",
                [noFloatingFileWatchersRuleId]: "error",
                [noFloatingGeolocationWatchesRuleId]: "error",
                [noFloatingMediaStreamsRuleId]: "error",
                [noFloatingMessageChannelsRuleId]: "error",
                [noFloatingNetworkConnectionsRuleId]: "error",
                [noFloatingObserversRuleId]: "error",
                [noFloatingServersRuleId]: "error",
                [noFloatingStreamsRuleId]: "error",
                [noFloatingTimersRuleId]: "error",
                [noFloatingWakeLocksRuleId]: "error",
                [noFloatingWorkersRuleId]: "error",
                [noUnmanagedEventListenersRuleId]: "error",
            },
        } as const;

        expect(Object.keys(plugin.rules)).toStrictEqual([
            "no-floating-abort-controllers",
            "no-floating-broadcast-channels",
            "no-floating-child-processes",
            "no-floating-disposable-stacks",
			"no-floating-file-watchers",
			"no-floating-geolocation-watches",
			"no-floating-media-streams",
			"no-floating-message-channels",
			"no-floating-network-connections",
            "no-floating-observers",
            "no-floating-servers",
            "no-floating-streams",
            "no-floating-timers",
            "no-floating-wake-locks",
            "no-floating-workers",
            "no-unmanaged-event-listeners",
        ]);

        for (const configName of runtimeCleanupConfigNames) {
            expect(plugin.configs[configName].name).toBe(
                runtimeCleanupConfigMetadataByName[configName].presetName
            );
            expect(plugin.configs[configName].rules).toStrictEqual(
                expectedRulesByConfig[configName]
            );
        }

        expect(plugin.meta.name).toBe("eslint-plugin-runtime-cleanup");
        expect(plugin.meta.namespace).toBe("runtime-cleanup");
    });

    it("registers parser defaults, files, and plugin namespace", async () => {
        expect.hasAssertions();

        const plugin = await loadSourcePlugin();
        const recommendedConfig = plugin.configs.recommended;

        expect(recommendedConfig.files).toStrictEqual([
            "**/*.{ts,tsx,mts,cts}",
        ]);
        expect(recommendedConfig.plugins).toHaveProperty("runtime-cleanup");
        expect(recommendedConfig.plugins?.["runtime-cleanup"]).toHaveProperty(
            "rules"
        );
        expect(recommendedConfig.languageOptions).toHaveProperty("parser");
        expect(recommendedConfig.languageOptions).toHaveProperty(
            "parserOptions"
        );
        expect(
            recommendedConfig.languageOptions?.["parserOptions"]
        ).toStrictEqual({
            ecmaVersion: "latest",
            sourceType: "module",
        });

        for (const configName of runtimeCleanupConfigNames) {
            const parserOptions =
                plugin.configs[configName].languageOptions?.["parserOptions"];

            expect(parserOptions).toStrictEqual(
                expect.objectContaining({
                    ecmaVersion: "latest",
                    sourceType: "module",
                })
            );

            const hasProjectServiceEnabled =
                typeof parserOptions === "object" &&
                parserOptions !== null &&
                "projectService" in parserOptions &&
                Reflect.get(parserOptions, "projectService") === true;

            expect(hasProjectServiceEnabled).toBe(
                runtimeCleanupConfigMetadataByName[configName]
                    .requiresTypeChecking
            );
        }
    });
});
