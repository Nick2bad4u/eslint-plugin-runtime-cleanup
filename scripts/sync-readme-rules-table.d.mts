export type ReadmeRuleModule = Readonly<{
    meta?:
        | {
              docs?:
                  | {
                        readonly runtimeCleanupConfigs?:
                            | readonly string[]
                            | string;
                        readonly url?: string | undefined;
                    }
                  | undefined;
              readonly fixable?: string | undefined;
              readonly hasSuggestions?: boolean | undefined;
          }
        | undefined;
}>;

export type ReadmeRulesMap = Readonly<Record<string, ReadmeRuleModule>>;

export function extractReadmeRulesSection(markdown: string): string;

export function generateReadmeRulesSectionFromRules(
    rules: ReadmeRulesMap
): string;

export function normalizeRulesSectionMarkdown(markdown: string): string;

export function syncReadmeRulesTable(input: {
    writeChanges: boolean;
}): Promise<Readonly<{ changed: boolean }>>;
