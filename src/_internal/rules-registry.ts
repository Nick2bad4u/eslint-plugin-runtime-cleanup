/**
 * @packageDocumentation
 * Canonical runtime registry of all rule modules shipped by eslint-plugin-runtime-cleanup.
 */

import type { TSESLint } from "@typescript-eslint/utils";

import noFloatingChildProcesses from "../rules/no-floating-child-processes.js";
import noFloatingObservers from "../rules/no-floating-observers.js";
import noFloatingTimers from "../rules/no-floating-timers.js";
import noFloatingWorkers from "../rules/no-floating-workers.js";
import noUnmanagedEventListeners from "../rules/no-unmanaged-event-listeners.js";

/** Runtime rule module shape used by registry/preset builders. */
export type RuleWithDocs = TSESLint.RuleModule<string, readonly unknown[]>;

/**
 * Runtime map of all rule modules keyed by unqualified rule name.
 *
 */
const runtimeCleanupRuleRegistry: Readonly<
    Record<string, RuleWithDocs>
> = {
    "no-floating-child-processes": noFloatingChildProcesses,
    "no-floating-observers": noFloatingObservers,
    "no-floating-timers": noFloatingTimers,
    "no-floating-workers": noFloatingWorkers,
    "no-unmanaged-event-listeners": noUnmanagedEventListeners,
};

/** Exported typed view consumed by the plugin entrypoint. */
export const runtimeCleanupRules: Readonly<
    Record<string, RuleWithDocs>
> = runtimeCleanupRuleRegistry;

export default runtimeCleanupRules;
