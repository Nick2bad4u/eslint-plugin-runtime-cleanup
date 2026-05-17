/**
 * @packageDocumentation
 * Stable catalog IDs for all plugin rules.
 */

/**
 * Catalog metadata for a single rule.
 */
export type RuntimeCleanupRuleCatalogEntry = Readonly<{
    ruleId: RuntimeCleanupRuleCatalogId;
    ruleName: string;
    ruleNumber: number;
}>;

/**
 * Stable machine-friendly rule id format (for example: `R001`).
 */
export type RuntimeCleanupRuleCatalogId = `R${string}`;

/**
 * Stable global ordering used for rule catalog IDs.
 *
 * @remarks
 * Append new rules to preserve existing IDs once the first runtime-cleanup
 * rules are added.
 */
/* eslint-disable perfectionist/sort-arrays -- Catalog order is append-only so existing rule IDs remain stable. */
const orderedRuleNames = [
    "no-floating-timers",
    "no-unmanaged-event-listeners",
    "no-floating-observers",
    "no-floating-workers",
    "no-floating-child-processes",
] as const satisfies readonly string[];
/* eslint-enable perfectionist/sort-arrays -- Re-enable sorting outside the stable rule catalog. */

const toRuleCatalogId = (
    ruleNumber: number
): RuntimeCleanupRuleCatalogId =>
    `R${String(ruleNumber).padStart(3, "0")}`;

/**
 * Canonical catalog metadata entries in stable display/order form.
 */
export const runtimeCleanupRuleCatalogEntries: readonly RuntimeCleanupRuleCatalogEntry[] =
    orderedRuleNames.map((ruleName, index) => {
        const ruleNumber = index + 1;

        return {
            ruleId: toRuleCatalogId(ruleNumber),
            ruleName,
            ruleNumber,
        };
    });

/**
 * Fast lookup map for rule catalog metadata by rule name.
 */
export const runtimeCleanupRuleCatalogByRuleName: Readonly<
    Partial<Record<string, RuntimeCleanupRuleCatalogEntry>>
> = Object.fromEntries(
    runtimeCleanupRuleCatalogEntries.map((entry) => [entry.ruleName, entry])
);

/**
 * Resolve stable catalog metadata for a rule name when available.
 */
export const getRuleCatalogEntryForRuleNameOrNull = (
    ruleName: string
): null | RuntimeCleanupRuleCatalogEntry =>
    runtimeCleanupRuleCatalogByRuleName[ruleName] ?? null;

/**
 * Resolve stable catalog metadata for a rule name.
 *
 * @throws When the rule is missing from the catalog.
 */
export const getRuleCatalogEntryForRuleName = (
    ruleName: string
): RuntimeCleanupRuleCatalogEntry => {
    const catalogEntry = getRuleCatalogEntryForRuleNameOrNull(ruleName);

    if (catalogEntry === null) {
        throw new TypeError(
            `Rule '${ruleName}' is missing from the stable rule catalog.`
        );
    }

    return catalogEntry;
};

/**
 * Resolve stable catalog metadata by rule id.
 */
export const runtimeCleanupRuleCatalogByRuleId: ReadonlyMap<
    RuntimeCleanupRuleCatalogId,
    RuntimeCleanupRuleCatalogEntry
> = new Map(
    runtimeCleanupRuleCatalogEntries.map((entry) => [entry.ruleId, entry])
);

/**
 * Resolve stable catalog metadata for a catalog id.
 */
export const getRuleCatalogEntryForRuleId = (
    ruleId: RuntimeCleanupRuleCatalogId
): RuntimeCleanupRuleCatalogEntry | undefined =>
    runtimeCleanupRuleCatalogByRuleId.get(ruleId);

/**
 * Validate that catalog IDs are unique and sequential.
 */
export const validateRuleCatalogIntegrity = (): boolean => {
    const entries = runtimeCleanupRuleCatalogEntries;
    const seenRuleIds = new Set<RuntimeCleanupRuleCatalogId>();

    for (const [index, entry] of entries.entries()) {
        if (seenRuleIds.has(entry.ruleId)) {
            return false;
        }

        seenRuleIds.add(entry.ruleId);

        const expectedRuleNumber = index + 1;
        if (entry.ruleNumber !== expectedRuleNumber) {
            return false;
        }

        if (entry.ruleId !== toRuleCatalogId(expectedRuleNumber)) {
            return false;
        }
    }

    return true;
};
