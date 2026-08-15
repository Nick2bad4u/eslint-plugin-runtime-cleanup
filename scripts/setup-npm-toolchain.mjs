import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

/**
 * @param {unknown} value
 *
 * @returns {value is Record<string, unknown>}
 */
const isRecord = (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * @param {string} argument
 *
 * @returns {boolean}
 */
const isSafeWindowsNpmArgument = (argument) =>
    argument.length > 0 &&
    [...argument].every(
        (character) =>
            (character >= "A" && character <= "Z") ||
            (character >= "a" && character <= "z") ||
            (character >= "0" && character <= "9") ||
            "@./_-".includes(character)
    );

/**
 * @param {readonly string[]} arguments_
 * @param {boolean} captureOutput
 *
 * @returns {string}
 */
const runNpm = (arguments_, captureOutput = false) => {
    const isWindows = process.platform === "win32";
    if (
        isWindows &&
        arguments_.some((argument) => !isSafeWindowsNpmArgument(argument))
    ) {
        throw new Error(
            "Refusing to pass an unsafe argument to npm on Windows."
        );
    }

    const executable = isWindows
        ? (process.env["ComSpec"] ?? "cmd.exe")
        : "npm";
    const executableArguments = isWindows
        ? [
              "/d",
              "/s",
              "/c",
              `npm ${arguments_.join(" ")}`,
          ]
        : arguments_;
    const result = spawnSync(executable, executableArguments, {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: captureOutput
            ? [
                  "ignore",
                  "pipe",
                  "inherit",
              ]
            : [
                  "ignore",
                  process.stderr,
                  process.stderr,
              ],
    });

    if (result.error !== undefined) {
        throw new Error("Unable to start npm.");
    }
    if (result.status !== 0) {
        throw new Error(
            `npm ${arguments_.join(" ")} exited with status ${String(result.status)}.`
        );
    }

    return typeof result.stdout === "string" ? result.stdout.trim() : "";
};

const main = () => {
    /** @type {unknown} */
    const packageJson = JSON.parse(
        readFileSync(new URL("../package.json", import.meta.url), "utf8")
    );
    if (!isRecord(packageJson)) {
        throw new Error(
            "The repository package.json must contain a JSON object."
        );
    }

    const declaredPackageManager = packageJson["packageManager"];
    if (typeof declaredPackageManager !== "string") {
        throw new Error("package.json#packageManager must be a string.");
    }

    const match = /^npm@(?<version>\d+\.\d+\.\d+)$/v.exec(
        declaredPackageManager
    );
    const expectedVersion = match?.groups?.["version"];
    if (expectedVersion === undefined) {
        throw new Error(
            `package.json#packageManager must declare an exact npm version; received '${declaredPackageManager}'.`
        );
    }

    const initialVersion = runNpm(["--version"], true);
    if (initialVersion !== expectedVersion) {
        runNpm([
            "install",
            "--global",
            "--ignore-scripts",
            declaredPackageManager,
        ]);
    }

    const actualVersion = runNpm(["--version"], true);
    if (actualVersion !== expectedVersion) {
        throw new Error(
            `Expected npm ${expectedVersion}, but npm ${actualVersion} is active.`
        );
    }

    const cachePath = runNpm(
        [
            "config",
            "get",
            "cache",
        ],
        true
    );
    if (cachePath.length === 0) {
        throw new Error("npm returned an empty download-cache path.");
    }

    process.stdout.write(`version=${actualVersion}\ncache=${cachePath}\n`);
};

try {
    main();
} catch {
    console.error("Failed to configure the declared npm toolchain.");
    process.exitCode = 1;
}
