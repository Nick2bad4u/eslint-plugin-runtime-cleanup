/**
 * @packageDocumentation
 * Require BroadcastChannel handles to be retained so they can be closed.
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

const broadcastChannelConstructorName = "BroadcastChannel";
const globalReceiverNames = [
    "globalThis",
    "self",
    "window",
] as const;

const globalReceiverNameSet: ReadonlySet<string> = new Set(
    globalReceiverNames
);

const isGlobalReceiverName = (name: string): boolean =>
    globalReceiverNameSet.has(name);

const getTransparentWrappedExpression = (
    node: Readonly<TSESTree.Node>
): Readonly<TSESTree.Node> | undefined => {
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

const isShadowedBroadcastChannelIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const isDirectBroadcastChannelConstructor = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): boolean =>
    callee.type === AST_NODE_TYPES.Identifier &&
    callee.name === broadcastChannelConstructorName &&
    !isShadowedBroadcastChannelIdentifier(context, callee);

const isMemberBroadcastChannelConstructor = (
    callee: Readonly<TSESTree.NewExpression["callee"]>
): boolean =>
    callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.optional &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    isGlobalReceiverName(callee.object.name) &&
    getStaticPropertyName(callee.property, callee.computed) ===
        broadcastChannelConstructorName;

const isBroadcastChannelConstructor = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): boolean =>
    isDirectBroadcastChannelConstructor(context, callee) ||
    isMemberBroadcastChannelConstructor(callee);

const isDiscardedBroadcastChannel = (
    node: Readonly<TSESTree.NewExpression>
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

const isImmediateBroadcastChannelMethodReceiver = (
    node: Readonly<TSESTree.NewExpression>
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

        if (
            getStaticPropertyName(parent.property, parent.computed) === "close"
        ) {
            return false;
        }

        const callExpression = getParentNode(parent);

        return (
            callExpression?.type === AST_NODE_TYPES.CallExpression &&
            callExpression.callee === parent
        );
    }

    return false;
};

/** Rule implementation for `runtime-cleanup/no-floating-broadcast-channels`. */
const noFloatingBroadcastChannels: TSESLint.RuleModule<
    "floatingBroadcastChannel",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            NewExpression(node: Readonly<TSESTree.NewExpression>) {
                if (
                    !isBroadcastChannelConstructor(context, node.callee) ||
                    (!isDiscardedBroadcastChannel(node) &&
                        !isImmediateBroadcastChannelMethodReceiver(node))
                ) {
                    return;
                }

                context.report({
                    messageId: "floatingBroadcastChannel",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require BroadcastChannel handles to be retained so they can be closed.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-broadcast-channels"),
        },
        messages: {
            floatingBroadcastChannel:
                "Store or return the BroadcastChannel handle so close() can release the channel during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-broadcast-channels",
});

export default noFloatingBroadcastChannels;
