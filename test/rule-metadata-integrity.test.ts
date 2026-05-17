/**
 * @packageDocumentation
 * Strong contract tests for required rule metadata across registered rules.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

import runtimeCleanupPlugin from "../src/plugin";

/**
 * Read all rule source file names from `src/rules`.
 */
const getRuleSourceFileNames = (): readonly string[] => {
    const rulesDirectory = path.join(process.cwd(), "src", "rules");

    return fs
        .readdirSync(rulesDirectory)
        .filter((entry) => entry.endsWith(".ts"))
        .map((entry) => entry.replace(/\.ts$/v, ""))
        .toSorted((left, right) => left.localeCompare(right));
};

describe("rule metadata integrity", () => {
    it("exports processors for plugin shape parity", () => {
        expect.hasAssertions();
        expect(runtimeCleanupPlugin).toHaveProperty("processors");
        expect(runtimeCleanupPlugin.processors).toStrictEqual({});
    });

    it("keeps src/rules file names in sync with registered rule names", () => {
        expect.hasAssertions();

        const registeredRuleNames = Object.keys(
            runtimeCleanupPlugin.rules
        ).toSorted((left, right) => left.localeCompare(right));

        expect(getRuleSourceFileNames()).toStrictEqual(registeredRuleNames);
    });

    it("exposes complete metadata for every registered rule", () => {
        expect.hasAssertions();

        for (const [ruleName, ruleModule] of Object.entries(
            runtimeCleanupPlugin.rules
        )) {
            const { meta } = ruleModule;

            expect(meta).toBeDefined();

            if (meta === undefined) {
                throw new TypeError(`Rule '${ruleName}' is missing meta.`);
            }

            expect(meta.docs).toStrictEqual(
                expect.objectContaining({
                    description: expect.any(String),
                    recommended: expect.any(Boolean),
                    requiresTypeChecking: expect.any(Boolean),
                    ruleId: expect.stringMatching(/^R\d{3}$/v),
                    ruleNumber: expect.any(Number),
                    runtimeCleanupConfigs: expect.any(Array),
                    url: expect.stringContaining(`/rules/${ruleName}`),
                })
            );
            expect(meta.messages).not.toStrictEqual({});
            expect(meta.schema).toStrictEqual(expect.any(Array));
        }
    });
});
