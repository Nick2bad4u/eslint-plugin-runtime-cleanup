/**
 * @packageDocumentation
 * Require Node.js file watcher handles to be retained so they can be closed.
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

const fileWatcherFactoryName = "watch";
const fsModuleNames = ["fs", "node:fs"] as const;
const immediateCleanupMethodNames = ["close"] as const;

const fsModuleNameSet: ReadonlySet<string> = new Set(fsModuleNames);
const immediateCleanupMethodNameSet: ReadonlySet<string> = new Set(
    immediateCleanupMethodNames
);

const isImmediateCleanupMethodName = (name: string): boolean =>
    immediateCleanupMethodNameSet.has(name);

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
    node: Readonly<TSESTree.PropertyName>
): string | undefined => {
    if (node.type === AST_NODE_TYPES.Identifier) {
        return node.name;
    }

    if (
        node.type === AST_NODE_TYPES.Literal &&
        typeof node.value === "string"
    ) {
        return node.value;
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

const getRequireSourceValue = (
    expression: Readonly<null | TSESTree.Expression>
): string | undefined => {
    if (
        expression?.type !== AST_NODE_TYPES.CallExpression ||
        expression.callee.type !== AST_NODE_TYPES.Identifier ||
        expression.callee.name !== "require"
    ) {
        return undefined;
    }

    const [source] = expression.arguments;

    return source?.type === AST_NODE_TYPES.Literal &&
        typeof source.value === "string"
        ? source.value
        : undefined;
};

const getDefinitionModuleSource = (
    node: Readonly<TSESTree.Node>
): string | undefined => {
    if (
        node.type === AST_NODE_TYPES.ImportDefaultSpecifier ||
        node.type === AST_NODE_TYPES.ImportNamespaceSpecifier ||
        node.type === AST_NODE_TYPES.ImportSpecifier
    ) {
        return getImportSourceValue(node);
    }

    if (node.type === AST_NODE_TYPES.VariableDeclarator) {
        return getRequireSourceValue(node.init);
    }

    return undefined;
};

const isFsModuleSource = (source: string | undefined): boolean =>
    source !== undefined && fsModuleNameSet.has(source);

const getDefinitionForIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
) => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable?.defs[0];
};

const isFsModuleBinding = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const definition = getDefinitionForIdentifier(context, identifier);

    return (
        definition !== undefined &&
        isFsModuleSource(getDefinitionModuleSource(definition.node))
    );
};

const getImportedSpecifierName = (
    node: Readonly<TSESTree.ImportSpecifier>
): string | undefined => getStaticPropertyName(node.imported);

const getObjectPatternPropertyNameForIdentifier = (
    objectPattern: Readonly<TSESTree.ObjectPattern>,
    identifierName: string
): string | undefined => {
    for (const property of objectPattern.properties) {
        if (
            property.type !== AST_NODE_TYPES.Property ||
            property.value.type !== AST_NODE_TYPES.Identifier ||
            property.value.name !== identifierName
        ) {
            continue;
        }

        return getStaticPropertyName(property.key);
    }

    return undefined;
};

const getNamedFileWatcherBindingName = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): string | undefined => {
    const definition = getDefinitionForIdentifier(context, identifier);

    if (definition === undefined) {
        return undefined;
    }

    const source = getDefinitionModuleSource(definition.node);

    if (!isFsModuleSource(source)) {
        return undefined;
    }

    if (definition.node.type === AST_NODE_TYPES.ImportSpecifier) {
        return getImportedSpecifierName(definition.node) ===
            fileWatcherFactoryName
            ? fileWatcherFactoryName
            : undefined;
    }

    if (
        definition.node.type === AST_NODE_TYPES.VariableDeclarator &&
        definition.node.id.type === AST_NODE_TYPES.ObjectPattern
    ) {
        return getObjectPatternPropertyNameForIdentifier(
            definition.node.id,
            identifier.name
        ) === fileWatcherFactoryName
            ? fileWatcherFactoryName
            : undefined;
    }

    return undefined;
};

const getRequireMemberFactoryName = (
    callee: Readonly<TSESTree.CallExpression["callee"]>
): string | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.computed ||
        callee.optional ||
        callee.property.type !== AST_NODE_TYPES.Identifier ||
        callee.property.name !== fileWatcherFactoryName ||
        callee.object.type !== AST_NODE_TYPES.CallExpression ||
        !isFsModuleSource(getRequireSourceValue(callee.object))
    ) {
        return undefined;
    }

    return callee.property.name;
};

const getModuleMemberFactoryName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): string | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.computed ||
        callee.optional ||
        callee.object.type !== AST_NODE_TYPES.Identifier ||
        callee.property.type !== AST_NODE_TYPES.Identifier ||
        callee.property.name !== fileWatcherFactoryName ||
        !isFsModuleBinding(context, callee.object)
    ) {
        return undefined;
    }

    return callee.property.name;
};

const getFileWatcherFactoryName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): string | undefined => {
    if (callee.type === AST_NODE_TYPES.Identifier) {
        return getNamedFileWatcherBindingName(context, callee);
    }

    return (
        getModuleMemberFactoryName(context, callee) ??
        getRequireMemberFactoryName(callee)
    );
};

const isDiscardedFileWatcherHandle = (
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

const isImmediateFileWatcherMethodReceiver = (
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
            parent.type !== AST_NODE_TYPES.MemberExpression ||
            parent.object !== current ||
            parent.computed ||
            parent.property.type !== AST_NODE_TYPES.Identifier ||
            isImmediateCleanupMethodName(parent.property.name)
        ) {
            return false;
        }

        const callExpression = getParentNode(parent);

        return (
            callExpression?.type === AST_NODE_TYPES.CallExpression &&
            callExpression.callee === parent
        );
    }

    return false;
};

/** Rule implementation for `runtime-cleanup/no-floating-file-watchers`. */
const noFloatingFileWatchers: TSESLint.RuleModule<
    "floatingFileWatcher",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            CallExpression(node: Readonly<TSESTree.CallExpression>) {
                const factoryName = getFileWatcherFactoryName(
                    context,
                    node.callee
                );

                if (
                    factoryName === undefined ||
                    (!isDiscardedFileWatcherHandle(node) &&
                        !isImmediateFileWatcherMethodReceiver(node))
                ) {
                    return;
                }

                context.report({
                    data: { factoryName },
                    messageId: "floatingFileWatcher",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require Node.js file watcher handles to be retained so they can be closed.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-file-watchers"),
        },
        messages: {
            floatingFileWatcher:
                "Store or return the file watcher from {{factoryName}} so close() can stop watching during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-file-watchers",
});

export default noFloatingFileWatchers;
