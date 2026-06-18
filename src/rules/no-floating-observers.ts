import type { ArrayValues } from "type-fest";

/**
 * @packageDocumentation
 * Require observer instances to be retained so they can be disconnected.
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

const observerConstructorNames = [
    "IntersectionObserver",
    "MutationObserver",
    "PerformanceObserver",
    "ReportingObserver",
    "ResizeObserver",
] as const;

const globalReceiverNames = [
    "globalThis",
    "self",
    "window",
] as const;

type ObserverConstructorName = ArrayValues<typeof observerConstructorNames>;

const globalReceiverNameSet: ReadonlySet<string> = new Set(globalReceiverNames);
const observerConstructorNameSet: ReadonlySet<string> = new Set(
    observerConstructorNames
);

const isGlobalReceiverName = (name: string): boolean =>
    setHas(globalReceiverNameSet, name);

const isObserverConstructorName = (
    name: string
): name is ObserverConstructorName => setHas(observerConstructorNameSet, name);

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

const isShadowedIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const getDirectObserverConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): ObserverConstructorName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.Identifier ||
        !isObserverConstructorName(callee.name) ||
        isShadowedIdentifier(context, callee)
    ) {
        return undefined;
    }

    return callee.name;
};

const getMemberObserverConstructorName = (
    callee: Readonly<TSESTree.NewExpression["callee"]>
): ObserverConstructorName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.computed ||
        callee.optional ||
        callee.object.type !== AST_NODE_TYPES.Identifier ||
        callee.property.type !== AST_NODE_TYPES.Identifier ||
        !isGlobalReceiverName(callee.object.name) ||
        !isObserverConstructorName(callee.property.name)
    ) {
        return undefined;
    }

    return callee.property.name;
};

const getObserverConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): ObserverConstructorName | undefined =>
    getDirectObserverConstructorName(context, callee) ??
    getMemberObserverConstructorName(callee);

const isObserveMethodCallReceiver = (
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
                parent.computed ||
                parent.property.type !== AST_NODE_TYPES.Identifier ||
                parent.property.name !== "observe"
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

const isDiscardedObserverInstance = (
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

/** Rule implementation for `runtime-cleanup/no-floating-observers`. */
const noFloatingObservers: TSESLint.RuleModule<
    "floatingObserver",
    readonly []
> = createTypedRule({
    create: (context) => ({
        NewExpression(node: Readonly<TSESTree.NewExpression>) {
            const observerName = getObserverConstructorName(
                context,
                node.callee
            );

            if (
                !isDefined(observerName) ||
                (!isDiscardedObserverInstance(node) &&
                    !isObserveMethodCallReceiver(node))
            ) {
                return;
            }

            context.report({
                data: { observerName },
                messageId: "floatingObserver",
                node,
            });
        },
    }),
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require observer instances to be retained so they can be disconnected during cleanup.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-observers"),
        },
        messages: {
            floatingObserver:
                "Store or return the {{observerName}} instance so it can be disconnected during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-observers",
});

export default noFloatingObservers;
