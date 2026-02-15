import { readFile } from "node:fs/promises";
import path from "node:path";
import { Firestore } from "@google-cloud/firestore";

type SeedEntry = {
  path: string;
  data: unknown;
};

const projectId = process.env.FIRESTORE_PROJECT_ID || "demo-kimeboard";
const db = new Firestore({ projectId, ignoreUndefinedProperties: true });

function replaceDateTokens(value: unknown, nowIso: string, nextWeekIso: string): unknown {
  if (typeof value === "string") {
    if (value === "__NOW__") return nowIso;
    if (value === "__NEXT_WEEK__") return nextWeekIso;
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceDateTokens(item, nowIso, nextWeekIso));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceDateTokens(item, nowIso, nextWeekIso),
      ]),
    );
  }

  return value;
}

async function readSeedEntries(): Promise<SeedEntry[]> {
  const sourcePath = path.join(process.cwd(), "src", "data", "demo", "firestore-seed.json");
  const source = await readFile(sourcePath, "utf-8");
  const normalized = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const parsed = JSON.parse(normalized);
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid seed file: expected top-level array");
  }

  return parsed as SeedEntry[];
}

async function main() {
  const entries = await readSeedEntries();
  const nowIso = new Date().toISOString();
  const nextWeekIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const batch = db.batch();

  for (const entry of entries) {
    if (!entry.path) {
      throw new Error("Invalid seed entry: missing path");
    }
    const docRef = db.doc(entry.path);
    const data = replaceDateTokens(entry.data, nowIso, nextWeekIso);
    batch.set(docRef, data);
  }

  await batch.commit();
  console.log(`Seed completed: ${entries.length} docs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
