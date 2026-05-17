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

const expectedConfigRegistryShape = expect.objectContaining(
    Object.fromEntries(
        runtimeCleanupConfigNames.map((configName) => [
            configName,
            expect.any(Object),
        ])
    )
);

const expectedPluginMeta = {
    name: "eslint-plugin-runtime-cleanup",
    namespace: "runtime-cleanup",
    version: expectedPluginVersion,
};
const expectedRuleRegistryShape = expect.objectContaining({
    "no-floating-child-processes": expect.any(Object),
    "no-floating-observers": expect.any(Object),
    "no-floating-timers": expect.any(Object),
    "no-floating-workers": expect.any(Object),
    "no-unmanaged-event-listeners": expect.any(Object),
});

describe("plugin entry module", () => {
    it("exports default plugin object with rule and config registries", () => {
        expect.hasAssertions();
        expect(runtimeCleanupPlugin).toStrictEqual(
            expect.objectContaining({
                configs: expect.any(Object),
                meta: expectedPluginMeta,
                processors: {},
                rules: expectedRuleRegistryShape,
            })
        );
    });

    it("exposes supported presets and registered rules", () => {
        expect.hasAssertions();
        expect(runtimeCleanupPlugin.configs).toStrictEqual(
            expectedConfigRegistryShape
        );
        expect(runtimeCleanupPlugin.rules).toStrictEqual(
            expectedRuleRegistryShape
        );
    });

    it("exports matching runtime plugin shape from plugin.mjs", async () => {
        expect.hasAssertions();

        const runtimePluginModule = (await import("../plugin.mjs")) as {
            default: unknown;
        };

        expect(runtimePluginModule.default).toStrictEqual(
            expect.objectContaining({
                configs: expect.any(Object),
                meta: expectedPluginMeta,
                processors: {},
                rules: expectedRuleRegistryShape,
            })
        );
    });

    it("exports matching runtime plugin shape from dist/plugin.cjs", () => {
        expect.hasAssertions();

        const runtimePlugin = requireFromTestModule("../dist/plugin.cjs") as {
            configs?: unknown;
            meta?: unknown;
            processors?: unknown;
            rules?: unknown;
        };

        expect(runtimePlugin).toStrictEqual(
            expect.objectContaining({
                configs: expect.any(Object),
                meta: expectedPluginMeta,
                processors: {},
                rules: expectedRuleRegistryShape,
            })
        );
    });

    it("resolves package default export through self-reference ESM import", async () => {
        expect.hasAssertions();

        const packageRuntimeModule =
            (await import("eslint-plugin-runtime-cleanup")) as {
                default: unknown;
            };

        expect(packageRuntimeModule.default).toStrictEqual(
            expect.objectContaining({
                configs: expect.any(Object),
                meta: expectedPluginMeta,
                processors: {},
                rules: expectedRuleRegistryShape,
            })
        );
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

        expect(packageRuntimePlugin).toStrictEqual(
            expect.objectContaining({
                configs: expect.any(Object),
                meta: expectedPluginMeta,
                processors: {},
                rules: expectedRuleRegistryShape,
            })
        );
    });
});
