/**
 * @packageDocumentation
 * Vitest coverage for plugin entrypoint behavior.
 */
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import { runtimeCleanupConfigNames } from "../src/_internal/runtime-cleanup-config-references";
import runtimeCleanupPlugin from "../src/plugin";

const requireFromTestModule = createRequire(import.meta.url);
const packageJson = requireFromTestModule("../package.json") as {
    version: string;
};
const expectedPluginVersion = packageJson.version;

const expectedPluginMeta = {
    name: "eslint-plugin-runtime-cleanup",
    namespace: "runtime-cleanup",
    version: expectedPluginVersion,
};
const representativeRuleNames = [
    "no-floating-child-processes",
    "no-floating-observers",
    "no-floating-timers",
    "no-floating-workers",
    "no-unmanaged-event-listeners",
] as const;

function assertConfigRegistryShape(configs: unknown): void {
    assertObjectRecord(configs, "plugin configs");

    for (const configName of runtimeCleanupConfigNames) {
        assertObjectRecord(configs[configName], `plugin config ${configName}`);
    }
}

function assertObjectRecord(
    value: unknown,
    label: string
): asserts value is Record<string, unknown> {
    expect(isObjectRecord(value)).toBe(true);

    if (!isObjectRecord(value)) {
        throw new TypeError(`${label} must be a non-array object.`);
    }
}

function assertPluginShape(plugin: unknown): void {
    assertObjectRecord(plugin, "plugin");
    assertConfigRegistryShape(plugin["configs"]);

    expect(plugin["meta"]).toStrictEqual(expectedPluginMeta);
    expect(plugin["processors"]).toStrictEqual({});

    assertRuleRegistryShape(plugin["rules"]);
}

function assertRuleRegistryShape(rules: unknown): void {
    assertObjectRecord(rules, "plugin rules");

    for (const ruleName of representativeRuleNames) {
        assertObjectRecord(rules[ruleName], `plugin rule ${ruleName}`);
    }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

describe("plugin entry module", () => {
    it("exports default plugin object with rule and config registries", () => {
        expect.hasAssertions();
        expect(Object.keys(runtimeCleanupPlugin.rules)).not.toContain(
            "prefer-type-fest-json-value"
        );

        expect(runtimeCleanupPlugin).toStrictEqual(
            expect.objectContaining({
                meta: expectedPluginMeta,
                processors: {},
            })
        );

        assertConfigRegistryShape(runtimeCleanupPlugin.configs);
        assertRuleRegistryShape(runtimeCleanupPlugin.rules);
    });

    it("exposes supported presets and registered rules", () => {
        expect.hasAssertions();
        expect(runtimeCleanupPlugin.configs).toBeTypeOf("object");
        expect(runtimeCleanupPlugin.rules).toBeTypeOf("object");

        assertConfigRegistryShape(runtimeCleanupPlugin.configs);
        assertRuleRegistryShape(runtimeCleanupPlugin.rules);
    });

    it("exports matching runtime plugin shape from plugin.mjs", async () => {
        expect.hasAssertions();

        const runtimePluginModule = await import("../plugin.mjs");

        expect(runtimePluginModule.default).toBeTypeOf("object");

        assertPluginShape(runtimePluginModule.default);
    });

    it("exports matching runtime plugin shape from dist/plugin.cjs", () => {
        expect.hasAssertions();

        const runtimePlugin = requireFromTestModule("../dist/plugin.cjs") as {
            configs?: unknown;
            meta?: unknown;
            processors?: unknown;
            rules?: unknown;
        };

        expect(runtimePlugin).toBeTypeOf("object");

        assertPluginShape(runtimePlugin);
    });

    it("resolves package default export through self-reference ESM import", async () => {
        expect.hasAssertions();

        const packageRuntimeModule =
            (await import("eslint-plugin-runtime-cleanup")) as {
                default: unknown;
            };

        expect(packageRuntimeModule.default).toBeTypeOf("object");

        assertPluginShape(packageRuntimeModule.default);
    });

    it("resolves package default export through self-reference CJS require", () => {
        expect.hasAssertions();

        const packageRuntimePlugin = requireFromTestModule(
            "eslint-plugin-runtime-cleanup"
        ) as {
            configs?: unknown;
            meta?: unknown;
            processors?: unknown;
            rules?: unknown;
        };

        expect(packageRuntimePlugin).toBeTypeOf("object");

        assertPluginShape(packageRuntimePlugin);
    });
});
