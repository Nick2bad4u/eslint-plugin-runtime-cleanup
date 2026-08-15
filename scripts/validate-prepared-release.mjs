import { pathToFileURL } from "node:url";

const STABLE_VERSION_PATTERN =
    /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)$/v;

/**
 * @typedef {"major" | "minor" | "patch"} ReleaseType
 */

/**
 * @typedef {{
 *     readonly major: number;
 *     readonly minor: number;
 *     readonly patch: number;
 * }} StableVersion
 */

/**
 * @typedef {{
 *     readonly explicitVersion?: string;
 *     readonly latestTag: string;
 *     readonly packageVersion: string;
 *     readonly releaseType: string;
 * }} PreparedRelease
 */

/**
 * Parse a stable x.y.z version without accepting prerelease/build syntax.
 *
 * @param {string} version
 * @param {string} label
 *
 * @returns {StableVersion}
 */
const parseStableVersion = (version, label) => {
    const match = STABLE_VERSION_PATTERN.exec(version);
    if (match?.groups === undefined) {
        throw new Error(`${label} '${version}' must use stable x.y.z format.`);
    }

    const parsed = {
        major: Number(match.groups.major),
        minor: Number(match.groups.minor),
        patch: Number(match.groups.patch),
    };

    if (Object.values(parsed).some((part) => !Number.isSafeInteger(part))) {
        throw new Error(`${label} '${version}' contains an unsafe integer.`);
    }

    return parsed;
};

/**
 * Format a parsed stable version.
 *
 * @param {StableVersion} version
 *
 * @returns {string}
 */
const formatStableVersion = ({ major, minor, patch }) =>
    `${major}.${minor}.${patch}`;

/**
 * Compare two parsed stable versions.
 *
 * @param {StableVersion} left
 * @param {StableVersion} right
 *
 * @returns {number}
 */
const compareStableVersions = (left, right) =>
    left.major - right.major ||
    left.minor - right.minor ||
    left.patch - right.patch;

/**
 * Calculate the requested stable version after the latest release.
 *
 * @param {StableVersion} latestVersion
 * @param {ReleaseType} releaseType
 *
 * @returns {StableVersion}
 */
const bumpStableVersion = (latestVersion, releaseType) => {
    switch (releaseType) {
        case "patch":
            return { ...latestVersion, patch: latestVersion.patch + 1 };
        case "minor":
            return {
                major: latestVersion.major,
                minor: latestVersion.minor + 1,
                patch: 0,
            };
        case "major":
            return { major: latestVersion.major + 1, minor: 0, patch: 0 };
        default:
            throw new Error(
                `Invalid release type '${releaseType}'. Allowed: patch, minor, major.`
            );
    }
};

/**
 * Validate that committed package metadata is ready to tag and publish.
 *
 * @param {PreparedRelease} release
 *
 * @returns {string}
 */
export const validatePreparedRelease = ({
    explicitVersion = "",
    latestTag,
    packageVersion,
    releaseType,
}) => {
    const preparedVersion = parseStableVersion(
        packageVersion,
        "package.json version"
    );
    if (!latestTag.startsWith("v")) {
        throw new Error(`Latest release tag '${latestTag}' must start with v.`);
    }

    const latestVersion = parseStableVersion(
        latestTag.slice(1),
        "Latest release tag"
    );

    if (compareStableVersions(preparedVersion, latestVersion) <= 0) {
        throw new Error(
            `Prepared version ${packageVersion} must be newer than ${latestTag}.`
        );
    }

    const expectedVersion =
        explicitVersion.length > 0
            ? formatStableVersion(
                  parseStableVersion(explicitVersion, "Explicit version")
              )
            : formatStableVersion(
                  bumpStableVersion(latestVersion, releaseType)
              );

    if (packageVersion !== expectedVersion) {
        throw new Error(
            `package.json is prepared as ${packageVersion}; expected ${expectedVersion}.`
        );
    }

    return packageVersion;
};

const isDirectExecution =
    process.argv[1] !== undefined &&
    pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
    const [
        packageVersion = "",
        latestTag = "",
        releaseType = "",
        explicitVersion = "",
    ] = process.argv.slice(2);

    try {
        console.log(
            validatePreparedRelease({
                explicitVersion,
                latestTag,
                packageVersion,
                releaseType,
            })
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
    }
}
