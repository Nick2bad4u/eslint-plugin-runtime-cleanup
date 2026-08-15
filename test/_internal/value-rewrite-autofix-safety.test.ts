/**
 * @packageDocumentation
 * Unit tests for value-rewrite autofix safety helpers.
 */
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
    isDirectReturnLikeExpressionPosition,
    isTransparentExpressionWrapper,
} from "../../src/_internal/value-rewrite-autofix-safety";

const createIdentifier = (): TSESTree.Identifier =>
    ({
        name: "value",
        type: AST_NODE_TYPES.Identifier,
    }) as TSESTree.Identifier;

const setParent = <Node extends TSESTree.Node>(
    node: Node,
    parent: TSESTree.Node
): Node => {
    node.parent = parent;
    return node;
};

describe(isTransparentExpressionWrapper, () => {
    it.each([
        AST_NODE_TYPES.ChainExpression,
        AST_NODE_TYPES.TSAsExpression,
        AST_NODE_TYPES.TSNonNullExpression,
        AST_NODE_TYPES.TSSatisfiesExpression,
        AST_NODE_TYPES.TSTypeAssertion,
    ])("recognizes %s around its expression", (wrapperType) => {
        expect.hasAssertions();

        const child = createIdentifier();
        const wrapper = {
            expression: child,
            type: wrapperType,
        } as unknown as TSESTree.Node;

        expect(isTransparentExpressionWrapper(wrapper, child)).toBe(true);
        expect(
            isTransparentExpressionWrapper(wrapper, createIdentifier())
        ).toBe(false);
    });

    it("rejects unrelated parent nodes", () => {
        expect.hasAssertions();

        const child = createIdentifier();
        const parent = {
            expression: child,
            type: AST_NODE_TYPES.ExpressionStatement,
        } as unknown as TSESTree.ExpressionStatement;

        expect(isTransparentExpressionWrapper(parent, child)).toBe(false);
    });
});

describe(isDirectReturnLikeExpressionPosition, () => {
    it("walks transparent wrappers to a return statement", () => {
        expect.hasAssertions();

        const child = createIdentifier();
        const wrapper = {
            expression: child,
            type: AST_NODE_TYPES.TSAsExpression,
        } as unknown as TSESTree.TSAsExpression;
        const returnStatement = {
            argument: wrapper,
            type: AST_NODE_TYPES.ReturnStatement,
        } as unknown as TSESTree.ReturnStatement;

        setParent(child, wrapper);
        setParent(wrapper, returnStatement);

        expect(isDirectReturnLikeExpressionPosition(child)).toBe(true);
    });

    it("recognizes expression-bodied arrow functions", () => {
        expect.hasAssertions();

        const child = createIdentifier();
        const arrowFunction = {
            body: child,
            type: AST_NODE_TYPES.ArrowFunctionExpression,
        } as unknown as TSESTree.ArrowFunctionExpression;

        setParent(child, arrowFunction);

        expect(isDirectReturnLikeExpressionPosition(child)).toBe(true);
    });
});
