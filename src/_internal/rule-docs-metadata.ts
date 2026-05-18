/**
 * @packageDocumentation
 * Derivation helpers for canonical rule docs metadata.
 */
import type { TSESLint } from "@typescript-eslint/utils";
import type { UnknownArray, UnknownRecord  } from "type-fest";

import {
    arrayIncludes,
    isDefined,
    isEmpty,
    isInteger,
    objectEntries,
} from "ts-extras";

import { createRuleDocsUrl } from "./rule-docs-url.js";
import {
    isRuntimeCleanupConfigReference,
    type RuntimeCleanupConfigName,
    type RuntimeCleanupConfigReference,
    runtimeCleanupConfigReferenceToName,
} from "./runtime-cleanup-config-references.js";

/** Normalized docs metadata derived for each rule. */
export type RuleDocsMetadata = Readonly<{
    description: string;
    recommended: boolean;
    requiresTypeChecking: boolean;
    ruleId: string;
    ruleNumber: number;
    runtimeCleanupConfigNames: readonly RuntimeCleanupConfigName[];
    runtimeCleanupConfigReferences: readonly RuntimeCleanupConfigReference[];
    url: string;
}>;

/** Rule-name keyed metadata map derived from static docs contracts. */
export type RuleDocsMetadataByName = Readonly<
    Record<string, RuleDocsMetadata>
>;

/** Rule-map contract accepted by docs metadata derivation helpers. */
type RuleMap = Readonly<
    Record<string, TSESLint.RuleModule<string, Readonly<UnknownArray>>>
>;

/**
 * Canonical docs contract required on every plugin rule.
 */
type RuntimeCleanupRuleDocsContract = Readonly<{
    description: string;
    recommended: boolean;
    requiresTypeChecking: boolean;
    ruleId: string;
    ruleNumber: number;
    runtimeCleanupConfigs:
        | readonly RuntimeCleanupConfigReference[]
        | RuntimeCleanupConfigReference;
    url: string;
}>;

const RULE_ID_PREFIX = "R" as const;
const RULE_ID_LENGTH = 4 as const;
const RULE_ID_DIGIT_START_INDEX = 1 as const;
const ASCII_ZERO_CODE_POINT = 48 as const;
const ASCII_NINE_CODE_POINT = 57 as const;

/**
 * Guard dynamic rule ids to the canonical `R###` identifier contract.
 */
const isRuleIdInCanonicalFormat = (value: string): boolean => {
    if (value.length !== RULE_ID_LENGTH || !value.startsWith(RULE_ID_PREFIX)) {
        return false;
    }

    for (const character of value.slice(RULE_ID_DIGIT_START_INDEX)) {
        const codePoint = character.codePointAt(0);

        if (!isDefined(codePoint)) {
            return false;
        }

        if (
            codePoint < ASCII_ZERO_CODE_POINT ||
            codePoint > ASCII_NINE_CODE_POINT
        ) {
            return false;
        }
    }

    return true;
};

/**
 * Guard dynamic values to object-shaped records.
 */
const isUnknownRecord = (
    value: unknown
): value is Readonly<UnknownRecord> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Convert rule docs `runtimeCleanupConfigs` into a normalized, deduped
 * reference list.
 */
const normalizeRuntimeCleanupConfigReferences = (
    ruleName: string,
    runtimeCleanupConfigs: RuntimeCleanupRuleDocsContract["runtimeCleanupConfigs"]
): readonly RuntimeCleanupConfigReference[] => {
    const candidates =
        typeof runtimeCleanupConfigs === "string"
            ? [runtimeCleanupConfigs]
            : [...runtimeCleanupConfigs];

    const references: RuntimeCleanupConfigReference[] = [];

    for (const candidate of candidates) {
        if (!isRuntimeCleanupConfigReference(candidate)) {
            throw new TypeError(
                `Rule '${ruleName}' has invalid docs.runtimeCleanupConfigs reference '${String(candidate)}'.`
            );
        }

        if (!arrayIncludes(references, candidate)) {
            references.push(candidate);
        }
    }

    if (isEmpty(references)) {
        throw new TypeError(
            `Rule '${ruleName}' must declare at least one docs.runtimeCleanupConfigs reference.`
        );
    }

    return references;
};

const getRequiredNonEmptyString = (
    ruleName: string,
    value: unknown,
    propertyName: string
): string => {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }

    throw new TypeError(
        `Rule '${ruleName}' must declare a non-empty docs.${propertyName}.`
    );
};

const getRequiredBoolean = (
    ruleName: string,
    value: unknown,
    propertyName: string
): boolean => {
    if (typeof value === "boolean") {
        return value;
    }

    throw new TypeError(
        `Rule '${ruleName}' must declare boolean docs.${propertyName}.`
    );
};

/**
 * Validate and narrow dynamic `meta.docs` values to the plugin docs contract.
 */
