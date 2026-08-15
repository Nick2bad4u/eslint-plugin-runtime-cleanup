import { describe, expect, it } from "vitest";

import { validatePreparedRelease } from "../scripts/validate-prepared-release.mjs";

describe(validatePreparedRelease, () => {
    it.each([
        {
            latestTag: "v2.0.1",
            packageVersion: "2.0.2",
            releaseType: "patch",
        },
        {
            latestTag: "v2.0.1",
            packageVersion: "2.1.0",
            releaseType: "minor",
        },
        {
            latestTag: "v2.0.1",
            packageVersion: "3.0.0",
            releaseType: "major",
        },
    ])(
        "accepts a prepared $releaseType release",
        ({ latestTag, packageVersion, releaseType }) => {
            expect.hasAssertions();

            expect(
                validatePreparedRelease({
                    latestTag,
                    packageVersion,
                    releaseType,
                })
            ).toBe(packageVersion);
        }
    );

    it("lets an explicit version override the bump type", () => {
        expect.hasAssertions();

        expect(
            validatePreparedRelease({
                explicitVersion: "2.2.0",
                latestTag: "v2.0.1",
                packageVersion: "2.2.0",
                releaseType: "patch",
            })
        ).toBe("2.2.0");
    });

    it("throws for an invalid package version", () => {
        expect.hasAssertions();

        expect(() =>
            validatePreparedRelease({
                latestTag: "v2.0.1",
                packageVersion: "2.0.2-beta.1",
                releaseType: "patch",
            })
        ).toThrow(/stable x\.y\.z format/v);
    });

    it.each([
        {
            expectedMessage: /must start with v/v,
            release: {
                latestTag: "2.0.1",
                packageVersion: "2.0.2",
                releaseType: "patch",
            },
        },
        {
            expectedMessage: /newer than v2\.0\.1/v,
            release: {
                latestTag: "v2.0.1",
                packageVersion: "2.0.1",
                releaseType: "patch",
            },
        },
        {
            expectedMessage: /Invalid release type/v,
            release: {
                latestTag: "v2.0.1",
                packageVersion: "2.0.2",
                releaseType: "prerelease",
            },
        },
        {
            expectedMessage: /expected 2\.0\.2/v,
            release: {
                latestTag: "v2.0.1",
                packageVersion: "2.0.3",
                releaseType: "patch",
            },
        },
        {
            expectedMessage: /expected 2\.0\.4/v,
            release: {
                explicitVersion: "2.0.4",
                latestTag: "v2.0.1",
                packageVersion: "2.0.2",
                releaseType: "patch",
            },
        },
    ])("rejects $expectedMessage", ({ expectedMessage, release }) => {
        expect.hasAssertions();

        expect(() => validatePreparedRelease(release)).toThrow(expectedMessage);
    });
});
