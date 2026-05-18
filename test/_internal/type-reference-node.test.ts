import type { TSESTree } from "@typescript-eslint/utils";

import { describe, expect, it } from "vitest";

import { isIdentifierTypeReference } from "../../src/_internal/type-reference-node";

/** Contract tests for identifier-only `TSTypeReference` detection. */
describe(isIdentifierTypeReference, () => {
    it("returns true for matching identifier type references", () => {
        expect.hasAssertions();

        const node = {
            type: "TSTypeReference",
            typeName: {
                name: "Arrayable",
                type: "Identifier",
            },
        } as unknown as TSESTree.TypeNode;

        expect({
            actual: isIdentifierTypeReference(node, "Arrayable"),
        }).not.toStrictEqual({ actual: false });
        expect({
            actual: isIdentifierTypeReference(node, "Arrayable"),
        }).toStrictEqual({ actual: true });
    });

    it("returns false for non-matching identifier names", () => {
        expect.hasAssertions();

        const node = {
            type: "TSTypeReference",
            typeName: {
                name: "Writable",
                type: "Identifier",
            },
        } as unknown as TSESTree.TypeNode;

        expect({ actual: isIdentifierTypeReference(node, "Arrayable") }).toStrictEqual({ actual: false });
    });

    it("returns false for non-type-reference nodes", () => {
        expect.hasAssertions();

        const node = {
            type: "TSStringKeyword",
        } as unknown as TSESTree.TypeNode;

        expect({ actual: isIdentifierTypeReference(node, "Arrayable") }).toStrictEqual({ actual: false });
    });
});
