import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

import runtimeCleanupPlugin from "../src/plugin";

const chartIndexBulletPattern =
    /^- \[[^\n\r]+\]\(\.\/(?<chartFile>[^\n\r]+\.md)\)$/v;
const sidebarRuleNamePattern = /"(?<ruleName>no-[\-a-z]+)"/gv;

const readWorkspaceFile = (relativePath: string): string =>
    fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("docusaurus site configuration integrity", () => {
    it("uses canonical blob editUrl bases for rules/docs/blog/pages", () => {
        expect.hasAssertions();

        const docusaurusConfigSource = readWorkspaceFile(
            "docs/docusaurus/docusaurus.config.ts"
        );

        expect(docusaurusConfigSource).toMatch(
            /editUrl:\s*`https:\/\/github\.com\/\$\{organizationName\}\/\$\{projectName\}\/blob\/main\/docs\/`/v
        );

        expect(docusaurusConfigSource).toMatch(
            /editUrl:\s*`https:\/\/github\.com\/\$\{organizationName\}\/\$\{projectName\}\/blob\/main\/docs\/docusaurus\/`/v
        );

        expect(docusaurusConfigSource).not.toContain("/tree/");
        expect(docusaurusConfigSource).not.toContain("/blog/blog/");
        expect(docusaurusConfigSource).toContain(
            'to: "/docs/rules/category/rules"'
        );
    });

    it("lists every rule doc in a top-level Rules sidebar category", () => {
        expect.hasAssertions();

        const sidebarsRulesSource = readWorkspaceFile(
            "docs/docusaurus/sidebars.rules.ts"
        );
        const ruleNames = Array.from(
            sidebarsRulesSource.matchAll(sidebarRuleNamePattern),
            (match) => match.groups?.["ruleName"] ?? ""
        );
        const expectedRuleNames = Object.keys(
            runtimeCleanupPlugin.rules
        ).toSorted((left, right) => left.localeCompare(right));

        expect(new Set(ruleNames)).toStrictEqual(new Set(expectedRuleNames));
        expect(sidebarsRulesSource).toContain('label: "Rules"');
        expect(sidebarsRulesSource).not.toContain("Rules in presets");
        expect(sidebarsRulesSource.indexOf('label: "Rules"')).toBeLessThan(
            sidebarsRulesSource.indexOf('label: "Presets"')
        );
    });

    it("charts index uses linked chart entries with existing local files", () => {
        expect.hasAssertions();

        const chartsIndexRelativePath =
            "docs/docusaurus/site-docs/developer/charts/index.md";
        const chartsIndexSource = readWorkspaceFile(chartsIndexRelativePath);

        const sectionHeader = "## Chart set";
        const sectionStart = chartsIndexSource.indexOf(sectionHeader);

        expect(sectionStart).toBeGreaterThanOrEqual(0);

        const sectionBody = chartsIndexSource
            .slice(sectionStart + sectionHeader.length)
            .trim();

        const bulletLines = sectionBody
            .split(/\r?\n/v)
            .map((line) => line.trim())
            .filter((line) => line.startsWith("- "));

        expect(bulletLines.length).toBeGreaterThan(0);

        for (const bulletLine of bulletLines) {
            expect(bulletLine).toMatch(chartIndexBulletPattern);

            const linkMatch = chartIndexBulletPattern.exec(bulletLine);
            const chartFile = linkMatch?.groups?.["chartFile"];

            expect(chartFile).toBeTypeOf("string");

            const resolvedTargetPath = path.resolve(
                process.cwd(),
                "docs/docusaurus/site-docs/developer/charts",
                chartFile ?? ""
            );

            expect({ actual: fs.existsSync(resolvedTargetPath) }).toStrictEqual(
                { actual: true }
            );
        }
    });
});
