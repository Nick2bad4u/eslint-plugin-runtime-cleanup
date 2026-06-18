import type { ArrayValues } from "type-fest";

/**
 * @packageDocumentation
 * Require child process handles to be retained so they can be killed during cleanup.
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

const childProcessFactoryNames = [
    "exec",
    "execFile",
    "fork",
    "spawn",
] as const;
const childProcessModuleNames = [
    "child_process",
    "node:child_process",
] as const;
const immediateCleanupMethodNames = ["disconnect", "kill"] as const;

type ChildProcessFactoryName = ArrayValues<typeof childProcessFactoryNames>;

const childProcessFactoryNameSet: ReadonlySet<string> = new Set(
    childProcessFactoryNames
);
const childProcessModuleNameSet: ReadonlySet<string> = new Set(
    childProcessModuleNames
);
const immediateCleanupMethodNameSet: ReadonlySet<string> = new Set(
    immediateCleanupMethodNames
);

const isChildProcessFactoryName = (
    name: string
): name is ChildProcessFactoryName => setHas(childProcessFactoryNameSet, name);

const isImmediateCleanupMethodName = (name: string): boolean =>
    setHas(immediateCleanupMethodNameSet, name);

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

const getImportedSpecifierName = (
    node: Readonly<TSESTree.ImportSpecifier>
): string | undefined => getStaticPropertyName(node.imported);

const getObjectPatternPropertyNameForIdentifier = (
    objectPattern: Readonly<TSESTree.ObjectPattern>,
    identifierName: string
): string | undefined => {
    for (const property of objectPattern.properties) {
        if (
            property.type === AST_NODE_TYPES.Property &&
            property.value.type === AST_NODE_TYPES.Identifier &&
            property.value.name === identifierName
        ) {
            return getStaticPropertyName(property.key);
        }
    }

    return undefined;
};

const isChildProcessModuleSource = (source: string | undefined): boolean =>
    isDefined(source) && setHas(childProcessModuleNameSet, source);

const getDefinitionForIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
) => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return arrayFirst(variable?.defs ?? []);
};

const isChildProcessModuleBinding = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const definition = getDefinitionForIdentifier(context, identifier);

    if (!isDefined(definition)) {
        return false;
    }

    return isChildProcessModuleSource(
        getDefinitionModuleSource(definition.node)
    );
};

const getNamedChildProcessFactoryBindingName = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): ChildProcessFactoryName | undefined => {
    const definition = getDefinitionForIdentifier(context, identifier);

    if (!isDefined(definition)) {
        return undefined;
    }

    const source = getDefinitionModuleSource(definition.node);

    if (!isChildProcessModuleSource(source)) {
        return undefined;
    }

    if (definition.node.type === AST_NODE_TYPES.ImportSpecifier) {
        const importedName = getImportedSpecifierName(definition.node);

        return isDefined(importedName) &&
            isChildProcessFactoryName(importedName)
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

        return isDefined(propertyName) &&
            isChildProcessFactoryName(propertyName)
            ? propertyName
            : undefined;
    }

    return undefined;
};

const getRequireMemberFactoryName = (
    callee: Readonly<TSESTree.CallExpression["callee"]>
): ChildProcessFactoryName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.computed ||
        callee.optional ||
        callee.property.type !== AST_NODE_TYPES.Identifier ||
        !isChildProcessFactoryName(callee.property.name) ||
        callee.object.type !== AST_NODE_TYPES.CallExpression ||
        !isChildProcessModuleSource(getRequireSourceValue(callee.object))
    ) {
        return undefined;
    }

    return callee.property.name;
};

const getModuleMemberFactoryName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): ChildProcessFactoryName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.MemberExpression ||
        callee.computed ||
        callee.optional ||
        callee.object.type !== AST_NODE_TYPES.Identifier ||
        callee.property.type !== AST_NODE_TYPES.Identifier ||
        !isChildProcessFactoryName(callee.property.name) ||
        !isChildProcessModuleBinding(context, callee.object)
    ) {
        return undefined;
    }

    return callee.property.name;
};

const getChildProcessFactoryName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): ChildProcessFactoryName | undefined => {
    if (callee.type === AST_NODE_TYPES.Identifier) {
        return getNamedChildProcessFactoryBindingName(context, callee);
    }

    return (
        getModuleMemberFactoryName(context, callee) ??
        getRequireMemberFactoryName(callee)
    );
};

const isDiscardedChildProcessHandle = (
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

const isImmediateChildProcessMethodReceiver = (
    node: Readonly<TSESTree.CallExpression>
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

        current = parent;
        parent = getParentNode(current);
    }

    return false;
};

/** Rule implementation for `runtime-cleanup/no-floating-child-processes`. */
const noFloatingChildProcesses: TSESLint.RuleModule<
    "floatingChildProcess",
    readonly []
> = createTypedRule({
    create: (context) => ({
        CallExpression(node: Readonly<TSESTree.CallExpression>) {
            const factoryName = getChildProcessFactoryName(
                context,
                node.callee
            );

            if (
                !isDefined(factoryName) ||
                (!isDiscardedChildProcessHandle(node) &&
                    !isImmediateChildProcessMethodReceiver(node))
            ) {
                return;
            }

            context.report({
                data: { factoryName },
                messageId: "floatingChildProcess",
                node,
            });
        },
    }),
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require child process handles to be retained so they can be killed during cleanup.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-child-processes"),
        },
        messages: {
            floatingChildProcess:
                "Store or return the child process handle from {{factoryName}} so it can be killed during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-child-processes",
});

export default noFloatingChildProcesses;
