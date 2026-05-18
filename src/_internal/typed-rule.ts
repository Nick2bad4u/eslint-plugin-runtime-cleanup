import type { UnknownArray } from "type-fest";
/**
 * @packageDocumentation
 * Internal shared utilities used by eslint-plugin-runtime-cleanup rule modules
 * and plugin wiring.
 */
import type ts from "typescript";

import { ESLintUtils, type TSESLint } from "@typescript-eslint/utils";
import { isDefined } from "ts-extras";

import type { RuntimeCleanupConfigReference } from "./runtime-cleanup-config-references.js";

import { registerProgramSettingsForContext } from "./plugin-settings.js";
import { getRuleCatalogEntryForRuleNameOrNull } from "./rule-catalog.js";
import { createRuleDocsUrl } from "./rule-docs-url.js";
import { safeTypeOperation } from "./safe-type-operation.js";

/**
 * Parser services and type checker bundle used by typed rules.
 */
export interface TypedRuleServices {
    checker: ts.TypeChecker;
    parserServices: ReturnType<typeof ESLintUtils.getParserServices>;
}

type RuntimeCleanupRuleCreator = ReturnType<
    typeof ESLintUtils.RuleCreator<RuntimeCleanupRuleDocs>
>;

/**
 * Plugin-specific metadata extensions for `meta.docs`.
 *
 * @remarks
 * `eslint-plugin/require-meta-docs-recommended` expects
 * `meta.docs.recommended` to be boolean. Preset membership is tracked
 * separately via `meta.docs.runtimeCleanupConfigs`.
 */
interface RuntimeCleanupRuleDocs {
    recommended?: boolean;
    requiresTypeChecking?: boolean;
    ruleId?: string;
    ruleNumber?: number;
    runtimeCleanupConfigs?:
        | readonly RuntimeCleanupConfigReference[]
        | RuntimeCleanupConfigReference;
}

/** Shared typed-rule context contract used by helper utilities. */
type TypedRuleContext = Readonly<
    TSESLint.RuleContext<string, Readonly<UnknownArray>>
>;

export type { TypedRuleContext };

/**
 * Rule-creator wrapper used by plugin rules.
 *
 * @remarks
 * This wrapper automatically registers per-program plugin settings and injects
 * canonical `meta.docs.ruleId` / `meta.docs.ruleNumber` values for cataloged
 * public rules.
 *
 * @param ruleDefinition - Rule module definition passed to
 *   `ESLintUtils.RuleCreator`.
 *
 * @returns Rule module factory output that auto-registers program settings and
 *   preserves the authored rule contract.
 */
export const createTypedRule: RuntimeCleanupRuleCreator = (ruleDefinition) => {
    const catalogEntry = getRuleCatalogEntryForRuleNameOrNull(
        ruleDefinition.name
    );
    const createdRule = ESLintUtils.RuleCreator.withoutDocs(ruleDefinition);
    const ruleDocs = createdRule.meta.docs;
    if (!isDefined(ruleDocs)) {
        throw new TypeError(
            `Rule '${ruleDefinition.name}' must declare meta.docs.`
        );
    }

    const canonicalDocsUrl = createRuleDocsUrl(ruleDefinition.name);

    if (typeof ruleDocs.url === "string" && ruleDocs.url !== canonicalDocsUrl) {
        throw new TypeError(
            `Rule '${ruleDefinition.name}' has non-canonical docs.url '${ruleDocs.url}'. Expected '${canonicalDocsUrl}'.`
        );
    }

    if (catalogEntry === null && ruleDefinition.name.startsWith("require-")) {
        throw new TypeError(
            `Rule '${ruleDefinition.name}' is missing from the stable rule catalog.`
        );
    }

    const docsWithCatalog: RuntimeCleanupRuleDocs &
        TSESLint.RuleMetaDataDocs =
        catalogEntry === null
            ? {
                  ...ruleDocs,
                  url: canonicalDocsUrl,
              }
            : {
                  ...ruleDocs,
                  ruleId: catalogEntry.ruleId,
                  ruleNumber: catalogEntry.ruleNumber,
                  url: canonicalDocsUrl,
              };
    const metaDefaultOptions = createdRule.meta.defaultOptions;

    return {
        ...createdRule,
        create(context) {
            registerProgramSettingsForContext(context);

            return createdRule.create(context);
        },
        meta: {
            ...createdRule.meta,
            ...(isDefined(metaDefaultOptions)
                ? { defaultOptions: metaDefaultOptions }
                : {}),
            docs: docsWithCatalog,
        },
        name: ruleDefinition.name,
    };
};

/**
 * Retrieve parser services and type checker for typed rules.
 *
 * @param context - Rule context from the current lint evaluation.
 *
 * @returns Parser services and type checker references bound to the current
 *   program.
 *
 * @throws Throws when `parserServices.program` is unavailable, which indicates
 *   the current lint run is not configured for type-aware analysis.
 */
export const getTypedRuleServices = (
    context: TypedRuleContext
): TypedRuleServices => {
    const parserServices = ESLintUtils.getParserServices(context, true);
    const program = parserServices.program;

    if (program === null) {
        throw new Error(
            "Typed rule requires parserServices.program; ensure projectService is enabled for this lint run."
        );
    }

    return {
        checker: program.getTypeChecker(),
        parserServices,
    };
};

/**
 * Determine whether the current lint context has full type information.
 *
 * @param context - Rule context from the current lint evaluation.
 *
 * @returns `true` when parser services and `program` are available.
 */
export const hasTypeServices = (context: TypedRuleContext): boolean => {
    const parserServicesResult = safeTypeOperation({
        operation: () => ESLintUtils.getParserServices(context, true),
        reason: "typed-rule-services-check-failed",
    });

    return (
        parserServicesResult.ok && parserServicesResult.value.program !== null
    );
};

/**
 * Retrieve typed services when available, otherwise return `undefined`.
 *
 * @param context - Rule context from the current lint evaluation.
 *
 * @returns Typed services when parser services include a TypeScript program.
 */
export const getTypedRuleServicesOrUndefined = (
    context: TypedRuleContext
): TypedRuleServices | undefined =>
    hasTypeServices(context) ? getTypedRuleServices(context) : undefined;

/**
 * Resolve the type of a signature parameter by index.
 *
 * @param options - Signature parameter lookup options.
 *
 * @returns Parameter type when available; otherwise `undefined`.
 */
export const getSignatureParameterTypeAt = (
    options: Readonly<{
        checker: ts.TypeChecker;
        index: number;
        location: ts.Node;
        signature: null | ts.Signature | undefined;
    }>
): ts.Type | undefined => {
    const { checker, index, location, signature } = options;

    const symbol = signature?.parameters[index];
    if (!isDefined(symbol)) {
        return undefined;
    }

    return checker.getTypeOfSymbolAtLocation(symbol, location);
};
