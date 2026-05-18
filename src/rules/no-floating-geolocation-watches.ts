/**
 * @packageDocumentation
 * Require geolocation watch IDs to be retained so they can be cleared.
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

const geolocationWatchFunctionName = "watchPosition";
const globalNavigatorReceiverNames = ["globalThis", "window"] as const;

const globalNavigatorReceiverNameSet: ReadonlySet<string> = new Set(
    globalNavigatorReceiverNames
);

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

    return !isDefined(objectPath) || !isDefined(propertyName)
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

const isGeolocationWatchPath = (path: readonly string[]): boolean =>
    (path.length === 3 &&
        arrayFirst(path) === "navigator" &&
        path[1] === "geolocation" &&
        path[2] === geolocationWatchFunctionName) ||
    (path.length === 4 &&
        setHas(globalNavigatorReceiverNameSet, arrayFirst(path) ?? "") &&
        path[1] === "navigator" &&
        path[2] === "geolocation" &&
        path[3] === geolocationWatchFunctionName);

const isGeolocationWatchCall = (
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

    return isDefined(path) && isGeolocationWatchPath(path);
};

const isDiscardedWatchId = (
    node: Readonly<TSESTree.CallExpression>
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

/** Rule implementation for `runtime-cleanup/no-floating-geolocation-watches`. */
const noFloatingGeolocationWatches: TSESLint.RuleModule<
    "floatingGeolocationWatch",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            CallExpression(node: Readonly<TSESTree.CallExpression>) {
                if (
                    !isGeolocationWatchCall(context, node.callee) ||
                    !isDiscardedWatchId(node)
                ) {
                    return;
                }

                context.report({
                    messageId: "floatingGeolocationWatch",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require geolocation watch IDs to be retained so they can be cleared.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-geolocation-watches"),
        },
        messages: {
            floatingGeolocationWatch:
                "Store or return the geolocation watch ID so navigator.geolocation.clearWatch() can remove the location watcher during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-geolocation-watches",
});

export default noFloatingGeolocationWatches;
