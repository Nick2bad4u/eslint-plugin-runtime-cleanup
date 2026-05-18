import type { ArrayValues } from "type-fest";

/**
 * @packageDocumentation
 * Require Web Stream readers and writers to be retained so their locks can be released.
 */
import {
    AST_NODE_TYPES,
    type TSESLint,
    type TSESTree,
} from "@typescript-eslint/utils";
import { isDefined, setHas } from "ts-extras";

import {
    getStaticPropertyName,
    isDiscardedResourceExpression,
    isImmediateUnownedMemberReceiver,
} from "../_internal/floating-resource.js";
import { createRuleDocsUrl } from "../_internal/rule-docs-url.js";
import { hasTypeNameInHierarchy } from "../_internal/type-checker.js";
import {
    createTypedRule,
    getTypedRuleServices,
    type TypedRuleContext,
} from "../_internal/typed-rule.js";

const lockFactoryNames = ["getReader", "getWriter"] as const;
const cleanupMemberNames: ReadonlySet<string> = new Set(["releaseLock"]);

type LockFactoryMetadata = Readonly<{
    lockKind: "reader" | "writer";
    streamTypeName: "ReadableStream" | "WritableStream";
}>;

type LockFactoryName = ArrayValues<typeof lockFactoryNames>;

const lockFactoryMetadataByName: Readonly<
    Record<LockFactoryName, LockFactoryMetadata>
> = {
    getReader: {
        lockKind: "reader",
        streamTypeName: "ReadableStream",
    },
    getWriter: {
        lockKind: "writer",
        streamTypeName: "WritableStream",
    },
};
const lockFactoryNameSet: ReadonlySet<string> = new Set(lockFactoryNames);

const isLockFactoryName = (name: string): name is LockFactoryName =>
    setHas(lockFactoryNameSet, name);

const getLockFactoryMetadata = (
    callee: Readonly<TSESTree.CallExpression["callee"]>
):
    | (LockFactoryMetadata &
          Readonly<{ receiver: TSESTree.MemberExpression["object"] }>)
    | undefined => {
    if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.optional) {
        return undefined;
    }

    if (callee.object.type === AST_NODE_TYPES.Super) {
        return undefined;
    }

    const factoryName = getStaticPropertyName(callee.property, callee.computed);

    if (!isDefined(factoryName) || !isLockFactoryName(factoryName)) {
        return undefined;
    }

    return {
        ...lockFactoryMetadataByName[factoryName],
        receiver: callee.object,
    };
};

const isReceiverExpectedWebStream = (
    context: TypedRuleContext,
    receiver: Readonly<TSESTree.Expression>,
    streamTypeName: LockFactoryMetadata["streamTypeName"]
): boolean => {
    const { checker, parserServices } = getTypedRuleServices(context);
    const receiverType = checker.getTypeAtLocation(
        parserServices.esTreeNodeToTSNodeMap.get(receiver)
    );

    return hasTypeNameInHierarchy(checker, receiverType, streamTypeName);
};

/** Rule implementation for `runtime-cleanup/no-floating-web-stream-locks`. */
const noFloatingWebStreamLocks: TSESLint.RuleModule<
    "floatingWebStreamLock",
    readonly []
> = createTypedRule({
    create(context) {
        return {
            CallExpression(node: Readonly<TSESTree.CallExpression>) {
                const metadata = getLockFactoryMetadata(node.callee);

                if (
                    !isDefined(metadata) ||
                    !isReceiverExpectedWebStream(
                        context,
                        metadata.receiver,
                        metadata.streamTypeName
                    ) ||
                    (!isDiscardedResourceExpression(node) &&
                        !isImmediateUnownedMemberReceiver(
                            node,
                            cleanupMemberNames
                        ))
                ) {
                    return;
                }

                context.report({
                    data: { lockKind: metadata.lockKind },
                    messageId: "floatingWebStreamLock",
                    node,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                "require Web Stream readers and writers to be retained so their locks can be released.",
            recommended: true,
            requiresTypeChecking: true,
            runtimeCleanupConfigs: [
                "runtime-cleanup.configs.recommended-type-checked",
                "runtime-cleanup.configs.strict",
                "runtime-cleanup.configs.all",
            ],
            url: createRuleDocsUrl("no-floating-web-stream-locks"),
        },
        messages: {
            floatingWebStreamLock:
                "Store or return the Web Stream {{lockKind}} so releaseLock() can release the stream lock during cleanup.",
        },
        schema: [],
        type: "problem",
    },
    name: "no-floating-web-stream-locks",
});

export default noFloatingWebStreamLocks;
