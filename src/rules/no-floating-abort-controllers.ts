/**
 * @packageDocumentation
 * Require AbortController handles to be retained so work can be aborted during cleanup.
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

const abortControllerConstructorName = "AbortController";
const globalReceiverNames = [
    "globalThis",
    "self",
    "window",
] as const;

const globalReceiverNameSet: ReadonlySet<string> = new Set(globalReceiverNames);

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

const isShadowedAbortControllerIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const isDirectAbortControllerConstructor = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): boolean =>
    callee.type === AST_NODE_TYPES.Identifier &&
    callee.name === abortControllerConstructorName &&
    !isShadowedAbortControllerIdentifier(context, callee);

const isMemberAbortControllerConstructor = (
    callee: Readonly<TSESTree.NewExpression["callee"]>
): boolean =>
    callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.optional &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    isGlobalReceiverName(callee.object.name) &&
    getStaticPropertyName(callee.property, callee.computed) ===
        abortControllerConstructorName;

const isAbortControllerConstructor = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): boolean =>
    isDirectAbortControllerConstructor(context, callee) ||
    isMemberAbortControllerConstructor(callee);

const isDiscardedAbortControllerHandle = (
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

const isImmediateAbortSignalAccess = (
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

        return (
            parent.type === AST_NODE_TYPES.MemberExpression &&
            parent.object === current &&
            !parent.optional &&
            getStaticPropertyName(parent.property, parent.computed) === "signal"
        );
    }

    return false;
};

/** Rule implementation for `runtime-cleanup/no-floating-abort-controllers`. */
const noFloatingAbortControllers: TSESLint.RuleModule<
    "floatingAbortController",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            NewExpression(node: Readonly<TSESTree.NewExpression>) {
                if (
                    !isAbortControllerConstructor(context, node.callee) ||
                    (!isDiscardedAbortControllerHandle(node) &&
                        !isImmediateAbortSignalAccess(node))
                ) {
                    return;
                }

                context.report({
                    messageId: "floatingAbortController",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require AbortController handles to be retained so work can be aborted during cleanup.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-abort-controllers"),
        },
        messages: {
            floatingAbortController:
                "Store or return the AbortController handle so abort() can cancel work during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-abort-controllers",
});

export default noFloatingAbortControllers;
