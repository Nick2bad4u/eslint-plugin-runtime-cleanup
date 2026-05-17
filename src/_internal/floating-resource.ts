/**
 * @packageDocumentation
 * Shared AST helpers for rules that reject unowned cleanup handles.
 */
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { getParentNode } from "./ast-node.js";

/**
 * Unwrap syntax that does not change whether a resource expression is owned.
 */
export const getTransparentWrappedExpression = (
    node: Readonly<TSESTree.Node>
): Readonly<TSESTree.Node> | undefined => {
    if (node.type === AST_NODE_TYPES.AwaitExpression) {
        return node.argument;
    }

    if (node.type === AST_NODE_TYPES.ChainExpression) {
        return node.expression;
    }

    if (node.type === AST_NODE_TYPES.TSAsExpression) {
        return node.expression;
    }

    if (node.type === AST_NODE_TYPES.TSNonNullExpression) {
        return node.expression;
    }

    if (node.type === AST_NODE_TYPES.TSSatisfiesExpression) {
        return node.expression;
    }

    if (node.type === AST_NODE_TYPES.TSTypeAssertion) {
        return node.expression;
    }

    return undefined;
};

/**
 * Resolve a static property name from dot or string-literal member access.
 */
export const getStaticPropertyName = (
    node: Readonly<TSESTree.MemberExpression["property"]>,
    computed: boolean
): string | undefined => {
    if (!computed && node.type === AST_NODE_TYPES.Identifier) {
        return node.name;
    }

    if (
        computed &&
        node.type === AST_NODE_TYPES.Literal &&
        typeof node.value === "string"
    ) {
        return node.value;
    }

    return undefined;
};

/**
 * Resolve a simple static member path such as `globalThis.URL.createObjectURL`.
 */
export const collectStaticMemberPath = (
    node: Readonly<TSESTree.Expression>
): readonly string[] | undefined => {
    if (node.type === AST_NODE_TYPES.Identifier) {
        return [node.name];
    }

    if (node.type !== AST_NODE_TYPES.MemberExpression || node.optional) {
        return undefined;
    }

    const objectPath = collectStaticMemberPath(node.object);
    const propertyName = getStaticPropertyName(node.property, node.computed);

    return objectPath === undefined || propertyName === undefined
        ? undefined
        : [...objectPath, propertyName];
};

/**
 * Check whether a resource-producing expression is discarded as a standalone
 * expression or explicitly voided.
 */
export const isDiscardedResourceExpression = (
    node: Readonly<TSESTree.Node>
): boolean => {
    let current: Readonly<TSESTree.Node> = node;
    let parent = getParentNode(current);

    while (parent !== undefined) {
        const wrappedExpression = getTransparentWrappedExpression(parent);

        if (wrappedExpression === current) {
            current = parent;
            parent = getParentNode(current);
            continue;
        }

        if (
            parent.type === AST_NODE_TYPES.ExpressionStatement &&
            parent.expression === current
        ) {
            return true;
        }

        if (
            parent.type === AST_NODE_TYPES.UnaryExpression &&
            parent.operator === "void" &&
            parent.argument === current
        ) {
            const unaryParent = getParentNode(parent);

            return unaryParent?.type === AST_NODE_TYPES.ExpressionStatement;
        }

        return false;
    }

    return false;
};

/**
 * Check whether a resource handle is immediately used as a member receiver
 * instead of being retained. Cleanup members are excluded so immediate cleanup
 * calls such as `new AudioContext().close()` are not reported here.
 */
export const isImmediateUnownedMemberReceiver = (
    node: Readonly<TSESTree.Node>,
    cleanupMemberNames: ReadonlySet<string>
): boolean => {
    let current: Readonly<TSESTree.Node> = node;
    let parent = getParentNode(current);

    while (parent !== undefined) {
        const wrappedExpression = getTransparentWrappedExpression(parent);

        if (wrappedExpression === current) {
            current = parent;
            parent = getParentNode(current);
            continue;
        }

        if (
            parent.type !== AST_NODE_TYPES.MemberExpression ||
            parent.object !== current ||
            parent.optional
        ) {
            return false;
        }

        const propertyName = getStaticPropertyName(
            parent.property,
            parent.computed
        );

        return (
            propertyName === undefined || !cleanupMemberNames.has(propertyName)
        );
    }

    return false;
};

