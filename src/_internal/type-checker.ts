/**
 * @packageDocumentation
 * Shared TypeScript checker helpers for low-noise type-aware rules.
 */
import type ts from "typescript";

/**
 * Check whether a type or any type in its base hierarchy has a given symbol
 * name.
 */
export const hasTypeNameInHierarchy = (
    checker: ts.TypeChecker,
    type: ts.Type,
    expectedTypeName: string,
    seenTypes: ReadonlySet<ts.Type> = new Set()
): boolean => {
    if (seenTypes.has(type)) {
        return false;
    }

    const nextSeenTypes = new Set(seenTypes);
    nextSeenTypes.add(type);

    if (type.isUnionOrIntersection()) {
        return type.types.some((entry) =>
            hasTypeNameInHierarchy(
                checker,
                entry,
                expectedTypeName,
                nextSeenTypes
            )
        );
    }

    const apparentType = checker.getApparentType(type);
    const typeName = apparentType.symbol.getName();

    if (typeName === expectedTypeName) {
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
