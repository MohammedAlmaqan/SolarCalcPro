import { designSystem } from '../../core/engine';
import type { LoadItem } from '../../core/types';
import { exportDatabase, parseDatabaseBackup, restoreDatabase } from '../backup';
import { projectRepo } from '../repos/projects';
import { pshRepo } from '../repos/psh';
import { settingsRepo } from '../repos/settings';
import { openTestDb } from './helpers/testDb';

const LOADS: LoadItem[] = [
  {
    id: 'l1',
    name: 'LED Bulbs',
    quantity: 5,
    powerWatts: 9,
    hoursPerDay: 4,
    isAc: true,
    isSimultaneous: true,
    isInductive: false,
  },
  {
    id: 'l2',
    name: 'Fridge',
    quantity: 1,
    powerWatts: 150,
    hoursPerDay: 8,
    isAc: true,
    isSimultaneous: false,
    isInductive: true,
    surgeFactor: 5,
  },
];

describe('database backup', () => {
  it('round-trips all tables through export/parse/restore', async () => {
    const db = await openTestDb();
    const repo = projectRepo(db);

    const project = await repo.createProject({ name: 'Villa', scenario: { loads: LOADS } });
    const scenario = project.scenarios[0];
    await repo.updateScenario(scenario.id, {
      tiltDeg: 30,
      azimuthDeg: 180,
      shadingFactor: 0.9,
      loadMode: 'total',
      totalDailyKwh: 12.5,
    });
    const input = await repo.buildInput(scenario.id);
    await repo.saveDesignResult(scenario.id, designSystem(input));
    await pshRepo(db).addManual({
      country: 'Test',
      city: 'Timbuktu',
      latitude: 16.77,
      longitude: -3.0,
      winterPsh: 5.5,
      summerPsh: 6.5,
    });
    await settingsRepo(db).set('ui.electric_rate', '0.21');

    const json = await exportDatabase(db);
    const parsed = parseDatabaseBackup(json);

    const restored = await openTestDb();
    await restoreDatabase(restored, parsed);

    const reloaded = await projectRepo(restored).getProject(project.id);
    expect(reloaded?.name).toBe('Villa');
    expect(reloaded?.scenarios).toHaveLength(1);
    const reloadedScenario = reloaded!.scenarios[0];
    expect(reloadedScenario.loads).toHaveLength(2);
    expect(reloadedScenario.tiltDeg).toBe(30);
    expect(reloadedScenario.azimuthDeg).toBe(180);
    expect(reloadedScenario.shadingFactor).toBe(0.9);
    expect(reloadedScenario.loadMode).toBe('total');
    expect(reloadedScenario.totalDailyKwh).toBe(12.5);
    expect(reloadedScenario.designResult?.dailyLoad.totalWhPerDay).toBeCloseTo(12500, 1);

    expect(await settingsRepo(restored).get('ui.electric_rate')).toBe('0.21');
    expect((await pshRepo(restored).search('Timbuktu')).length).toBeGreaterThan(0);
  });

  it('rejects malformed backups', async () => {
    expect(() => parseDatabaseBackup('not json')).toThrow();
    expect(() =>
      parseDatabaseBackup(JSON.stringify({ format: 'other', version: 1 })),
    ).toThrow();
    expect(() =>
      parseDatabaseBackup(
        JSON.stringify({ format: 'solarcalcpro-db', version: 99, tables: {} }),
      ),
    ).toThrow();
    expect(() =>
      parseDatabaseBackup(
        JSON.stringify({ format: 'solarcalcpro-db', version: 1, tables: { projects: [] } }),
      ),
    ).toThrow('components');
  });

  it('replaces existing data on restore', async () => {
    const source = await openTestDb();
    await projectRepo(source).createProject({ name: 'Keep' });

    const restored = await openTestDb();
    await projectRepo(restored).createProject({ name: 'Discard' });
    const json = await exportDatabase(source);
    await restoreDatabase(restored, parseDatabaseBackup(json));

    const projects = await restored.getAllAsync<{ name: string }>('SELECT name FROM projects');
    expect(projects).toEqual([{ name: 'Keep' }]);
  });
});
