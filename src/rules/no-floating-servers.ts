/**
 * @packageDocumentation
 * Require Node.js server handles to be retained so they can be closed.
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

const serverFactoryNames = [
    "createSecureServer",
    "createServer",
] as const;
const http2OnlyServerFactoryNames = ["createSecureServer"] as const;
const serverModuleNames = [
    "http",
    "http2",
    "https",
    "net",
    "node:http",
    "node:http2",
    "node:https",
    "node:net",
] as const;
const http2ServerModuleNames = ["http2", "node:http2"] as const;
const immediateCleanupMethodNames = ["close"] as const;

type ServerFactoryName = (typeof serverFactoryNames)[number];

const serverFactoryNameSet: ReadonlySet<string> = new Set(serverFactoryNames);
const http2OnlyServerFactoryNameSet: ReadonlySet<string> = new Set(
    http2OnlyServerFactoryNames
);
const serverModuleNameSet: ReadonlySet<string> = new Set(serverModuleNames);
const http2ServerModuleNameSet: ReadonlySet<string> = new Set(
    http2ServerModuleNames
);
const immediateCleanupMethodNameSet: ReadonlySet<string> = new Set(
    immediateCleanupMethodNames
);

const isServerFactoryName = (name: string): name is ServerFactoryName =>
    serverFactoryNameSet.has(name);

const isHttp2OnlyServerFactoryName = (name: string): boolean =>
    http2OnlyServerFactoryNameSet.has(name);

const isServerModuleSource = (source: string | undefined): boolean =>
    source !== undefined && serverModuleNameSet.has(source);

const isHttp2ServerModuleSource = (source: string | undefined): boolean =>
    source !== undefined && http2ServerModuleNameSet.has(source);

const isImmediateCleanupMethodName = (name: string): boolean =>
    immediateCleanupMethodNameSet.has(name);

const isValidServerFactoryForSource = (
    source: string | undefined,
    factoryName: string
): factoryName is ServerFactoryName =>
    isServerModuleSource(source) &&
    isServerFactoryName(factoryName) &&
    (!isHttp2OnlyServerFactoryName(factoryName) ||
        isHttp2ServerModuleSource(source));

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

const getDefinitionForIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
) => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable?.defs[0];
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

const getModuleSourceForBinding = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): string | undefined => {
    const definition = getDefinitionForIdentifier(context, identifier);

    return definition === undefined
        ? undefined
        : getDefinitionModuleSource(definition.node);
};

const getNamedServerFactoryBindingName = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): ServerFactoryName | undefined => {
    const definition = getDefinitionForIdentifier(context, identifier);

    if (definition === undefined) {
        return undefined;
    }

    const source = getDefinitionModuleSource(definition.node);

    if (definition.node.type === AST_NODE_TYPES.ImportSpecifier) {
        const importedName = getImportedSpecifierName(definition.node);

        return importedName !== undefined &&
            isValidServerFactoryForSource(source, importedName)
            ? importedName
            : undefined;
    }

    if (
        definition.node.type === AST_NODE_TYPES.VariableDeclarator &&
        definition.node.id.type === AST_NODE_TYPES.ObjectPattern
    ) {
        const propertyName = getObjectPatternPropertyNameForIdentifier(
            definition.node.id,
            identifier.name
        );

        return propertyName !== undefined &&
            isValidServerFactoryForSource(source, propertyName)
            ? propertyName
            : undefined;
    }

    return undefined;
};

const getRequireMemberFactoryName = (
    callee: Readonly<TSESTree.CallExpression["callee"]>
): ServerFactoryName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.computed ||
        callee.optional ||
        callee.property.type !== AST_NODE_TYPES.Identifier ||
        callee.object.type !== AST_NODE_TYPES.CallExpression
    ) {
        return undefined;
    }

    const source = getRequireSourceValue(callee.object);
    const factoryName = callee.property.name;

    return isValidServerFactoryForSource(source, factoryName)
        ? factoryName
        : undefined;
};

const getModuleMemberFactoryName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): ServerFactoryName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.computed ||
        callee.optional ||
        callee.object.type !== AST_NODE_TYPES.Identifier ||
        callee.property.type !== AST_NODE_TYPES.Identifier
    ) {
        return undefined;
    }

    const source = getModuleSourceForBinding(context, callee.object);
    const factoryName = callee.property.name;

    return isValidServerFactoryForSource(source, factoryName)
        ? factoryName
        : undefined;
};

const getServerFactoryName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): ServerFactoryName | undefined => {
    if (callee.type === AST_NODE_TYPES.Identifier) {
        return getNamedServerFactoryBindingName(context, callee);
    }

    return (
        getModuleMemberFactoryName(context, callee) ??
        getRequireMemberFactoryName(callee)
    );
};

const isDiscardedExpression = (node: Readonly<TSESTree.Node>): boolean => {
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

const getImmediateServerMethodCall = (
    node: Readonly<TSESTree.Node>
): TSESTree.CallExpression | undefined => {
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
            return undefined;
        }

        const callExpression = getParentNode(parent);

        return callExpression?.type === AST_NODE_TYPES.CallExpression &&
            callExpression.callee === parent
            ? callExpression
            : undefined;
    }

    return undefined;
};

const isDiscardedImmediateServerMethodChain = (
    node: Readonly<TSESTree.CallExpression>
): boolean => {
    let currentCall = getImmediateServerMethodCall(node);

    while (currentCall !== undefined) {
        if (isDiscardedExpression(currentCall)) {
            return true;
        }

        currentCall = getImmediateServerMethodCall(currentCall);
    }

    return false;
};

const isDiscardedServerHandle = (
    node: Readonly<TSESTree.CallExpression>
): boolean =>
    isDiscardedExpression(node) || isDiscardedImmediateServerMethodChain(node);

/** Rule implementation for `runtime-cleanup/no-floating-servers`. */
const noFloatingServers: TSESLint.RuleModule<
    "floatingServer",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            CallExpression(node: Readonly<TSESTree.CallExpression>) {
                const factoryName = getServerFactoryName(context, node.callee);

                if (
                    factoryName === undefined ||
                    !isDiscardedServerHandle(node)
                ) {
                    return;
                }

                context.report({
                    data: { factoryName },
                    messageId: "floatingServer",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require Node.js server handles to be retained so they can be closed.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-servers"),
        },
        messages: {
            floatingServer:
                "Store or return the server from {{factoryName}} so close() can stop it during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-servers",
});

export default noFloatingServers;
