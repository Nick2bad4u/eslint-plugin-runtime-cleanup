import { checkPackage, Package } from "@arethetypeswrong/core";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

/**
 * @param {unknown} value - Value to narrow.
 *
 * @returns {value is Record<string, unknown>} Whether the value is a plain
 *   object record.
 */
const isRecord = (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * @param {string} filePath - JSON file path to read.
 *
 * @returns {Promise<unknown>} Parsed JSON content.
 */
const readJsonFile = async (filePath) =>
    JSON.parse(await readFile(filePath, "utf8"));

const npmExecPath = process.env["npm_execpath"];
const packCommand = npmExecPath === undefined ? "npm" : process.execPath;
const packArguments =
    npmExecPath === undefined
        ? [
              "pack",
              "--dry-run",
              "--json",
          ]
        : [
              npmExecPath,
              "pack",
              "--dry-run",
              "--json",
          ];

const packProcess = spawnSync(packCommand, packArguments, {
    encoding: "utf8",
    shell: npmExecPath === undefined && process.platform === "win32",
    stdio: [
        "ignore",
        "pipe",
        "pipe",
    ],
});

if (packProcess.error) {
    throw packProcess.error;
}

if (packProcess.status !== 0) {
    throw new Error(packProcess.stderr || "npm pack --dry-run --json failed.");
}

const packOutput = packProcess.stdout;

const packEntries = JSON.parse(packOutput);

if (!Array.isArray(packEntries) || packEntries.length !== 1) {
    throw new Error(
        "Expected npm pack --dry-run --json to return one package entry."
    );
}

const [packEntry] = packEntries;

if (!isRecord(packEntry) || !Array.isArray(packEntry["files"])) {
    throw new Error("Expected npm pack output to include a files array.");
}

const manifest = await readJsonFile("package.json");

if (
    !isRecord(manifest) ||
    typeof manifest["name"] !== "string" ||
    typeof manifest["version"] !== "string"
) {
    throw new Error(
        "Expected package.json to include string name and version fields."
    );
}

const packageName = manifest["name"];
const packageVersion = manifest["version"];

/** @type {Record<string, Uint8Array>} */
const packageFiles = {};

for (const fileEntry of packEntry["files"]) {
    if (!isRecord(fileEntry) || typeof fileEntry["path"] !== "string") {
        throw new Error(
            "Expected every packed file entry to include a string path."
        );
    }

    const filePath = fileEntry["path"];

    packageFiles[`/node_modules/${packageName}/${filePath}`] =
        await readFile(filePath);
}

const packageAnalysis = await checkPackage(
    new Package(packageFiles, packageName, packageVersion)
);

if (!packageAnalysis.types) {
    console.log(
        "Package type check skipped because the package does not expose types."
    );
    process.exit(0);
}

if (packageAnalysis.problems.length > 0) {
    console.error(
        `Package type check found ${packageAnalysis.problems.length} problem(s):`
    );

    for (const problem of packageAnalysis.problems) {
        console.error(JSON.stringify(problem, undefined, 2));
    }

    process.exit(1);
}

console.log(
    `Package type check passed for ${packageAnalysis.packageName}@${packageAnalysis.packageVersion}.`
);
