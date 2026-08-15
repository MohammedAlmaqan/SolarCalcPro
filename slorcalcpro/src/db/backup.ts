import type { DatabaseLike, SqlBindValue } from './types';

export const DB_BACKUP_FORMAT = 'solarcalcpro-db' as const;
export const DB_BACKUP_VERSION = 1 as const;

/** All user-affecting tables, parents first (FK-safe insert order). */
const TABLES = [
  'components',
  'psh_locations',
  'appliance_presets',
  'projects',
  'project_photos',
  'scenarios',
  'scenario_loads',
  'settings',
] as const;

export interface DbBackup {
  format: typeof DB_BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPrimitive(value: unknown): value is number | string | boolean | null {
  return (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  );
}

/** Serialize the entire database to a JSON backup string. */
export async function exportDatabase(db: DatabaseLike): Promise<string> {
  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const table of TABLES) {
    const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
    tables[table] = rows
      .map((row) =>
        Object.fromEntries(
          Object.entries(row)
            .filter(([, value]) => isPrimitive(value))
            .map(([key, value]) => [key, typeof value === 'boolean' ? Number(value) : value]),
        ),
      )
      .filter(isRecord);
  }
  const payload: DbBackup = {
    format: DB_BACKUP_FORMAT,
    version: DB_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  };
  return JSON.stringify(payload, null, 2);
}

/** Validate and normalize an imported full-database backup. Throws on invalid input. */
export function parseDatabaseBackup(text: string): DbBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON backup file.');
  }
  if (!isRecord(raw) || raw.format !== DB_BACKUP_FORMAT) {
    throw new Error('This file is not a SlorCalcPro database backup.');
  }
  const version = typeof raw.version === 'number' ? raw.version : 0;
  if (version < 1 || version > DB_BACKUP_VERSION) {
    throw new Error(`Unsupported backup version ${version}.`);
  }
  if (!isRecord(raw.tables)) {
    throw new Error('Backup is missing table data.');
  }
  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const table of TABLES) {
    const rows = raw.tables[table];
    if (!Array.isArray(rows)) {
      throw new Error(`Backup is missing the "${table}" table.`);
    }
    tables[table] = rows.filter(
      (row): row is Record<string, unknown> =>
        isRecord(row) && Object.values(row).every(isPrimitive),
    );
  }
  return {
    format: DB_BACKUP_FORMAT,
    version: DB_BACKUP_VERSION,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    tables,
  };
}

/** Actual columns of a table, ordered, from the live schema. */
async function tableColumns(db: DatabaseLike, table: string): Promise<string[]> {
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return cols.map((c) => c.name);
}

/**
 * Restore a full-database backup, replacing all existing rows.
 * Runs in one exclusive transaction: children are wiped first, then rows are
 * re-inserted in FK-safe order using only columns present in the live schema
 * (unknown columns from older/newer backups are ignored).
 */
export async function restoreDatabase(db: DatabaseLike, backup: DbBackup): Promise<void> {
  const deleteOrder = [...TABLES].reverse();
  const insertOrder = [...TABLES];

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const table of deleteOrder) {
      await txn.runAsync(`DELETE FROM ${table}`);
    }
    for (const table of insertOrder) {
      const columns = await tableColumns(txn, table);
      const rows = backup.tables[table];
      if (!rows) continue;
      const stmt = `INSERT INTO ${table} (${columns.join(', ')})
        VALUES (${columns.map(() => '?').join(', ')})`;
      for (const row of rows) {
        const values: SqlBindValue[] = columns.map((column) => {
          const value = row[column];
          if (value === undefined) return null;
          if (typeof value === 'boolean') return Number(value);
          return value as SqlBindValue;
        });
        await txn.runAsync(stmt, values);
      }
    }
  });
}
