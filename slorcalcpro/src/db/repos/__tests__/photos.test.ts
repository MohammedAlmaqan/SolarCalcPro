import { photoRepo } from '../photos';
import { openTestDb } from '../../__tests__/helpers/testDb';

describe('photoRepo', () => {
  it('adds photos with an incrementing position and lists them ordered', async () => {
    const db = await openTestDb();
    await db.runAsync("INSERT INTO projects (id, name) VALUES ('p1', 'Demo')");
    const repo = photoRepo(db);

    const a = await repo.add('p1', 'data:image/jpeg;base64,AAAA');
    const b = await repo.add('p1', 'data:image/png;base64,BBBB');

    const photos = await repo.listByProject('p1');
    expect(photos).toHaveLength(2);
    expect(photos[0]).toEqual(a);
    expect(photos[1]).toEqual(b);
    expect(photos.map((p) => p.position)).toEqual([0, 1]);
    expect(photos.map((p) => p.dataUri)).toEqual([
      'data:image/jpeg;base64,AAAA',
      'data:image/png;base64,BBBB',
    ]);
  });

  it('scopes photos to their project', async () => {
    const db = await openTestDb();
    await db.runAsync("INSERT INTO projects (id, name) VALUES ('p1', 'A')");
    await db.runAsync("INSERT INTO projects (id, name) VALUES ('p2', 'B')");
    const repo = photoRepo(db);
    await repo.add('p1', 'data:image/jpeg;base64,AAAA');

    expect(await repo.listByProject('p2')).toEqual([]);
  });

  it('removes a photo by id', async () => {
    const db = await openTestDb();
    await db.runAsync("INSERT INTO projects (id, name) VALUES ('p1', 'Demo')");
    const repo = photoRepo(db);
    const photo = await repo.add('p1', 'data:image/jpeg;base64,AAAA');

    await repo.remove(photo.id);
    expect(await repo.listByProject('p1')).toEqual([]);
  });

  it('cascades deletion when the parent project is removed', async () => {
    const db = await openTestDb();
    await db.runAsync("INSERT INTO projects (id, name) VALUES ('p1', 'Demo')");
    await photoRepo(db).add('p1', 'data:image/jpeg;base64,AAAA');

    await db.runAsync("DELETE FROM projects WHERE id = 'p1'");
    expect(await photoRepo(db).listByProject('p1')).toEqual([]);
  });
});
