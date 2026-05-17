import { describe, expect, it } from "vitest";

import {
    chunkValues,
    collectRouteManifestEntriesFromData,
    createIndexNowPayloads,
    decodeXmlEntities,
    deriveSiteConfiguration,
    ensureValidIndexNowKey,
    isIndexNowVerificationPendingResponse,
    normalizeDocusaurusSourcePath,
    normalizeSiteUrl,
    parseGitDiffNameStatus,
    parseSitemapUrls,
    resolveChangedUrlsFromManifest,
} from "../scripts/indexnow.mjs";

describe("indexnow script helpers", () => {
    it("validates accepted IndexNow keys", () => {
        expect.hasAssertions();
        expect(ensureValidIndexNowKey("abcd1234-XYZ")).toBe("abcd1234-XYZ");
    });

    it("rejects invalid IndexNow keys", () => {
        expect.hasAssertions();
        expect(() => ensureValidIndexNowKey("bad key")).toThrow(
            /INDEXNOW_KEY must be 8-128 characters long/v
        );
        expect(() => ensureValidIndexNowKey("short")).toThrow(
            /INDEXNOW_KEY must be 8-128 characters long/v
        );
    });

    it("normalizes deployed site URLs for relative asset resolution", () => {
        expect.hasAssertions();
        expect(
            normalizeSiteUrl(
                "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup?ref=main#docs"
            )
        ).toBe("https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/");
    });

    it("derives sitemap and key-file URLs from a project site URL", () => {
        expect.hasAssertions();
        expect(
            deriveSiteConfiguration(
                "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/"
            )
        ).toStrictEqual({
            host: "nick2bad4u.github.io",
            keyFileUrl:
                "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/indexnow-key.txt",
            sitemapUrl:
                "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/sitemap.xml",
            siteUrl: "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/",
        });
    });

    it("decodes sitemap XML entities", () => {
        expect.hasAssertions();
        expect(
            decodeXmlEntities(
                "https://example.com/docs?x=1&amp;y=2&amp;title=Tom&#39;s%20Guide"
            )
        ).toBe("https://example.com/docs?x=1&y=2&title=Tom's%20Guide");
    });

    it("normalizes Docusaurus source paths to repository-relative paths", () => {
        expect.hasAssertions();
        expect(
            normalizeDocusaurusSourcePath(
                "@site/../rules/getting-started.md"
            )
        ).toBe("docs/rules/getting-started.md");
        expect(normalizeDocusaurusSourcePath("@site/src/pages/index.jsx")).toBe(
            "docs/docusaurus/src/pages/index.tsx"
        );
    });

    it("parses and deduplicates sitemap URLs", () => {
        expect.hasAssertions();

        const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
            <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url>
                    <loc>https://example.com/</loc>
                </url>
                <url>
                    <loc>https://example.com/docs?x=1&amp;y=2</loc>
                </url>
                <url>
                    <loc>https://example.com/</loc>
                </url>
            </urlset>`;

        expect(parseSitemapUrls(sitemapXml)).toStrictEqual([
            "https://example.com/",
            "https://example.com/docs?x=1&y=2",
        ]);
    });

    it("fails fast for malformed sitemap loc elements", () => {
        expect.hasAssertions();
        expect(() =>
            parseSitemapUrls("<urlset><url><loc>https://example.com/")
        ).toThrow(/closing <\/loc> tag/v);
    });

    it("splits URL lists into stable batches", () => {
        expect.hasAssertions();
        expect(
            chunkValues(
                [
                    1,
                    2,
                    3,
                    4,
                    5,
                ],
                2
            )
        ).toStrictEqual([
            [1, 2],
            [3, 4],
            [5],
        ]);
    });

    it("builds IndexNow payload batches with the expected metadata", () => {
        expect.hasAssertions();
        expect(
            createIndexNowPayloads({
                batchSize: 2,
                host: "nick2bad4u.github.io",
                key: "abcd1234-XYZ",
                keyLocation:
                    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/indexnow-key.txt",
                urlList: [
                    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/",
                    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/foo",
                    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/blog/bar",
                ],
            })
        ).toStrictEqual([
            {
                host: "nick2bad4u.github.io",
                key: "abcd1234-XYZ",
                keyLocation:
                    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/indexnow-key.txt",
                urlList: [
                    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/",
                    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/foo",
                ],
            },
            {
                host: "nick2bad4u.github.io",
                key: "abcd1234-XYZ",
                keyLocation:
                    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/indexnow-key.txt",
                urlList: [
                    "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/blog/bar",
                ],
            },
        ]);
    });

    it("collects source/permalink entries from nested Docusaurus metadata", () => {
        expect.hasAssertions();
        expect(
            collectRouteManifestEntriesFromData({
                nested: {
                    entries: [
                        {
                            permalink:
                                "/eslint-plugin-runtime-cleanup/docs/rules/getting-started",
                            source: "@site/../rules/getting-started.md",
                        },
                        {
                            permalink:
                                "/eslint-plugin-runtime-cleanup/docs/developer/",
                            source: "@site/site-docs/developer/index.md",
                        },
                    ],
                },
            })
        ).toStrictEqual([
            {
                permalink: "/eslint-plugin-runtime-cleanup/docs/developer/",
                sourcePath: "docs/docusaurus/site-docs/developer/index.md",
            },
            {
                permalink: "/eslint-plugin-runtime-cleanup/docs/rules/getting-started",
                sourcePath: "docs/rules/getting-started.md",
            },
        ]);
    });

    it("parses added, modified, copied, and renamed paths from git diff --name-status output", () => {
        expect.hasAssertions();
        expect(
            parseGitDiffNameStatus(
                [
                    "A\tdocs/rules/new-rule.md",
                    "R100\tdocs/rules/old-name.md\tdocs/rules/new-name.md",
                    "M\tdocs/rules/updated-rule.md",
                    "C100\tdocs/docusaurus/blog/source.md\tdocs/docusaurus/blog/copied.md",
                ].join("\n")
            )
        ).toStrictEqual([
            "docs/rules/new-rule.md",
            "docs/rules/new-name.md",
            "docs/rules/updated-rule.md",
            "docs/docusaurus/blog/copied.md",
        ]);
    });

    it("resolves changed repository paths into canonical public URLs", () => {
        expect.hasAssertions();
        expect(
            resolveChangedUrlsFromManifest({
                changedPaths: [
                    "docs/rules/getting-started.md",
                    "docs/docusaurus/site-docs/developer/index.md",
                ],
                manifestEntries: [
                    {
                        permalink:
                            "/eslint-plugin-runtime-cleanup/docs/rules/getting-started",
                        sourcePath: "docs/rules/getting-started.md",
                    },
                    {
                        permalink: "/eslint-plugin-runtime-cleanup/docs/developer/",
                        sourcePath:
                            "docs/docusaurus/site-docs/developer/index.md",
                    },
                ],
                siteUrl: "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/",
            })
        ).toStrictEqual([
            "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/rules/getting-started",
            "https://nick2bad4u.github.io/eslint-plugin-runtime-cleanup/docs/developer/",
        ]);
    });

    it("detects Bing verification-pending responses as retryable", () => {
        expect.hasAssertions();
        expect(
            isIndexNowVerificationPendingResponse(
                403,
                '{"errorCode":"SiteVerificationNotCompleted","message":"Site Verification is not completed."}'
            )
        ).toBeTruthy();
    });

    it("does not mark unrelated IndexNow failures as retryable", () => {
        expect.hasAssertions();
        expect(
            isIndexNowVerificationPendingResponse(
                403,
                '{"errorCode":"Forbidden","message":"Some other failure."}'
            )
        ).toBeFalsy();
        expect(
            isIndexNowVerificationPendingResponse(422, "unprocessable entity")
        ).toBeFalsy();
    });
});
