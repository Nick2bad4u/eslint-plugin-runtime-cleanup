/**
 * @packageDocumentation
 * Require event listeners to have an explicit cleanup path.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from "@typescript-eslint/utils";
import { arrayFirst, isDefined, setHas, stringSplit } from "ts-extras";

import { getParentNode } from "../_internal/ast-node.js";
import { createRuleDocsUrl } from "../_internal/rule-docs-url.js";
import { getVariableInScopeChain } from "../_internal/scope-variable.js";
import {
    createTypedRule,
    type TypedRuleContext,
} from "../_internal/typed-rule.js";

type AddEventListenerRecord = Readonly<{
    cleanupKey: EventListenerCleanupKey;
    node: TSESTree.CallExpression;
}>;

type CleanupBoundary =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.Program;

type EventListenerCleanupKey = `${string}\u0000${string}\u0000${string}\u0000${string}`;
type ReadonlyCleanupBoundary = Readonly<CleanupBoundary>;

const unknownCaptureKey = "*";

const isCleanupBoundary = (
    node: Readonly<TSESTree.Node>
): node is CleanupBoundary =>
    node.type === AST_NODE_TYPES.Program ||
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression;

const getCleanupBoundary = (
    node: Readonly<TSESTree.Node>
): CleanupBoundary => {
    let current: Readonly<TSESTree.Node> | undefined = node;

    while (isDefined(current)) {
        if (isCleanupBoundary(current)) {
            return current;
        }

        current = getParentNode(current);
    }

    throw new TypeError("Expected an addEventListener call to have a program.");
};

const getStaticPropertyName = (
    property: Readonly<TSESTree.PrivateIdentifier | TSESTree.PropertyName>
): string | undefined => {
    if (property.type === AST_NODE_TYPES.Identifier) {
        return property.name;
    }

    if (
        property.type === AST_NODE_TYPES.Literal &&
        typeof property.value === "string"
    ) {
        return property.value;
    }

    return undefined;
};

const isMethodCallNamed = (
    callee: Readonly<TSESTree.CallExpression["callee"]>,
    methodName: string
): callee is TSESTree.MemberExpression =>
    callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.computed &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === methodName;

const isUnknownRecord = (value: unknown): value is Record<PropertyKey, unknown> =>
    typeof value === "object" && value !== null;

const isVariableDeclarator = (
    node: unknown
): node is TSESTree.VariableDeclarator =>
    isUnknownRecord(node) &&
    node["type"] === AST_NODE_TYPES.VariableDeclarator;

const getVariableInitializer = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): TSESTree.Expression | undefined => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);
    const definition = arrayFirst(variable?.defs ?? []);
    const definitionNode = definition?.node;

    if (!isVariableDeclarator(definitionNode)) {
        return undefined;
    }

    return definitionNode.init ?? undefined;
};

const resolveOptionsExpression = (
    context: TypedRuleContext,
    argument: Readonly<TSESTree.Expression | TSESTree.SpreadElement>
): TSESTree.Expression | undefined => {
    if (argument.type === AST_NODE_TYPES.SpreadElement) {
        return undefined;
    }

    if (argument.type === AST_NODE_TYPES.Identifier) {
        return getVariableInitializer(context, argument);
    }

    return argument;
};

const objectExpressionHasProperty = (
    objectExpression: Readonly<TSESTree.ObjectExpression>,
    propertyName: string
): boolean =>
    objectExpression.properties.some((property) => {
        if (property.type === AST_NODE_TYPES.SpreadElement) {
            return true;
        }

        return getStaticPropertyName(property.key) === propertyName;
    });

const getBooleanPropertyValue = (
    objectExpression: Readonly<TSESTree.ObjectExpression>,
    propertyName: string
): boolean | undefined => {
    for (const property of objectExpression.properties) {
        if (
            property.type === AST_NODE_TYPES.Property &&
            getStaticPropertyName(property.key) === propertyName &&
            property.value.type === AST_NODE_TYPES.Literal &&
            typeof property.value.value === "boolean"
        ) {
            return property.value.value;
        }
    }

    return undefined;
};

const hasAbortSignalOption = (
    context: TypedRuleContext,
    argument: Readonly<TSESTree.Expression | TSESTree.SpreadElement> | undefined
): boolean => {
    if (!isDefined(argument)) {
        return false;
    }

    const resolvedOptions = resolveOptionsExpression(context, argument);

    return (
        resolvedOptions?.type === AST_NODE_TYPES.ObjectExpression &&
        objectExpressionHasProperty(resolvedOptions, "signal")
    );
};

const getCaptureKey = (
    context: TypedRuleContext,
    argument: Readonly<TSESTree.Expression | TSESTree.SpreadElement> | undefined
): string => {
    if (!isDefined(argument)) {
        return "false";
    }

    const resolvedOptions = resolveOptionsExpression(context, argument);

    if (!isDefined(resolvedOptions)) {
        return unknownCaptureKey;
    }

    if (
        resolvedOptions.type === AST_NODE_TYPES.Literal &&
        typeof resolvedOptions.value === "boolean"
    ) {
        return String(resolvedOptions.value);
    }

    if (resolvedOptions.type === AST_NODE_TYPES.ObjectExpression) {
        const captureValue = getBooleanPropertyValue(
            resolvedOptions,
            "capture"
        );

        return isDefined(captureValue) ? String(captureValue) : "false";
    }

    return unknownCaptureKey;
};

const getCleanupKey = (
    context: TypedRuleContext,
    node: Readonly<TSESTree.CallExpression>
): EventListenerCleanupKey | undefined => {
    if (node.arguments.length < 2 || node.callee.type !== AST_NODE_TYPES.MemberExpression) {
        return undefined;
    }

    const [eventType, listener, options] = node.arguments;

    if (
        !isDefined(eventType) ||
        !isDefined(listener) ||
        eventType.type === AST_NODE_TYPES.SpreadElement ||
        listener.type === AST_NODE_TYPES.SpreadElement
    ) {
        return undefined;
    }

    const targetText = context.sourceCode.getText(node.callee.object);
    const eventTypeText = context.sourceCode.getText(eventType);
    const listenerText = context.sourceCode.getText(listener);
    const captureKey = getCaptureKey(context, options);

    return `${targetText}\u0000${eventTypeText}\u0000${listenerText}\u0000${captureKey}`;
};

const getWildcardCleanupKey = (
    cleanupKey: EventListenerCleanupKey
): EventListenerCleanupKey => {
    const [targetText, eventTypeText, listenerText] = stringSplit(
        cleanupKey,
        "\u0000"
    );

    if (
        !isDefined(targetText) ||
        !isDefined(eventTypeText) ||
        !isDefined(listenerText)
    ) {
        throw new TypeError("Expected a complete event listener cleanup key.");
    }

    return `${targetText}\u0000${eventTypeText}\u0000${listenerText}\u0000${unknownCaptureKey}`;
};

/** Rule implementation for `runtime-cleanup/no-unmanaged-event-listeners`. */
const noUnmanagedEventListeners: TSESLint.RuleModule<
    "unmanagedEventListener",
    readonly []
