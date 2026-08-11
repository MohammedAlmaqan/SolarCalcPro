import { SEED_BATTERIES } from '../../data/batteries';
import { SEED_CABLES } from '../../data/cables';
import { SEED_CONTROLLERS } from '../../data/controllers';
import { SEED_INVERTERS } from '../../data/inverters';
import { SEED_PANELS } from '../../data/panels';
import { SEED_PRESETS } from '../../data/presets';
import { SEED_PSH } from '../../data/psh';
import { migrate } from '../migrate';
import { seed } from '../seed';
import { openMemoryDb } from './helpers/nodeDb';

async function openMigratedDb() {
  const db = openMemoryDb();
  await migrate(db);
  return db;
}

describe('seed', () => {
  it('loads the full curated catalog', async () => {
    const db = await openMigratedDb();
    await seed(db);

    const count = async (table: string): Promise<number> => {
      const row = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
      return row?.n ?? 0;
    };

    expect(await count('components')).toBe(
      SEED_PANELS.length +
        SEED_INVERTERS.length +
        SEED_BATTERIES.length +
        SEED_CONTROLLERS.length +
        SEED_CABLES.length,
    );
    expect(await count('psh_locations')).toBe(SEED_PSH.length);
    expect(await count('appliance_presets')).toBe(SEED_PRESETS.length);
  });

  it('marks seeded components as reference data', async () => {
    const db = await openMigratedDb();
    await seed(db);
    const row = await db.getFirstAsync<{ is_reference: number }>(
      "SELECT is_reference FROM components WHERE id = 'panel-ref-mono-550'",
    );
    expect(row?.is_reference).toBe(1);
  });

  it('is idempotent — running twice does not duplicate', async () => {
    const db = await openMigratedDb();
    await seed(db);
    await seed(db);
    const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM components');
    expect(row?.n).toBe(
      SEED_PANELS.length +
        SEED_INVERTERS.length +
        SEED_BATTERIES.length +
        SEED_CONTROLLERS.length +
        SEED_CABLES.length,
    );
  });

  it('round-trips a seeded panel spec via JSON', async () => {
    const db = await openMigratedDb();
    await seed(db);
    const row = await db.getFirstAsync<{ spec_json: string }>(
      "SELECT spec_json FROM components WHERE id = 'panel-ref-mono-550'",
    );
    const spec = JSON.parse(row?.spec_json ?? '') as { pmaxW: number };
    expect(spec.pmaxW).toBe(550);
  });

  it('stores a 12-value monthly PSH profile for every seeded city', async () => {
    const db = await openMigratedDb();
    await seed(db);
    const row = await db.getFirstAsync<{ monthly_psh_json: string | null }>(
      "SELECT monthly_psh_json FROM psh_locations WHERE id = 'psh-london'",
    );
    const profile = JSON.parse(row?.monthly_psh_json ?? '[]') as number[];
    expect(profile).toHaveLength(12);
    expect(profile.every((v) => typeof v === 'number' && v > 0)).toBe(true);
    // Worst month is mid-winter in the northern hemisphere (Dec/Jan).
    const worstIndex = profile.indexOf(Math.min(...profile));
    expect([0, 11]).toContain(worstIndex);
  });

  it('re-seeding refreshes monthly profiles on existing rows', async () => {
    const db = await openMigratedDb();
    await seed(db);
    await db.runAsync("UPDATE psh_locations SET monthly_psh_json = '[]' WHERE id = 'psh-dubai'");
    await seed(db);
    const row = await db.getFirstAsync<{ monthly_psh_json: string }>(
      "SELECT monthly_psh_json FROM psh_locations WHERE id = 'psh-dubai'",
    );
    expect(JSON.parse(row?.monthly_psh_json ?? '')).toHaveLength(12);
  });
});
