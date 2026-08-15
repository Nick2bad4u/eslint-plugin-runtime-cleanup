import { describe, expect, it } from "vitest";

import {
    getSingleNpmPackEntry,
    getSingleNpmPackFilename,
} from "../scripts/npm-pack-output.mjs";

describe(getSingleNpmPackEntry, () => {
    it.each([
        {
            name: "npm 11 array output",
            output: [{ files: [], name: "example-package" }],
        },
        {
            name: "npm 12 keyed output",
            output: {
                "example-package": {
                    files: [],
                    name: "example-package",
                },
            },
        },
    ])("reads $name", ({ output }) => {
        expect.hasAssertions();

        expect(getSingleNpmPackEntry(output)).toStrictEqual({
            files: [],
            name: "example-package",
        });
    });

    it.each([
        {
            name: "an empty array",
            output: [],
        },
        {
            name: "multiple keyed packages",
            output: {
                first: { files: [] },
                second: { files: [] },
            },
        },
        {
            name: "a non-object value",
            output: "unexpected",
        },
    ])("rejects $name", ({ output }) => {
        expect.hasAssertions();

        expect(() => getSingleNpmPackEntry(output)).toThrow(
            /exactly one package entry/v
        );
    });
});

describe(getSingleNpmPackFilename, () => {
    it.each([
        {
            name: "npm 11 array output",
            output: [{ filename: "example-package-1.0.0.tgz" }],
        },
        {
            name: "npm 12 keyed output",
            output: {
                "example-package": {
                    filename: "example-package-1.0.0.tgz",
                },
            },
        },
    ])("reads $name", ({ output }) => {
        expect.hasAssertions();

        expect(getSingleNpmPackFilename(output)).toBe(
            "example-package-1.0.0.tgz"
        );
    });

    it.each([
        {
            name: "a missing filename",
            output: [{}],
        },
        {
            name: "an empty filename",
            output: [{ filename: "" }],
        },
        {
            name: "a relative traversal",
            output: [{ filename: "../package.tgz" }],
        },
        {
            name: "a nested POSIX path",
            output: [{ filename: "nested/package.tgz" }],
        },
        {
            name: "a nested Windows path",
            output: [{ filename: String.raw`nested\package.tgz` }],
        },
    ])("rejects $name", ({ output }) => {
        expect.hasAssertions();

        expect(() => getSingleNpmPackFilename(output)).toThrow(
            /safe archive filename/v
        );
    });
});
