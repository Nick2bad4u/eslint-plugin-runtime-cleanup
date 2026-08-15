/** Check whether an unknown value is a non-null object record. */
export function isRecord(value: unknown): value is Record<string, unknown>;

/** Read the single package entry emitted by npm pack JSON output. */
export function getSingleNpmPackEntry(
    packOutput: unknown
): Record<string, unknown>;

/** Read and validate the archive filename from npm pack JSON output. */
export function getSingleNpmPackFilename(packOutput: unknown): string;
