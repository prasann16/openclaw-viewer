import Database from "better-sqlite3";
import path from "path";

const CLAWD_ROOT = process.env.CLAWD_ROOT || "/home/clawdbot/clawd";
const DB_PATH = path.join(CLAWD_ROOT, "memory", "clawd.db");

// Whitelist of allowed table names to prevent SQL injection
const ALLOWED_TABLES = new Set([
  "sessions",
  "events",
  "decisions",
  "messages",
  "sqlite_sequence",
]);

function getDb(): Database.Database {
  return new Database(DB_PATH, { readonly: true });
}

function validateTableName(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error("INVALID_TABLE");
  }
}

export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export interface TableRows {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
}

export function getTables(): TableInfo[] {
  const db = getDb();
  try {
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as { name: string }[];

    return tables.map((t) => {
      const count = db
        .prepare(`SELECT COUNT(*) as count FROM "${t.name}"`)
        .get() as { count: number };
      return { name: t.name, rowCount: count.count };
    });
  } finally {
    db.close();
  }
}

export function getTableSchema(table: string): ColumnInfo[] {
  validateTableName(table);
  const db = getDb();
  try {
    return db.pragma(`table_info("${table}")`) as ColumnInfo[];
  } finally {
    db.close();
  }
}

export function getTableRows(
  table: string,
  limit: number = 50,
  offset: number = 0
): TableRows {
  validateTableName(table);

  // Clamp limit to prevent excessive queries
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const safeOffset = Math.max(0, offset);

  const db = getDb();
  try {
    const schema = db.pragma(`table_info("${table}")`) as ColumnInfo[];
    const columns = schema.map((col) => col.name);

    const rows = db
      .prepare(`SELECT * FROM "${table}" ORDER BY rowid DESC LIMIT ? OFFSET ?`)
      .all(safeLimit, safeOffset) as Record<string, unknown>[];

    const totalResult = db
      .prepare(`SELECT COUNT(*) as count FROM "${table}"`)
      .get() as { count: number };

    return {
      columns,
      rows,
      total: totalResult.count,
    };
  } finally {
    db.close();
  }
}
