export type ReleaseType =
    | "major"
    | "minor"
    | "patch";

export interface PreparedRelease {
    readonly explicitVersion?: string;
    readonly latestTag: string;
    readonly packageVersion: string;
    readonly releaseType: string;
}

/** Validate that committed package metadata is ready to tag and publish. */
export function validatePreparedRelease(release: PreparedRelease): string;
