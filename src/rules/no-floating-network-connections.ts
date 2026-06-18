import type { ArrayValues } from "type-fest";

/**
 * @packageDocumentation
 * Require browser network connection handles to be retained so they can be closed.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from "@typescript-eslint/utils";
import { isDefined, setHas } from "ts-extras";

import { getParentNode } from "../_internal/ast-node.js";
import { createRuleDocsUrl } from "../_internal/rule-docs-url.js";
import { getVariableInScopeChain } from "../_internal/scope-variable.js";
import {
    createTypedRule,
    type TypedRuleContext,
} from "../_internal/typed-rule.js";

const networkConnectionConstructorNames = ["EventSource", "WebSocket"] as const;
const globalReceiverNames = [
    "globalThis",
    "self",
    "window",
] as const;

type NetworkConnectionConstructorName = ArrayValues<
    typeof networkConnectionConstructorNames
>;

const networkConnectionConstructorNameSet: ReadonlySet<string> = new Set(
    networkConnectionConstructorNames
);
const globalReceiverNameSet: ReadonlySet<string> = new Set(globalReceiverNames);

const isNetworkConnectionConstructorName = (
    name: string
): name is NetworkConnectionConstructorName =>
    setHas(networkConnectionConstructorNameSet, name);

const isGlobalReceiverName = (name: string): boolean =>
    setHas(globalReceiverNameSet, name);

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

const isShadowedNetworkConnectionIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const getDirectNetworkConnectionConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): NetworkConnectionConstructorName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.Identifier ||
        !isNetworkConnectionConstructorName(callee.name) ||
        isShadowedNetworkConnectionIdentifier(context, callee)
    ) {
        return undefined;
    }

    return callee.name;
};

const getMemberNetworkConnectionConstructorName = (
    callee: Readonly<TSESTree.NewExpression["callee"]>
): NetworkConnectionConstructorName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.optional ||
        callee.object.type !== AST_NODE_TYPES.Identifier ||
        !isGlobalReceiverName(callee.object.name)
    ) {
        return undefined;
    }

    const constructorName = getStaticPropertyName(
        callee.property,
        callee.computed
    );

    return isDefined(constructorName) &&
        isNetworkConnectionConstructorName(constructorName)
        ? constructorName
        : undefined;
};

const getNetworkConnectionConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): NetworkConnectionConstructorName | undefined =>
    getDirectNetworkConnectionConstructorName(context, callee) ??
    getMemberNetworkConnectionConstructorName(callee);

const isDiscardedNetworkConnection = (
    node: Readonly<TSESTree.NewExpression>
): boolean => {
    let current: Readonly<TSESTree.Node> = node;
    let parent = getParentNode(current);

    while (isDefined(parent)) {
        const wrappedExpression = getTransparentWrappedExpression(parent);

        if (wrappedExpression !== current) {
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

        current = parent;
        parent = getParentNode(current);
    }

    return false;
};

const isImmediateNetworkConnectionMethodReceiver = (
    node: Readonly<TSESTree.NewExpression>
): boolean => {
    let current: Readonly<TSESTree.Node> = node;
    let parent = getParentNode(current);

    while (isDefined(parent)) {
        const wrappedExpression = getTransparentWrappedExpression(parent);

        if (wrappedExpression !== current) {
            if (
                parent.type !== AST_NODE_TYPES.MemberExpression ||
                parent.object !== current ||
                parent.optional
            ) {
                return false;
            }

            if (
                getStaticPropertyName(parent.property, parent.computed) ===
                "close"
            ) {
                return false;
            }

            const callExpression = getParentNode(parent);

            return (
                callExpression?.type === AST_NODE_TYPES.CallExpression &&
                callExpression.callee === parent
            );
        }

        current = parent;
        parent = getParentNode(current);
    }

    return false;
};

/** Rule implementation for `runtime-cleanup/no-floating-network-connections`. */
const noFloatingNetworkConnections: TSESLint.RuleModule<
    "floatingNetworkConnection",
    readonly []
> = createTypedRule({
    create: (context) => ({
        NewExpression(node: Readonly<TSESTree.NewExpression>) {
            const connectionName = getNetworkConnectionConstructorName(
                context,
                node.callee
            );

            if (
                !isDefined(connectionName) ||
                (!isDiscardedNetworkConnection(node) &&
                    !isImmediateNetworkConnectionMethodReceiver(node))
            ) {
                return;
            }

            context.report({
                data: { connectionName },
                messageId: "floatingNetworkConnection",
                node,
            });
        },
    }),
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require browser network connection handles to be retained so they can be closed.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-network-connections"),
        },
        messages: {
            floatingNetworkConnection:
                "Store or return the {{connectionName}} handle so close() can release the connection during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-network-connections",
});

export default noFloatingNetworkConnections;
