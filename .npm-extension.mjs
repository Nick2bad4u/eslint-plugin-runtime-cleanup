/**
 * Repair inaccurate third-party dependency metadata before npm resolves it.
 *
 * Madge 8 supports TypeScript 6, but its published peer range still stops at
 * TypeScript 5. The upstream correction is pending in
 * https://github.com/pahen/madge/pull/460.
 *
 * Remove this repair once Madge publishes the corrected peer range. The stale
 * guard intentionally fails installation if Madge 8's metadata changes first,
 * so the repair cannot silently outlive the upstream condition it addresses.
 */

const correctedTypeScriptPeerRange = "^5.4.4 || ^6.0.2";
const publishedTypeScriptPeerRange = "^5.4.4";

/**
 * Check whether an unknown value is a non-null object record.
 *
 * @param {unknown} value
 *
 * @returns {value is Record<string, unknown>}
 */
const isRecord = (value) => typeof value === "object" && value !== null;

/**
 * Apply deterministic dependency-manifest repairs used by this repository.
 *
 * @param {Record<string, unknown>} packageManifest
 *
 * @returns {Record<string, unknown>}
 */
export const transformManifest = (packageManifest) => {
    const packageName = packageManifest["name"];
    const packageVersion = packageManifest["version"];

    if (
        packageName !== "madge" ||
        typeof packageVersion !== "string" ||
        !packageVersion.startsWith("8.")
    ) {
        return packageManifest;
    }

    const peerDependencies = packageManifest["peerDependencies"];

    if (
        !isRecord(peerDependencies) ||
        peerDependencies["typescript"] !== publishedTypeScriptPeerRange
    ) {
        throw new Error(
            `Madge ${packageVersion} no longer has the expected TypeScript peer range. Remove or review .npm-extension.mjs before installing.`
        );
    }

    return {
        ...packageManifest,
        peerDependencies: {
            ...peerDependencies,
            typescript: correctedTypeScriptPeerRange,
        },
    };
};
