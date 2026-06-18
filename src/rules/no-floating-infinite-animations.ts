/**
 * @packageDocumentation
 * Require infinite Web Animations to be retained so they can be canceled.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from "@typescript-eslint/utils";
import { arrayAt, isDefined } from "ts-extras";

import {
    getStaticPropertyName,
    isDiscardedResourceExpression,
    isImmediateUnownedMemberReceiver,
} from "../_internal/floating-resource.js";
import { createRuleDocsUrl } from "../_internal/rule-docs-url.js";
import { getVariableInScopeChain } from "../_internal/scope-variable.js";
import { hasTypeNameInHierarchy } from "../_internal/type-checker.js";
import {
    createTypedRule,
    getTypedRuleServices,
    type TypedRuleContext,
} from "../_internal/typed-rule.js";

const animationCleanupMemberNames: ReadonlySet<string> = new Set([
    "cancel",
    "finish",
]);

const isShadowedIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const isGlobalInfinityIdentifier = (
    context: TypedRuleContext,
    node: Readonly<TSESTree.Identifier>
): boolean => node.name === "Infinity" && !isShadowedIdentifier(context, node);

const isNumberPositiveInfinity = (
    node: Readonly<TSESTree.MemberExpression>
): boolean => {
    if (node.optional) {
        return false;
    }

    const propertyName = getStaticPropertyName(node.property, node.computed);

    if (propertyName !== "POSITIVE_INFINITY") {
        return false;
    }

    if (node.object.type === AST_NODE_TYPES.Identifier) {
        return node.object.name === "Number";
    }

    if (node.object.type !== AST_NODE_TYPES.MemberExpression) {
        return false;
    }

    const objectPropertyName = getStaticPropertyName(
        node.object.property,
        node.object.computed
    );

    return (
        objectPropertyName === "Number" &&
        node.object.object.type === AST_NODE_TYPES.Identifier &&
        (node.object.object.name === "globalThis" ||
            node.object.object.name === "window")
    );
};

const isInfinityExpression = (
    context: TypedRuleContext,
    node: Readonly<TSESTree.Expression>
): boolean => {
    if (node.type === AST_NODE_TYPES.Identifier) {
        return isGlobalInfinityIdentifier(context, node);
    }

    if (
        node.type === AST_NODE_TYPES.UnaryExpression &&
        node.operator === "+" &&
        node.argument.type === AST_NODE_TYPES.Identifier
    ) {
        return isGlobalInfinityIdentifier(context, node.argument);
    }

    return (
        node.type === AST_NODE_TYPES.MemberExpression &&
        isNumberPositiveInfinity(node)
    );
};

const getPropertyKeyName = (
    property: Readonly<TSESTree.Property>
): string | undefined => getStaticPropertyName(property.key, property.computed);

const isExpressionPropertyValue = (
    node: Readonly<TSESTree.Property["value"]>
): node is TSESTree.Expression =>
    node.type !== AST_NODE_TYPES.ArrayPattern &&
    node.type !== AST_NODE_TYPES.AssignmentPattern &&
    node.type !== AST_NODE_TYPES.ObjectPattern &&
    node.type !== AST_NODE_TYPES.TSEmptyBodyFunctionExpression;

const hasInfiniteIterationsOption = (
    context: TypedRuleContext,
    options: Readonly<TSESTree.CallExpressionArgument>
): boolean => {
    if (options.type !== AST_NODE_TYPES.ObjectExpression) {
        return false;
    }

    return options.properties.some((property) => {
        if (
            property.type !== AST_NODE_TYPES.Property ||
            property.kind !== "init" ||
            !isExpressionPropertyValue(property.value) ||
            getPropertyKeyName(property) !== "iterations"
        ) {
            return false;
        }

        return isInfinityExpression(context, property.value);
    });
};

const getAnimationReceiver = (
    callee: Readonly<TSESTree.CallExpression["callee"]>
): TSESTree.MemberExpression["object"] | undefined => {
    if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.optional) {
        return undefined;
    }

    if (callee.object.type === AST_NODE_TYPES.Super) {
        return undefined;
    }

    const propertyName = getStaticPropertyName(
        callee.property,
        callee.computed
    );

    return propertyName === "animate" ? callee.object : undefined;
};

const isReceiverElement = (
    context: TypedRuleContext,
    receiver: Readonly<TSESTree.Expression>
): boolean => {
    const { checker, parserServices } = getTypedRuleServices(context);
    const receiverType = checker.getTypeAtLocation(
        parserServices.esTreeNodeToTSNodeMap.get(receiver)
    );

    return hasTypeNameInHierarchy(checker, receiverType, "Element");
};

/** Rule implementation for `runtime-cleanup/no-floating-infinite-animations`. */
const noFloatingInfiniteAnimations: TSESLint.RuleModule<
    "floatingInfiniteAnimation",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            CallExpression(node: Readonly<TSESTree.CallExpression>) {
                const receiver = getAnimationReceiver(node.callee);
                const timingOptions = arrayAt(node.arguments, 1);

                if (
                    !isDefined(receiver) ||
                    !isDefined(timingOptions) ||
                    !hasInfiniteIterationsOption(context, timingOptions) ||
                    !isReceiverElement(context, receiver) ||
                    (!isDiscardedResourceExpression(node) &&
                        !isImmediateUnownedMemberReceiver(
                            node,
                            animationCleanupMemberNames
                        ))
                ) {
                    return;
                }

                context.report({
                    messageId: "floatingInfiniteAnimation",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require infinite Web Animations to be retained so they can be canceled.",
            recommended: true,
            requiresTypeChecking: true,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-infinite-animations"),
        },
        messages: {
            floatingInfiniteAnimation:
                "Store or return the infinite Animation so cancel() can stop it during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-infinite-animations",
});

export default noFloatingInfiniteAnimations;
