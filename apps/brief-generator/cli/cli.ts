#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { generateBriefDocx } from "../src/index.js";

function parseArgs(): { inPath: string; outPath: string } {
  const args = process.argv.slice(2);
  let inPath = "";
  let outPath = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--in" && args[i + 1]) {
      inPath = args[++i];
    } else if (args[i] === "--out" && args[i + 1]) {
      outPath = args[++i];
    }
  }
  return { inPath, outPath };
}

async function main() {
  const { inPath, outPath } = parseArgs();
  if (!inPath || !outPath) {
    console.error("Uso: node cli/cli.js --in input.json --out brief.docx");
    process.exit(1);
  }

  const absIn = resolve(process.cwd(), inPath);
  const absOut = resolve(process.cwd(), outPath);

  let input: unknown;
  try {
    const raw = readFileSync(absIn, "utf-8");
    input = JSON.parse(raw);
  } catch (e) {
    console.error("Error leyendo input:", (e as Error).message);
    process.exit(1);
  }

  try {
    const buffer = await generateBriefDocx(input as Parameters<typeof generateBriefDocx>[0]);
    writeFileSync(absOut, buffer);
    console.log(`Brief generado: ${absOut}`);
  } catch (e) {
    console.error("Error generando brief:", (e as Error).message);
    process.exit(1);
  }
}

main();
