/**
 * @packageDocumentation
 * Require object URLs to be retained so they can be revoked.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from "@typescript-eslint/utils";
import { arrayFirst, isDefined, setHas } from "ts-extras";

import {
    collectStaticMemberPath,
    isDiscardedResourceExpression,
} from "../_internal/floating-resource.js";
import { createRuleDocsUrl } from "../_internal/rule-docs-url.js";
import { getVariableInScopeChain } from "../_internal/scope-variable.js";
import {
    createTypedRule,
    type TypedRuleContext,
} from "../_internal/typed-rule.js";

const globalUrlReceiverNames = ["globalThis", "self", "window"] as const;
const globalUrlReceiverNameSet: ReadonlySet<string> = new Set(
    globalUrlReceiverNames
);

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

const isShadowedIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const isDirectUrlPath = (path: readonly string[]): boolean =>
    path.length === 2 &&
    arrayFirst(path) === "URL" &&
    path[1] === "createObjectURL";

const isGlobalUrlPath = (path: readonly string[]): boolean =>
    path.length === 3 &&
        setHas(globalUrlReceiverNameSet, arrayFirst(path) ?? "") &&
    path[1] === "URL" &&
    path[2] === "createObjectURL";

const isObjectUrlCreateCall = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.CallExpression["callee"]>
): boolean => {
    if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.optional) {
        return false;
    }

    const path = collectStaticMemberPath(callee);

    if (!isDefined(path) || (!isDirectUrlPath(path) && !isGlobalUrlPath(path))) {
        return false;
    }

    const rootIdentifier = getRootIdentifier(callee.object);

    return (
        rootIdentifier?.name !== "URL" ||
        !isShadowedIdentifier(context, rootIdentifier)
    );
};

/** Rule implementation for `runtime-cleanup/no-floating-object-urls`. */
const noFloatingObjectUrls: TSESLint.RuleModule<
    "floatingObjectUrl",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            CallExpression(node: Readonly<TSESTree.CallExpression>) {
                if (
                    !isObjectUrlCreateCall(context, node.callee) ||
                    !isDiscardedResourceExpression(node)
                ) {
                    return;
                }

                context.report({
                    messageId: "floatingObjectUrl",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require object URLs to be retained so they can be revoked.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-object-urls"),
        },
        messages: {
            floatingObjectUrl:
                "Store or return the object URL so URL.revokeObjectURL() can release the Blob or File when cleanup runs.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-object-urls",
});

export default noFloatingObjectUrls;
