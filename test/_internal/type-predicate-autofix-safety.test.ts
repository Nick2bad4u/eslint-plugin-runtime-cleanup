/**
 * @packageDocumentation
 * Unit tests for type-predicate autofix safety helpers.
 */
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { isTypePredicateExpressionAutofixSafe } from "../../src/_internal/type-predicate-autofix-safety";

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

describe(isTypePredicateExpressionAutofixSafe, () => {
    it("walks transparent wrappers before rejecting boolean guards", () => {
        expect.hasAssertions();

        const child = createIdentifier();
        const wrapper = {
            expression: child,
            type: AST_NODE_TYPES.TSNonNullExpression,
        } as unknown as TSESTree.TSNonNullExpression;
        const ifStatement = {
            test: wrapper,
            type: AST_NODE_TYPES.IfStatement,
        } as unknown as TSESTree.IfStatement;

        setParent(child, wrapper);
        setParent(wrapper, ifStatement);

        expect(isTypePredicateExpressionAutofixSafe(child)).toBe(false);
    });

    it("rejects non-null switch case tests", () => {
        expect.hasAssertions();

        const child = createIdentifier();
        const switchCase = {
            test: child,
            type: AST_NODE_TYPES.SwitchCase,
        } as unknown as TSESTree.SwitchCase;

        setParent(child, switchCase);

        expect(isTypePredicateExpressionAutofixSafe(child)).toBe(false);
    });

    it.each([AST_NODE_TYPES.ForStatement, AST_NODE_TYPES.SwitchCase])(
        "allows expressions outside nullable %s tests",
        (parentType) => {
            expect.hasAssertions();

            const child = createIdentifier();
            const parent = {
                test: null,
                type: parentType,
            } as unknown as TSESTree.Node;

            setParent(child, parent);

            expect(isTypePredicateExpressionAutofixSafe(child)).toBe(true);
        }
    );
});
