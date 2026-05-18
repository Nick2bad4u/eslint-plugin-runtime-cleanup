import type { UnknownRecord } from "type-fest";

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

type RuntimeCleanupDocsMetadata = Readonly<{
    description: string;
    recommended: boolean;
    requiresTypeChecking: boolean;
    ruleId: string;
    ruleNumber: number;
    runtimeCleanupConfigs: unknown;
    url: string;
}>;

const isObject = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null;

const requireRuntimeCleanupDocsMetadata = (
    ruleName: string,
    docs: unknown
): RuntimeCleanupDocsMetadata => {
    if (!isObject(docs)) {
        throw new TypeError(`Rule '${ruleName}' is missing docs metadata.`);
    }

    return docs as unknown as RuntimeCleanupDocsMetadata;
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

            if (meta === undefined) {
                throw new TypeError(`Rule '${ruleName}' is missing meta.`);
            }

            const docs = requireRuntimeCleanupDocsMetadata(
                ruleName,
                meta.docs
            );

            expect(docs.description).toBeTypeOf("string");
            expect(docs.recommended).toBeTypeOf("boolean");
            expect(docs.requiresTypeChecking).toBeTypeOf("boolean");
            expect(docs.ruleId).toMatch(/^R\d{3}$/v);
            expect(docs.ruleNumber).toBeTypeOf("number");
            expect({
                actual: Array.isArray(docs.runtimeCleanupConfigs),
            }).toStrictEqual({ actual: true });
            expect(docs.url).toContain(`/rules/${ruleName}`);
            expect(meta.messages).not.toStrictEqual({});
            expect({ actual: Array.isArray(meta.schema) }).toStrictEqual({ actual: true });
        }
    });
});
