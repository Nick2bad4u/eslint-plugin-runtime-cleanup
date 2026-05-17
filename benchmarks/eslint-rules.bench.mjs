/**
 * Placeholder benchmarks for the initial runtime-cleanup scaffold.
 */
/* eslint-disable vitest/prefer-expect-assertions -- Vitest benchmark callbacks do not use assertions. */
import { bench, describe } from "vitest";

describe("eslint-plugin-runtime-cleanup benchmarks", () => {
    bench("empty scaffold", () => {
        Object.keys({});
    });
});

/* eslint-enable vitest/prefer-expect-assertions -- Re-enable for any future additions below. */
