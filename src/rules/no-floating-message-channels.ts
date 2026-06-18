/**
 * @packageDocumentation
 * Require MessageChannel ports to be retained so they can be closed.
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

const messageChannelConstructorName = "MessageChannel";
const messagePortPropertyNames = ["port1", "port2"] as const;
const globalReceiverNames = [
    "globalThis",
    "self",
    "window",
] as const;

const globalReceiverNameSet: ReadonlySet<string> = new Set(globalReceiverNames);
const messagePortPropertyNameSet: ReadonlySet<string> = new Set(
    messagePortPropertyNames
);

const isGlobalReceiverName = (name: string): boolean =>
    setHas(globalReceiverNameSet, name);

const isMessagePortPropertyName = (name: string): boolean =>
    setHas(messagePortPropertyNameSet, name);

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

const isShadowedMessageChannelIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const isDirectMessageChannelConstructor = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): boolean =>
    callee.type === AST_NODE_TYPES.Identifier &&
    callee.name === messageChannelConstructorName &&
    !isShadowedMessageChannelIdentifier(context, callee);

const isMemberMessageChannelConstructor = (
    callee: Readonly<TSESTree.NewExpression["callee"]>
): boolean =>
    callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.optional &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    isGlobalReceiverName(callee.object.name) &&
    getStaticPropertyName(callee.property, callee.computed) ===
        messageChannelConstructorName;

const isMessageChannelConstructor = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): boolean =>
    isDirectMessageChannelConstructor(context, callee) ||
    isMemberMessageChannelConstructor(callee);

const isDiscardedMessageChannel = (
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

const isImmediateMessagePortAccess = (
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

            const propertyName = getStaticPropertyName(
                parent.property,
                parent.computed
            );

            return (
                isDefined(propertyName) &&
                isMessagePortPropertyName(propertyName)
            );
        }

        current = parent;
        parent = getParentNode(current);
    }

    return false;
};

/** Rule implementation for `runtime-cleanup/no-floating-message-channels`. */
const noFloatingMessageChannels: TSESLint.RuleModule<
    "floatingMessageChannel",
    readonly []
> = createTypedRule({
    create: (context) => ({
        NewExpression(node: Readonly<TSESTree.NewExpression>) {
            if (
                !isMessageChannelConstructor(context, node.callee) ||
                (!isDiscardedMessageChannel(node) &&
                    !isImmediateMessagePortAccess(node))
            ) {
                return;
            }

            context.report({
                messageId: "floatingMessageChannel",
                node,
            });
        },
    }),
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require MessageChannel ports to be retained so they can be closed.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-message-channels"),
        },
        messages: {
            floatingMessageChannel:
                "Store or return the MessageChannel handle or both MessagePort handles so the ports can be closed during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-message-channels",
});

export default noFloatingMessageChannels;
