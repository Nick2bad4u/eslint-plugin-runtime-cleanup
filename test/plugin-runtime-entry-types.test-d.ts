import type { ESLint } from "eslint";

import runtimeCleanupPlugin from "eslint-plugin-runtime-cleanup";
import { assertType } from "vitest";

assertType<ESLint.Plugin>(runtimeCleanupPlugin);

assertType<ESLint.Plugin["configs"] | undefined>(runtimeCleanupPlugin.configs);
assertType<string | undefined>(runtimeCleanupPlugin.meta?.name);
assertType<string | undefined>(runtimeCleanupPlugin.meta?.version);
assertType<ESLint.Plugin["rules"] | undefined>(runtimeCleanupPlugin.rules);
