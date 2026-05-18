import { describe, expect, it } from "vitest";

import {
    getBoundedCacheValue,
    setBoundedCacheValue,
} from "../../src/_internal/bounded-cache";

describe("bounded cache helpers", () => {
    it("stores and reads nullable values without treating them as cache misses", () => {
        expect.hasAssertions();

        const cache = new Map<string, null | string>();

        setBoundedCacheValue({
            cache,
            key: "entry",
            maxEntries: 2,
            value: null,
        });

        expect(getBoundedCacheValue(cache, "entry")).toStrictEqual({
            found: true,
            value: null,
        });
        expect({ actual: cache.has("entry") }).toStrictEqual({ actual: true });
    });

    it("treats cached undefined as a cache hit", () => {
        expect.hasAssertions();

        const cache = new Map<string, number | undefined>();
        const cachedUndefined = void 0;

        setBoundedCacheValue({
            cache,
            key: "entry",
            maxEntries: 2,
            value: cachedUndefined,
        });

        expect(getBoundedCacheValue(cache, "entry")).toStrictEqual({
            found: true,
            value: cachedUndefined,
        });
    });

    it("evicts least-recently-used entries when max size is exceeded", () => {
        expect.hasAssertions();

        const cache = new Map<string, number>();

        setBoundedCacheValue({
            cache,
            key: "first",
            maxEntries: 2,
            value: 1,
        });
        setBoundedCacheValue({
            cache,
            key: "second",
            maxEntries: 2,
            value: 2,
        });

        // Mark first as most-recently-used.
        expect(getBoundedCacheValue(cache, "first")).toStrictEqual({
            found: true,
            value: 1,
        });

        setBoundedCacheValue({
            cache,
            key: "third",
            maxEntries: 2,
            value: 3,
        });

        expect({ actual: cache.has("first") }).toStrictEqual({ actual: true });
        expect({ actual: cache.has("second") }).toStrictEqual({ actual: false });
        expect({ actual: cache.has("third") }).toStrictEqual({ actual: true });
    });

    it("does nothing when maxEntries is invalid", () => {
        expect.hasAssertions();

        const cache = new Map<string, number>();

        setBoundedCacheValue({
            cache,
            key: "entry",
            maxEntries: 0,
            value: 1,
        });

        expect(cache.size).toBe(0);
        expect(getBoundedCacheValue(cache, "entry")).toStrictEqual({
            found: false,
        });
    });
});
