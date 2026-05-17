/**
 * Smoke-test the published plugin shape against ESLint flat config loading.
 */
// @ts-check

import { ESLint } from "eslint";

import plugin from "../dist/plugin.js";

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

console.log("ESLint compatibility smoke test passed.");
