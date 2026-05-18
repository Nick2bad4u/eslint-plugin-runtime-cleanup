/**
 * @packageDocumentation
 * Integrity checks for hand-authored repository documentation.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

import runtimeCleanupPlugin from "../src/plugin";

const docsRulesDirectory = path.join(process.cwd(), "docs", "rules");
const obsoleteTemplateRulePrefixes = [
    ["prefer", "ts", "extras"].join("-"),
    ["prefer", "type", "fest"].join("-"),
] as const;

/**
 * Recursively read markdown file paths under a directory.
 *
 * @param directory - Directory to scan.
 *
 * @returns Sorted markdown file paths.
 */
const readMarkdownFiles = async (directory: string): Promise<string[]> => {
    const entries = await fs.readdir(directory, {
        withFileTypes: true,
    });
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await readMarkdownFiles(entryPath)));
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
            files.push(entryPath);
        } else {
            // Non-markdown files do not participate in documentation integrity checks.
        }
    }

    return files.toSorted((left, right) => left.localeCompare(right));
};

describe("documentation integrity", () => {
    it("keeps top-level rule docs aligned with registered rules", async () => {
        expect.hasAssertions();

        const markdownFiles = await fs.readdir(docsRulesDirectory);
        const ruleDocFiles = markdownFiles.filter(
            (fileName) =>
                fileName.endsWith(".md") &&
                !["getting-started.md", "overview.md"].includes(fileName)
        );
        const registeredRuleDocFiles = Object.keys(runtimeCleanupPlugin.rules)
            .map((ruleName) => `${ruleName}.md`)
            .toSorted((left, right) => left.localeCompare(right));

        expect(ruleDocFiles).toStrictEqual(registeredRuleDocFiles);
    });

    it("does not contain template-specific rule documentation", async () => {
        expect.hasAssertions();

        const markdownFiles = await readMarkdownFiles(docsRulesDirectory);

        for (const filePath of markdownFiles) {
            const markdown = await fs.readFile(filePath, "utf8");

            for (const obsoletePrefix of obsoleteTemplateRulePrefixes) {
                expect(markdown).not.toContain(`${obsoletePrefix}-`);
            }
        }
    });
});
