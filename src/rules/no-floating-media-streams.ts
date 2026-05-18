import type { ArrayValues } from "type-fest";

/**
 * @packageDocumentation
 * Require captured MediaStream handles to be retained so their tracks can be stopped.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from "@typescript-eslint/utils";
import { arrayAt, arrayFirst, isDefined, setHas } from "ts-extras";

import { getParentNode } from "../_internal/ast-node.js";
import { createRuleDocsUrl } from "../_internal/rule-docs-url.js";
import { getVariableInScopeChain } from "../_internal/scope-variable.js";
import {
    createTypedRule,
    type TypedRuleContext,
} from "../_internal/typed-rule.js";

const mediaCaptureFunctionNames = [
    "getDisplayMedia",
    "getUserMedia",
] as const;
const globalNavigatorReceiverNames = ["globalThis", "window"] as const;

type MediaCaptureFunctionName = ArrayValues<typeof mediaCaptureFunctionNames>;

const mediaCaptureFunctionNameSet: ReadonlySet<string> = new Set(
    mediaCaptureFunctionNames
);
const globalNavigatorReceiverNameSet: ReadonlySet<string> = new Set(
    globalNavigatorReceiverNames
);

const isMediaCaptureFunctionName = (
    name: string
): name is MediaCaptureFunctionName =>
    setHas(mediaCaptureFunctionNameSet, name);

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

const getMediaCaptureNameFromPath = (
    path: readonly string[]
): MediaCaptureFunctionName | undefined => {
    const captureName = arrayAt(path, -1);

    if (!isDefined(captureName) || !isMediaCaptureFunctionName(captureName)) {
        return undefined;
    }

    if (
        path.length === 3 &&
        arrayFirst(path) === "navigator" &&
        path[1] === "mediaDevices"
    ) {
        return captureName;
    }

    if (
        path.length === 4 &&
        setHas(globalNavigatorReceiverNameSet, arrayFirst(path) ?? "") &&
        path[1] === "navigator" &&
        path[2] === "mediaDevices"
    ) {
        return captureName;
    }

    return undefined;
};

const getMediaCaptureFunctionName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): MediaCaptureFunctionName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        isNavigatorPathShadowed(context, callee)
    ) {
        return undefined;
    }

    const path = collectStaticMemberPath(callee);

    return isDefined(path) ? getMediaCaptureNameFromPath(path) : undefined;
};

const isDiscardedMediaStreamRequest = (
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

/** Rule implementation for `runtime-cleanup/no-floating-media-streams`. */
const noFloatingMediaStreams: TSESLint.RuleModule<
    "floatingMediaStream",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            CallExpression(node: Readonly<TSESTree.CallExpression>) {
                const captureName = getMediaCaptureFunctionName(
                    context,
                    node.callee
                );

                if (
                    !isDefined(captureName) ||
                    !isDiscardedMediaStreamRequest(node)
                ) {
                    return;
                }

                context.report({
                    data: { captureName },
                    messageId: "floatingMediaStream",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require captured MediaStream handles to be retained so their tracks can be stopped.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-media-streams"),
        },
        messages: {
            floatingMediaStream:
                "Store or return the MediaStream from {{captureName}} so its tracks can be stopped during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-media-streams",
});

export default noFloatingMediaStreams;
