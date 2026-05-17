/**
 * @packageDocumentation
 * Require timer handles to be retained so they can be cleared during cleanup.
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

const timerFunctionNames = [
    "requestAnimationFrame",
    "requestIdleCallback",
    "setImmediate",
    "setInterval",
    "setTimeout",
] as const;

const globalReceiverNames = [
    "global",
    "globalThis",
    "self",
    "window",
] as const;

type TimerFunctionName = (typeof timerFunctionNames)[number];

const timerFunctionNameSet: ReadonlySet<string> = new Set(timerFunctionNames);
const globalReceiverNameSet: ReadonlySet<string> = new Set(
    globalReceiverNames
);

const isTimerFunctionName = (name: string): name is TimerFunctionName =>
    timerFunctionNameSet.has(name);

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

const isDiscardedTimerHandle = (
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

const isShadowedIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const getDirectTimerName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): TimerFunctionName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.Identifier ||
        !isTimerFunctionName(callee.name) ||
        isShadowedIdentifier(context, callee)
    ) {
        return undefined;
    }

    return callee.name;
};

const getMemberTimerName = (
    callee: Readonly<TSESTree.CallExpression["callee"]>
): TimerFunctionName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.computed ||
        callee.optional ||
        callee.object.type !== AST_NODE_TYPES.Identifier ||
        callee.property.type !== AST_NODE_TYPES.Identifier ||
        !isGlobalReceiverName(callee.object.name) ||
        !isTimerFunctionName(callee.property.name)
    ) {
        return undefined;
    }

    return callee.property.name;
};

/** Rule implementation for `runtime-cleanup/no-floating-timers`. */
const noFloatingTimers: TSESLint.RuleModule<
    "floatingTimer",
    readonly []
> = createTypedRule({
    create(context) {
        const reportFloatingTimer = (
            node: Readonly<TSESTree.CallExpression>,
            timerName: TimerFunctionName
        ): void => {
            if (!isDiscardedTimerHandle(node)) {
                return;
            }

            context.report({
                data: { timerName },
                messageId: "floatingTimer",
                node,
            });
        };

        return {
            'CallExpression[callee.type="Identifier"]'(
                node: TSESTree.CallExpression
            ) {
                const timerName = getDirectTimerName(context, node.callee);

                if (timerName !== undefined) {
                    reportFloatingTimer(node, timerName);
                }
            },
            'CallExpression[callee.type="MemberExpression"]'(
                node: TSESTree.CallExpression
            ) {
                const timerName = getMemberTimerName(node.callee);

                if (timerName !== undefined) {
                    reportFloatingTimer(node, timerName);
                }
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require timer handles to be retained so they can be cleared during cleanup.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-timers"),
        },
        messages: {
            floatingTimer:
                "Store or return the {{timerName}} handle so it can be cleared during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-timers",
});

export default noFloatingTimers;
