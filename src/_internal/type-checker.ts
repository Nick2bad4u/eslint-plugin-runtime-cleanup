/**
 * @packageDocumentation
 * Shared TypeScript checker helpers for low-noise type-aware rules.
 */
import type { Type, TypeChecker } from "typescript";

import { setHas } from "ts-extras";

/**
 * Check whether a type or any type in its base hierarchy has a given symbol
 * name.
 */
export const hasTypeNameInHierarchy = (
    checker: TypeChecker,
    candidate: Type,
    expectedTypeName: string,
    seenTypes: ReadonlySet<Type> = new Set()
): boolean => {
    const seenCandidate: unknown = candidate;
    if (setHas(seenTypes, seenCandidate)) {
        return false;
    }

    const nextSeenTypes = new Set(seenTypes);
    nextSeenTypes.add(candidate);

    if (candidate.isUnionOrIntersection()) {
        return candidate.types.some((entry: Type) =>
            hasTypeNameInHierarchy(
                checker,
                entry,
                expectedTypeName,
                nextSeenTypes
            )
        );
    }

    const apparentType = checker.getApparentType(candidate);
    const candidateName = apparentType.symbol.getName();

    if (candidateName === expectedTypeName) {
        return true;
    }

    if (!apparentType.isClassOrInterface()) {
        return false;
    }

    const baseTypes = checker.getBaseTypes(apparentType);

    return baseTypes.some((baseType) =>
        hasTypeNameInHierarchy(
            checker,
            baseType,
            expectedTypeName,
            nextSeenTypes
        )
    );
};
