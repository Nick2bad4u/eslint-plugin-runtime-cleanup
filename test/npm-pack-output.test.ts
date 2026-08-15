import { describe, expect, it } from "vitest";

import { getSingleNpmPackEntry } from "../scripts/npm-pack-output.mjs";

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
