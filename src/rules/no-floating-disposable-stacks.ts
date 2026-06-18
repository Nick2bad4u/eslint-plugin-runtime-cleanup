import type { ArrayValues } from "type-fest";

/**
 * @packageDocumentation
 * Require DisposableStack handles to be retained so registered disposers run.
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

const disposableStackConstructorNames = [
    "AsyncDisposableStack",
    "DisposableStack",
] as const;
const cleanupMethodNames = ["dispose", "disposeAsync"] as const;
const globalReceiverNames = [
    "globalThis",
    "self",
    "window",
] as const;

type DisposableStackConstructorName = ArrayValues<
    typeof disposableStackConstructorNames
>;

const disposableStackConstructorNameSet: ReadonlySet<string> = new Set(
    disposableStackConstructorNames
);
const cleanupMethodNameSet: ReadonlySet<string> = new Set(cleanupMethodNames);
const globalReceiverNameSet: ReadonlySet<string> = new Set(globalReceiverNames);

const isDisposableStackConstructorName = (
    name: string
): name is DisposableStackConstructorName =>
    setHas(disposableStackConstructorNameSet, name);

const isCleanupMethodName = (name: string): boolean =>
    setHas(cleanupMethodNameSet, name);

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

const isShadowedDisposableStackIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const getDirectDisposableStackConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): DisposableStackConstructorName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.Identifier ||
        !isDisposableStackConstructorName(callee.name) ||
        isShadowedDisposableStackIdentifier(context, callee)
    ) {
        return undefined;
    }

    return callee.name;
};

const getMemberDisposableStackConstructorName = (
    callee: Readonly<TSESTree.NewExpression["callee"]>
): DisposableStackConstructorName | undefined => {
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
        isDisposableStackConstructorName(constructorName)
        ? constructorName
        : undefined;
};

const getDisposableStackConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): DisposableStackConstructorName | undefined =>
    getDirectDisposableStackConstructorName(context, callee) ??
    getMemberDisposableStackConstructorName(callee);

const isDiscardedDisposableStack = (
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

const isImmediateDisposableStackMethodReceiver = (
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

            const methodName = getStaticPropertyName(
                parent.property,
                parent.computed
            );

            if (!isDefined(methodName) || isCleanupMethodName(methodName)) {
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

/** Rule implementation for `runtime-cleanup/no-floating-disposable-stacks`. */
const noFloatingDisposableStacks: TSESLint.RuleModule<
    "floatingDisposableStack",
    readonly []
> = createTypedRule({
    create: (context) => ({
        NewExpression(node: Readonly<TSESTree.NewExpression>) {
            const constructorName = getDisposableStackConstructorName(
                context,
                node.callee
            );

            if (
                !isDefined(constructorName) ||
                (!isDiscardedDisposableStack(node) &&
                    !isImmediateDisposableStackMethodReceiver(node))
            ) {
                return;
            }

            context.report({
                data: { constructorName },
                messageId: "floatingDisposableStack",
                node,
            });
        },
    }),
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require DisposableStack handles to be retained so registered disposers run.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-disposable-stacks"),
        },
        messages: {
            floatingDisposableStack:
                "Store, return, or use the {{constructorName}} handle so registered disposers run during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-disposable-stacks",
});

export default noFloatingDisposableStacks;
