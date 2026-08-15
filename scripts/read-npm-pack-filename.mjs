/**
 * Print the safe archive filename from `npm pack --json` data received on
 * standard input.
 */
// @ts-check

import { readFileSync } from "node:fs";

import { getSingleNpmPackFilename } from "./npm-pack-output.mjs";

const packOutput = JSON.parse(readFileSync(0, "utf8"));

process.stdout.write(`${getSingleNpmPackFilename(packOutput)}\n`);
