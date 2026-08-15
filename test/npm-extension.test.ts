import { describe, expect, it } from "vitest";

import { transformManifest } from "../.npm-extension.mjs";

describe("npm manifest extension", () => {
    it("leaves unrelated package manifests unchanged", () => {
        expect.hasAssertions();

        const packageManifest = {
            name: "unrelated-package",
            version: "8.0.0",
        };

        expect(transformManifest(packageManifest)).toBe(packageManifest);
    });

    it("repairs the published Madge 8 TypeScript peer range", () => {
        expect.hasAssertions();

        const packageManifest = {
            name: "madge",
            peerDependencies: {
                typescript: "^5.4.4",
            },
            version: "8.0.0",
        };

        expect(transformManifest(packageManifest)).toStrictEqual({
            name: "madge",
            peerDependencies: {
                typescript: "^5.4.4 || ^6.0.2",
            },
            version: "8.0.0",
        });
        expect(packageManifest.peerDependencies.typescript).toBe("^5.4.4");
    });

    it("fails closed when the targeted metadata changes", () => {
        expect.hasAssertions();

        expect(() =>
            transformManifest({
                name: "madge",
                peerDependencies: {
                    typescript: "^5.4.4 || ^6.0.2",
                },
                version: "8.0.1",
            })
        ).toThrow(/no longer has the expected TypeScript peer range/v);
    });
});
