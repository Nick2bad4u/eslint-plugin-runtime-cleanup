import type { ArrayValues } from "type-fest";

/**
 * @packageDocumentation
 * Require worker handles to be retained so they can be terminated during cleanup.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from "@typescript-eslint/utils";
import { arrayFirst, isDefined, setHas } from "ts-extras";

import { getParentNode } from "../_internal/ast-node.js";
import { createRuleDocsUrl } from "../_internal/rule-docs-url.js";
import { getVariableInScopeChain } from "../_internal/scope-variable.js";
import {
    createTypedRule,
    type TypedRuleContext,
} from "../_internal/typed-rule.js";

const browserWorkerConstructorNames = ["SharedWorker", "Worker"] as const;
const globalReceiverNames = [
    "globalThis",
    "self",
    "window",
] as const;
const workerThreadsModuleNames = [
    "node:worker_threads",
    "worker_threads",
] as const;

type BrowserWorkerConstructorName = ArrayValues<
    typeof browserWorkerConstructorNames
>;

const browserWorkerConstructorNameSet: ReadonlySet<string> = new Set(
    browserWorkerConstructorNames
);
const globalReceiverNameSet: ReadonlySet<string> = new Set(globalReceiverNames);
const workerThreadsModuleNameSet: ReadonlySet<string> = new Set(
    workerThreadsModuleNames
);

const isBrowserWorkerConstructorName = (
    name: string
): name is BrowserWorkerConstructorName =>
    setHas(browserWorkerConstructorNameSet, name);

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

const getImportSourceValue = (
    node: Readonly<TSESTree.Node>
): string | undefined => {
    const parent = getParentNode(node);

    if (
        parent?.type === AST_NODE_TYPES.ImportDeclaration &&
        typeof parent.source.value === "string"
    ) {
        return parent.source.value;
    }

    return undefined;
};

const isWorkerThreadsImportBinding = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);
    const definition = arrayFirst(variable?.defs ?? []);

    const importSource = isDefined(definition)
        ? getImportSourceValue(definition.node)
        : undefined;

    return (
        identifier.name === "Worker" &&
        isDefined(importSource) &&
        setHas(workerThreadsModuleNameSet, importSource)
    );
};

const isShadowedBrowserWorkerIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const getDirectWorkerConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): BrowserWorkerConstructorName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.Identifier ||
        !isBrowserWorkerConstructorName(callee.name)
    ) {
        return undefined;
    }

    if (isWorkerThreadsImportBinding(context, callee)) {
        return "Worker";
    }

    return isShadowedBrowserWorkerIdentifier(context, callee)
        ? undefined
        : callee.name;
};

const getMemberWorkerConstructorName = (
    callee: Readonly<TSESTree.NewExpression["callee"]>
): BrowserWorkerConstructorName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.computed ||
        callee.optional ||
        callee.object.type !== AST_NODE_TYPES.Identifier ||
        callee.property.type !== AST_NODE_TYPES.Identifier ||
        !isGlobalReceiverName(callee.object.name) ||
        !isBrowserWorkerConstructorName(callee.property.name)
    ) {
        return undefined;
    }

    return callee.property.name;
};

const getWorkerConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): BrowserWorkerConstructorName | undefined =>
    getDirectWorkerConstructorName(context, callee) ??
    getMemberWorkerConstructorName(callee);

const isDiscardedWorkerInstance = (
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

const isImmediateWorkerMethodReceiver = (
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
                parent.property.name === "terminate"
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

/** Rule implementation for `runtime-cleanup/no-floating-workers`. */
const noFloatingWorkers: TSESLint.RuleModule<"floatingWorker", readonly []> =
    createTypedRule({
        create: (context) => ({
            NewExpression(node: Readonly<TSESTree.NewExpression>) {
                const workerName = getWorkerConstructorName(
                    context,
                    node.callee
                );

                if (
                    !isDefined(workerName) ||
                    (!isDiscardedWorkerInstance(node) &&
                        !isImmediateWorkerMethodReceiver(node))
                ) {
                    return;
                }

                context.report({
                    data: { workerName },
                    messageId: "floatingWorker",
                    node,
                });
            },
        }),
        defaultOptions: [],
        meta: {
            docs: {
                description:
                    "require worker handles to be retained so they can be terminated during cleanup.",
                recommended: true,
                requiresTypeChecking: false,
                runtimeCleanupConfigs: [
                    "runtime-cleanup.configs.recommended",
                    "runtime-cleanup.configs.recommended-type-checked",
                    "runtime-cleanup.configs.strict",
                    "runtime-cleanup.configs.all",
                ],
                url: createRuleDocsUrl("no-floating-workers"),
            },
            messages: {
                floatingWorker:
                    "Store or return the {{workerName}} handle so it can be terminated during cleanup.",
            },
            schema: [],
            type: "problem",
        },
        name: "no-floating-workers",
    });

export default noFloatingWorkers;
