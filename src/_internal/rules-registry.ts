/**
 * @packageDocumentation
 * Canonical runtime registry of all rule modules shipped by eslint-plugin-runtime-cleanup.
 */

import type { TSESLint } from "@typescript-eslint/utils";

import noFloatingAbortControllers from "../rules/no-floating-abort-controllers.js";
import noFloatingBroadcastChannels from "../rules/no-floating-broadcast-channels.js";
import noFloatingChildProcesses from "../rules/no-floating-child-processes.js";
import noFloatingDisposableStacks from "../rules/no-floating-disposable-stacks.js";
import noFloatingFileWatchers from "../rules/no-floating-file-watchers.js";
import noFloatingGeolocationWatches from "../rules/no-floating-geolocation-watches.js";
import noFloatingMediaStreams from "../rules/no-floating-media-streams.js";
import noFloatingMessageChannels from "../rules/no-floating-message-channels.js";
import noFloatingNetworkConnections from "../rules/no-floating-network-connections.js";
import noFloatingObservers from "../rules/no-floating-observers.js";
import noFloatingServers from "../rules/no-floating-servers.js";
import noFloatingStreams from "../rules/no-floating-streams.js";
import noFloatingTimers from "../rules/no-floating-timers.js";
import noFloatingWakeLocks from "../rules/no-floating-wake-locks.js";
import noFloatingWorkers from "../rules/no-floating-workers.js";
import noUnmanagedEventListeners from "../rules/no-unmanaged-event-listeners.js";

/** Runtime rule module shape used by registry/preset builders. */
export type RuleWithDocs = TSESLint.RuleModule<string, readonly unknown[]>;

/**
 * Runtime map of all rule modules keyed by unqualified rule name.
 */
const runtimeCleanupRuleRegistry: Readonly<Record<string, RuleWithDocs>> = {
    "no-floating-abort-controllers": noFloatingAbortControllers,
    "no-floating-broadcast-channels": noFloatingBroadcastChannels,
    "no-floating-child-processes": noFloatingChildProcesses,
    "no-floating-disposable-stacks": noFloatingDisposableStacks,
    "no-floating-file-watchers": noFloatingFileWatchers,
    "no-floating-geolocation-watches": noFloatingGeolocationWatches,
    "no-floating-media-streams": noFloatingMediaStreams,
    "no-floating-message-channels": noFloatingMessageChannels,
    "no-floating-network-connections": noFloatingNetworkConnections,
    "no-floating-observers": noFloatingObservers,
    "no-floating-servers": noFloatingServers,
    "no-floating-streams": noFloatingStreams,
    "no-floating-timers": noFloatingTimers,
    "no-floating-wake-locks": noFloatingWakeLocks,
    "no-floating-workers": noFloatingWorkers,
    "no-unmanaged-event-listeners": noUnmanagedEventListeners,
};

/** Exported typed view consumed by the plugin entrypoint. */
export const runtimeCleanupRules: Readonly<Record<string, RuleWithDocs>> =
    runtimeCleanupRuleRegistry;

export default runtimeCleanupRules;
