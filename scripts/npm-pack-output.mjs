/**
 * Check whether an unknown value is a non-null object record.
 *
 * @param {unknown} value
 *
 * @returns {value is Record<string, unknown>}
 */
export const isRecord = (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Read the single package entry emitted by `npm pack --dry-run --json`.
 *
 * Npm 11 emits an array, while npm 12 emits an object keyed by package name.
 * Supporting both keeps the release gate valid across the declared toolchain.
 *
 * @param {unknown} packOutput
 *
 * @returns {Record<string, unknown>}
 */
export const getSingleNpmPackEntry = (packOutput) => {
    const packageEntries = Array.isArray(packOutput)
        ? packOutput
        : isRecord(packOutput)
          ? Object.values(packOutput)
          : [];

    if (packageEntries.length !== 1 || !isRecord(packageEntries[0])) {
        throw new Error(
            "Expected npm pack --dry-run --json to return exactly one package entry."
        );
    }

    return packageEntries[0];
};
