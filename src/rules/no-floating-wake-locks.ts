/**
 * @packageDocumentation
 * Require WakeLockSentinel handles to be retained so they can be released.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from "@typescript-eslint/utils";

import { getParentNode } from "../_internal/ast-node.js";
import { createRuleDocsUrl } from "../_internal/rule-docs-url.js";
import { getVariableInScopeChain } from "../_internal/scope-variable.js";
import {
    createTypedRule,
    type TypedRuleContext,
} from "../_internal/typed-rule.js";

const wakeLockRequestFunctionName = "request";
const globalNavigatorReceiverNames = ["globalThis", "window"] as const;

const globalNavigatorReceiverNameSet: ReadonlySet<string> = new Set(
    globalNavigatorReceiverNames
);

const getTransparentWrappedExpression = (
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

const getStaticPropertyName = (
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

const collectStaticMemberPath = (
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

const isShadowedNavigatorIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const getRootIdentifier = (
    node: Readonly<TSESTree.Expression>
): TSESTree.Identifier | undefined => {
    if (node.type === AST_NODE_TYPES.Identifier) {
        return node;
    }

    return node.type === AST_NODE_TYPES.MemberExpression
        ? getRootIdentifier(node.object)
        : undefined;
};

const isNavigatorPathShadowed = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): boolean => {
    if (callee.type !== AST_NODE_TYPES.MemberExpression) {
        return false;
    }

    const rootIdentifier = getRootIdentifier(callee.object);

    return (
        rootIdentifier?.name === "navigator" &&
        isShadowedNavigatorIdentifier(context, rootIdentifier)
    );
};

const isWakeLockRequestPath = (path: readonly string[]): boolean =>
    (path.length === 3 &&
        path[0] === "navigator" &&
        path[1] === "wakeLock" &&
        path[2] === wakeLockRequestFunctionName) ||
    (path.length === 4 &&
        globalNavigatorReceiverNameSet.has(path[0] ?? "") &&
        path[1] === "navigator" &&
        path[2] === "wakeLock" &&
        path[3] === wakeLockRequestFunctionName);

const isWakeLockRequestCall = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): boolean => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        isNavigatorPathShadowed(context, callee)
    ) {
        return false;
    }

    const path = collectStaticMemberPath(callee);

    return path !== undefined && isWakeLockRequestPath(path);
};

const isDiscardedWakeLockRequest = (
    node: Readonly<TSESTree.CallExpression>
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

/** Rule implementation for `runtime-cleanup/no-floating-wake-locks`. */
const noFloatingWakeLocks: TSESLint.RuleModule<
    "floatingWakeLock",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            CallExpression(node: Readonly<TSESTree.CallExpression>) {
                if (
                    !isWakeLockRequestCall(context, node.callee) ||
                    !isDiscardedWakeLockRequest(node)
                ) {
                    return;
                }

                context.report({
                    messageId: "floatingWakeLock",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require WakeLockSentinel handles to be retained so they can be released.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-wake-locks"),
        },
        messages: {
            floatingWakeLock:
                "Store or return the WakeLockSentinel so release() can release the wake lock during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-wake-locks",
});

export default noFloatingWakeLocks;
