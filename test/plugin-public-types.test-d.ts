import type {
    RuntimeCleanupConfigName,
    RuntimeCleanupPlugin,
    RuntimeCleanupRuleId,
    RuntimeCleanupRuleName,
} from "eslint-plugin-runtime-cleanup";

import { assertType } from "vitest";

const validConfigName = "recommended-type-checked";

assertType<RuntimeCleanupConfigName>(validConfigName);
// @ts-expect-error Invalid preset key must not satisfy RuntimeCleanupConfigName.
assertType<RuntimeCleanupConfigName>("recommendedTypeChecked");

const validRuleId = "runtime-cleanup/require-timer-cleanup";

assertType<RuntimeCleanupRuleId>(validRuleId);
// @ts-expect-error Rule ids must include the `runtime-cleanup/` namespace prefix.
assertType<RuntimeCleanupRuleId>("require-timer-cleanup");

type RuleNameFromRuleId =
    RuntimeCleanupRuleId extends `runtime-cleanup/${infer RuleName}`
        ? RuleName
        : never;

declare const pluginContract: RuntimeCleanupPlugin;

assertType<RuntimeCleanupRuleName>(
    "require-timer-cleanup" satisfies RuleNameFromRuleId
);
assertType<RuntimeCleanupPlugin>(pluginContract);
