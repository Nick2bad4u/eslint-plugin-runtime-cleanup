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
        const noFloatingObserversRuleId =
            "runtime-cleanup/no-floating-observers";
        const noFloatingTimersRuleId = "runtime-cleanup/no-floating-timers";
        const noUnmanagedEventListenersRuleId =
            "runtime-cleanup/no-unmanaged-event-listeners";
        const expectedRulesByConfig = {
            all: {
                [noFloatingObserversRuleId]: "error",
                [noFloatingTimersRuleId]: "error",
                [noUnmanagedEventListenersRuleId]: "error",
            },
            experimental: {},
            minimal: {},
            recommended: {
                [noFloatingObserversRuleId]: "error",
                [noFloatingTimersRuleId]: "error",
                [noUnmanagedEventListenersRuleId]: "error",
            },
            "recommended-type-checked": {
                [noFloatingObserversRuleId]: "error",
                [noFloatingTimersRuleId]: "error",
                [noUnmanagedEventListenersRuleId]: "error",
            },
            strict: {
                [noFloatingObserversRuleId]: "error",
                [noFloatingTimersRuleId]: "error",
                [noUnmanagedEventListenersRuleId]: "error",
            },
        } as const;

        expect(Object.keys(plugin.rules)).toStrictEqual([
            "no-floating-observers",
            "no-floating-timers",
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
