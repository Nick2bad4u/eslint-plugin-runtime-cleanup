/**
 * Smoke-test the published plugin shape against ESLint flat config loading.
 */
// @ts-check

import { ESLint } from "eslint";

import plugin from "../dist/plugin.js";

const expectedMajorText = process.env["ESLINT_EXPECTED_MAJOR"];

if (expectedMajorText !== undefined) {
    if (!/^[1-9]\d*$/.test(expectedMajorText)) {
        throw new Error(
            `ESLINT_EXPECTED_MAJOR must be a positive integer; received ${JSON.stringify(expectedMajorText)}.`
        );
    }

    const [actualMajorText] = ESLint.version.split(".");
    const expectedMajor = Number.parseInt(expectedMajorText, 10);
    const actualMajor = Number.parseInt(actualMajorText ?? "", 10);

    if (actualMajor !== expectedMajor) {
        throw new Error(
            `Expected ESLint major ${expectedMajor}, but loaded ESLint ${ESLint.version}.`
        );
    }
}

const eslint = new ESLint({
    overrideConfig: [
        {
            files: ["**/*.ts"],
            languageOptions: {
                parserOptions: {
                    ecmaVersion: "latest",
                    sourceType: "module",
                },
            },
            plugins: {
                "runtime-cleanup": plugin,
            },
            rules: {},
        },
    ],
    overrideConfigFile: true,
});

const results = await eslint.lintText("const value = 1;\n", {
    filePath: "compat-smoke.ts",
});

const [result] = results;

if (result === undefined || result.errorCount !== 0) {
    throw new Error("ESLint compatibility smoke test failed.");
}

console.log(`ESLint ${ESLint.version} compatibility smoke test passed.`);
