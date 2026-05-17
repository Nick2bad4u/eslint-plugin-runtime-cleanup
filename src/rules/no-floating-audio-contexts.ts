/**
 * @packageDocumentation
 * Require AudioContext instances to be retained so they can be closed.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from "@typescript-eslint/utils";

import {
    collectStaticMemberPath,
    isDiscardedResourceExpression,
    isImmediateUnownedMemberReceiver,
} from "../_internal/floating-resource.js";
import { createRuleDocsUrl } from "../_internal/rule-docs-url.js";
import { getVariableInScopeChain } from "../_internal/scope-variable.js";
import {
    createTypedRule,
    type TypedRuleContext,
} from "../_internal/typed-rule.js";

const audioContextConstructorNames = [
    "AudioContext",
    "webkitAudioContext",
] as const;
const cleanupMemberNames: ReadonlySet<string> = new Set(["close"]);
const globalReceiverNames = ["globalThis", "self", "window"] as const;

type AudioContextConstructorName =
    (typeof audioContextConstructorNames)[number];

const audioContextConstructorNameSet: ReadonlySet<string> = new Set(
    audioContextConstructorNames
);
const globalReceiverNameSet: ReadonlySet<string> = new Set(
    globalReceiverNames
);

const isAudioContextConstructorName = (
    name: string
): name is AudioContextConstructorName =>
    audioContextConstructorNameSet.has(name);

const isShadowedIdentifier = (
    context: TypedRuleContext,
    identifier: Readonly<TSESTree.Identifier>
): boolean => {
    const scope = context.sourceCode.getScope(identifier);
    const variable = getVariableInScopeChain(scope, identifier.name);

    return variable !== null && variable.defs.length > 0;
};

const getDirectAudioContextConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): AudioContextConstructorName | undefined => {
    if (
        callee.type !== AST_NODE_TYPES.Identifier ||
        !isAudioContextConstructorName(callee.name) ||
        isShadowedIdentifier(context, callee)
    ) {
        return undefined;
    }

    return callee.name;
};

const getMemberAudioContextConstructorName = (
    callee: Readonly<TSESTree.NewExpression["callee"]>
): AudioContextConstructorName | undefined => {
    if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.optional) {
        return undefined;
    }

    const path = collectStaticMemberPath(callee);

    if (path?.length !== 2) {
        return undefined;
    }

    const receiverName = path[0];

    if (
        receiverName === undefined ||
        !globalReceiverNameSet.has(receiverName)
    ) {
        return undefined;
    }

    const constructorName = path[1];

    return constructorName !== undefined &&
        isAudioContextConstructorName(constructorName)
        ? constructorName
        : undefined;
};

const getAudioContextConstructorName = (
    context: TypedRuleContext,
    callee: Readonly<TSESTree.NewExpression["callee"]>
): AudioContextConstructorName | undefined =>
    getDirectAudioContextConstructorName(context, callee) ??
    getMemberAudioContextConstructorName(callee);

/** Rule implementation for `runtime-cleanup/no-floating-audio-contexts`. */
const noFloatingAudioContexts: TSESLint.RuleModule<
    "floatingAudioContext",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            NewExpression(node: Readonly<TSESTree.NewExpression>) {
                const constructorName = getAudioContextConstructorName(
                    context,
                    node.callee
                );

                if (
                    constructorName === undefined ||
                    (!isDiscardedResourceExpression(node) &&
                        !isImmediateUnownedMemberReceiver(
                            node,
                            cleanupMemberNames
                        ))
                ) {
                    return;
                }

                context.report({
                    data: { constructorName },
                    messageId: "floatingAudioContext",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require AudioContext instances to be retained so they can be closed.",
            recommended: true,
            requiresTypeChecking: false,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended",
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-audio-contexts"),
        },
        messages: {
            floatingAudioContext:
                "Store or return the {{constructorName}} instance so close() can release audio resources during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-audio-contexts",
});

export default noFloatingAudioContexts;
