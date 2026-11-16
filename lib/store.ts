import fs from "node:fs";
import path from "node:path";
import type { DB, Work } from "./types";

const DB_PATH = process.env.PHANTOM_DB || path.join(process.cwd(), "data", "db.json");

let cache: { db: DB; mtime: number } | null = null;

export function getDbPath() {
  return DB_PATH;
}

export function loadDB(): DB {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(DB_PATH);
  } catch {
    return emptyDB();
  }
  if (cache && cache.mtime === stat.mtimeMs) return cache.db;
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as DB;
  cache = { db, mtime: stat.mtimeMs };
  return db;
}

export function saveDB(db: DB): void {
  db.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
  cache = { db, mtime: fs.statSync(DB_PATH).mtimeMs };
}

export function updateDB(mutator: (db: DB) => void): DB {
  const db = structuredClone(loadDB());
  mutator(db);
  saveDB(db);
  return db;
}

export function findWork(db: DB, id: string): Work | undefined {
  return db.works.find((w) => w.id === id || w.id.startsWith(id));
}

export function emptyDB(): DB {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    works: [],
    models: [],
    characters: [],
    tags: [],
  };
}

/** Ensure upload dirs exist and return the folder for a new image. */
export function mediaDir(kind: "seed" | "uploads" = "uploads") {
  return path.join(process.cwd(), "public", "media", kind);
}
