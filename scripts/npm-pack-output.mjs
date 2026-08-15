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
 * Read the single package entry emitted by `npm pack --json`.
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
            "Expected npm pack --json to return exactly one package entry."
        );
    }

    return packageEntries[0];
};

/**
 * Read and validate the archive filename from `npm pack --json` output.
 *
 * Npm creates the archive in the requested destination, so accepting path
 * components here would make a malformed metadata payload escape that directory
 * when the release workflow constructs the archive path.
 *
 * @param {unknown} packOutput
 *
 * @returns {string}
 */
export const getSingleNpmPackFilename = (packOutput) => {
    const { filename } = getSingleNpmPackEntry(packOutput);

    if (
        typeof filename !== "string" ||
        filename.length === 0 ||
        filename === "." ||
        filename === ".." ||
        filename.includes("/") ||
        filename.includes("\\")
    ) {
        throw new Error(
            "Expected npm pack --json to return a safe archive filename."
        );
    }

    return filename;
};