> = createTypedRule({
    create(context) {
        const addsByBoundary = new Map<
            ReadonlyCleanupBoundary,
            AddEventListenerRecord[]
        >();
        const removesByBoundary = new Map<
            ReadonlyCleanupBoundary,
            Set<EventListenerCleanupKey>
        >();

        const addRecord = (
            boundary: ReadonlyCleanupBoundary,
            record: AddEventListenerRecord
        ): void => {
            const records = addsByBoundary.get(boundary);

            if (!isDefined(records)) {
                addsByBoundary.set(boundary, [record]);
                return;
            }

            records.push(record);
        };

        const addRemoveKey = (
            boundary: ReadonlyCleanupBoundary,
            cleanupKey: EventListenerCleanupKey
        ): void => {
            const cleanupKeys = removesByBoundary.get(boundary);

            if (!isDefined(cleanupKeys)) {
                removesByBoundary.set(boundary, new Set([cleanupKey]));
                return;
            }

            cleanupKeys.add(cleanupKey);
        };

        return {
            'CallExpression[callee.type="MemberExpression"]'(
                node: TSESTree.CallExpression
            ) {
                if (
                    isMethodCallNamed(node.callee, "addEventListener") &&
                    !hasAbortSignalOption(context, node.arguments[2])
                ) {
                    const cleanupKey = getCleanupKey(context, node);

                    if (isDefined(cleanupKey)) {
                        addRecord(getCleanupBoundary(node), {
                            cleanupKey,
                            node,
                        });
                    }
                }

                if (isMethodCallNamed(node.callee, "removeEventListener")) {
                    const cleanupKey = getCleanupKey(context, node);

                    if (isDefined(cleanupKey)) {
                        addRemoveKey(getCleanupBoundary(node), cleanupKey);
                    }
                }
            },
            "Program:exit"() {
                for (const [boundary, addRecords] of addsByBoundary) {
                    const removeKeys =
                        removesByBoundary.get(boundary) ?? new Set();

                    for (const { cleanupKey, node } of addRecords) {
                        if (
                            !setHas(removeKeys, cleanupKey) &&
                            !setHas(
                                removeKeys,
                                getWildcardCleanupKey(cleanupKey)
                            )
                        ) {
                            context.report({
                                messageId: "unmanagedEventListener",
                                node,
                            });
                        }
                    }
                }
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require event listeners to have an abort signal or a matching cleanup call.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-unmanaged-event-listeners"),
        },
        messages: {
            unmanagedEventListener:
                "Add an AbortSignal option or a matching removeEventListener call for this listener.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-unmanaged-event-listeners",
});

export default noUnmanagedEventListeners;
