export type PresetRulesMatrixRuleModule = Readonly<{
    meta?: {
        docs?: {
            readonly runtimeCleanupConfigs?: readonly string[] | string;
            readonly url?: string | undefined;
        } | undefined;
        readonly fixable?: string | undefined;
        readonly hasSuggestions?: boolean | undefined;
    } | undefined;
}>;

export type PresetRulesMatrixRulesMap = Readonly<
    Record<string, PresetRulesMatrixRuleModule>
>;

export function generatePresetsRulesMatrixSectionFromRules(
    rules: PresetRulesMatrixRulesMap
): string;
