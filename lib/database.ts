import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { getWorkspaceRoot } from "./files";

function findDatabaseFiles(workspaceId?: string): string[] {
  const root = getWorkspaceRoot(workspaceId);
  const memoryDir = path.join(root, "memory");
  
  if (!fs.existsSync(memoryDir)) {
    return [];
  }

  const files = fs.readdirSync(memoryDir);
  return files
    .filter(f => f.endsWith(".db") || f.endsWith(".sqlite"))
    .map(f => path.join(memoryDir, f));
}

function getDb(dbPath: string): Database.Database {
  return new Database(dbPath, { readonly: true });
}

export interface DatabaseInfo {
  name: string;
  path: string;
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

export function getDatabases(workspaceId?: string): DatabaseInfo[] {
  const dbFiles = findDatabaseFiles(workspaceId);
  return dbFiles.map(dbPath => ({
    name: path.basename(dbPath),
    path: dbPath,
  }));
}

export function getTables(dbPath: string): TableInfo[] {
  if (!fs.existsSync(dbPath)) {
    return [];
  }

  const db = getDb(dbPath);
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

export function getTableSchema(dbPath: string, table: string): ColumnInfo[] {
  const db = getDb(dbPath);
  try {
    return db.pragma(`table_info("${table}")`) as ColumnInfo[];
  } finally {
    db.close();
  }
}

export function getTableRows(
  dbPath: string,
  table: string,
  limit: number = 50,
  offset: number = 0
): TableRows {
  // Clamp limit to prevent excessive queries
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const safeOffset = Math.max(0, offset);

  const db = getDb(dbPath);
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