const getRuleDocsContract = (
    ruleName: string,
    docs: unknown
): RuntimeCleanupRuleDocsContract => {
    if (!isUnknownRecord(docs)) {
        throw new TypeError(`Rule '${ruleName}' must declare meta.docs.`);
    }

    const description = docs["description"];
    const recommended = docs["recommended"];
    const requiresTypeChecking = docs["requiresTypeChecking"];
    const ruleId = docs["ruleId"];
    const ruleNumber = docs["ruleNumber"];
    const runtimeCleanupConfigs = docs["runtimeCleanupConfigs"];
    const url = docs["url"];

    const checkedDescription = getRequiredNonEmptyString(
        ruleName,
        description,
        "description"
    );
    const checkedUrl = getRequiredNonEmptyString(ruleName, url, "url");

    const expectedRuleDocsUrl = createRuleDocsUrl(ruleName);
    if (checkedUrl !== expectedRuleDocsUrl) {
        throw new TypeError(
            `Rule '${ruleName}' must declare docs.url as '${expectedRuleDocsUrl}'.`
        );
    }

    const checkedRecommended = getRequiredBoolean(
        ruleName,
        recommended,
        "recommended"
    );
    const checkedRequiresTypeChecking = getRequiredBoolean(
        ruleName,
        requiresTypeChecking,
        "requiresTypeChecking"
    );

    if (
        typeof ruleId !== "string" ||
        !isRuleIdInCanonicalFormat(ruleId) ||
        ruleId.trim().length === 0
    ) {
        throw new TypeError(
            `Rule '${ruleName}' must declare docs.ruleId using the 'R###' format.`
        );
    }

    if (
        typeof ruleNumber !== "number" ||
        !isInteger(ruleNumber) ||
        ruleNumber < 1
    ) {
        throw new TypeError(
            `Rule '${ruleName}' must declare positive integer docs.ruleNumber.`
        );
    }

    if (typeof runtimeCleanupConfigs === "string") {
        if (!isRuntimeCleanupConfigReference(runtimeCleanupConfigs)) {
            throw new TypeError(
                `Rule '${ruleName}' has invalid docs.runtimeCleanupConfigs reference '${runtimeCleanupConfigs}'.`
            );
        }

        return {
            description: checkedDescription,
            recommended: checkedRecommended,
            requiresTypeChecking: checkedRequiresTypeChecking,
            ruleId,
            ruleNumber,
            runtimeCleanupConfigs,
            url: checkedUrl,
        };
    }

    if (!Array.isArray(runtimeCleanupConfigs)) {
        throw new TypeError(
            `Rule '${ruleName}' must declare docs.runtimeCleanupConfigs as a preset reference or array.`
        );
    }

    for (const candidate of runtimeCleanupConfigs) {
        if (
            typeof candidate !== "string" ||
            !isRuntimeCleanupConfigReference(candidate)
        ) {
            throw new TypeError(
                `Rule '${ruleName}' has invalid docs.runtimeCleanupConfigs reference '${String(candidate)}'.`
            );
        }
    }

    return {
        description: checkedDescription,
        recommended: checkedRecommended,
        requiresTypeChecking: checkedRequiresTypeChecking,
        ruleId,
        ruleNumber,
        runtimeCleanupConfigs,
        url: checkedUrl,
    };
};

/**
 * Derive normalized docs metadata for all plugin rules.
 */
export const deriveRuleDocsMetadataByName = (
    rules: RuleMap
): RuleDocsMetadataByName => {
    const metadataByRuleName: Record<
        string,
        RuleDocsMetadata
    > = {};

    for (const [ruleName, ruleModule] of objectEntries(rules)) {
        const ruleDocs = getRuleDocsContract(ruleName, ruleModule.meta.docs);
        const runtimeCleanupConfigReferences =
            normalizeRuntimeCleanupConfigReferences(
                ruleName,
                ruleDocs.runtimeCleanupConfigs
            );
        const runtimeCleanupConfigNames = runtimeCleanupConfigReferences.map(
            (reference) => runtimeCleanupConfigReferenceToName[reference]
        );

        metadataByRuleName[ruleName] = {
            description: ruleDocs.description,
            recommended: ruleDocs.recommended,
            requiresTypeChecking: ruleDocs.requiresTypeChecking,
            ruleId: ruleDocs.ruleId,
            ruleNumber: ruleDocs.ruleNumber,
            runtimeCleanupConfigNames,
            runtimeCleanupConfigReferences,
            url: ruleDocs.url,
        };
    }

    return metadataByRuleName;
};

/**
 * Derive a typed-rule set from normalized docs metadata.
 */
export const deriveTypeCheckedRuleNameSet = (
    ruleDocsMetadataByName: RuleDocsMetadataByName
): ReadonlySet<string> => {
    const ruleNames: string[] = [];

    for (const [ruleName, metadata] of objectEntries(
        ruleDocsMetadataByName
    )) {
        if (metadata.requiresTypeChecking) {
            ruleNames.push(ruleName);
        }
    }

    return new Set(ruleNames);
};

/**
 * Derive canonical preset-membership map from normalized docs metadata.
 */
export const deriveRulePresetMembershipByRuleName = (
    ruleDocsMetadataByName: RuleDocsMetadataByName
): Readonly<
    Record<string, readonly RuntimeCleanupConfigName[]>
> => {
    const membershipByRuleName: Record<
        string,
        readonly RuntimeCleanupConfigName[]
    > = {};

    for (const [ruleName, metadata] of objectEntries(
        ruleDocsMetadataByName
    )) {
        membershipByRuleName[ruleName] = metadata.runtimeCleanupConfigNames;
    }

    return membershipByRuleName;
};
