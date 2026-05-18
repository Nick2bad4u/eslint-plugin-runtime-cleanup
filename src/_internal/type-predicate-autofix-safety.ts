/**
 * @packageDocumentation
 * Conservative safety checks for autofixes that introduce type predicates.
 */
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { isDefined } from "ts-extras";

import { getParentNode } from "./ast-node.js";
import { isTransparentExpressionWrapper } from "./value-rewrite-autofix-safety.js";


const isLogicalExpressionOperand = (
    parentNode: Readonly<TSESTree.Node>,
    currentNode: Readonly<TSESTree.Node>
): boolean =>
    parentNode.type === AST_NODE_TYPES.LogicalExpression &&
    (parentNode.left === currentNode || parentNode.right === currentNode);

const isConditionalTest = (
    parentNode: Readonly<TSESTree.Node>,
    currentNode: Readonly<TSESTree.Node>
): boolean =>
    parentNode.type === AST_NODE_TYPES.ConditionalExpression &&
    parentNode.test === currentNode;

const isLoopOrIfTest = (
    parentNode: Readonly<TSESTree.Node>,
    currentNode: Readonly<TSESTree.Node>
): boolean =>
    (parentNode.type === AST_NODE_TYPES.DoWhileStatement ||
        parentNode.type === AST_NODE_TYPES.ForStatement ||
        parentNode.type === AST_NODE_TYPES.IfStatement ||
        parentNode.type === AST_NODE_TYPES.WhileStatement) &&
    parentNode.test === currentNode;

const isSwitchCaseTest = (
    parentNode: Readonly<TSESTree.Node>,
    currentNode: Readonly<TSESTree.Node>
): boolean =>
    parentNode.type === AST_NODE_TYPES.SwitchCase &&
    parentNode.test === currentNode;

const isUnaryNotArgument = (
    parentNode: Readonly<TSESTree.Node>,
    currentNode: Readonly<TSESTree.Node>
): boolean =>
    parentNode.type === AST_NODE_TYPES.UnaryExpression &&
    parentNode.operator === "!" &&
    parentNode.argument === currentNode;

const isBooleanGuardContext = (
    parentNode: Readonly<TSESTree.Node>,
    currentNode: Readonly<TSESTree.Node>
): boolean =>
    isUnaryNotArgument(parentNode, currentNode) ||
    isLogicalExpressionOperand(parentNode, currentNode) ||
    isConditionalTest(parentNode, currentNode) ||
    isLoopOrIfTest(parentNode, currentNode) ||
    isSwitchCaseTest(parentNode, currentNode);

/**
 * Determine whether a call-expression replacement to a type-predicate helper is
 * safe to apply as an autofix.
 *
 * @remarks
 * Type-predicate helpers (for example `setHas`) can change control-flow
 * narrowing in boolean guard expressions. This check intentionally disables
 * autofix in those contexts and leaves a diagnostic for manual review.
 */
export const isTypePredicateExpressionAutofixSafe = (
    node: Readonly<TSESTree.Expression>
): boolean => {
    let currentNode: Readonly<TSESTree.Node> = node;

    let parentNode = getParentNode(currentNode);

    while (
        isDefined(parentNode) &&
        isTransparentExpressionWrapper(parentNode, currentNode)
    ) {
        currentNode = parentNode;
        parentNode = getParentNode(currentNode);
    }

    return isDefined(parentNode)
        ? !isBooleanGuardContext(parentNode, currentNode)
        : true;
};

/**
 * Backward-compatible alias for call-expression-based callers.
 */
export const isTypePredicateAutofixSafe = (
    node: Readonly<TSESTree.CallExpression>
): boolean => isTypePredicateExpressionAutofixSafe(node);
