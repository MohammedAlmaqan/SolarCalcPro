import { newId } from '../../utils/id';
import type { DatabaseLike } from '../types';

export interface ProjectPhoto {
  id: string;
  projectId: string;
  position: number;
  /** Base64 data URI of the site photo. */
  dataUri: string;
}

interface PhotoRow {
  id: string;
  project_id: string;
  position: number;
  data_uri: string;
}

function toPhoto(row: PhotoRow): ProjectPhoto {
  return {
    id: row.id,
    projectId: row.project_id,
    position: row.position,
    dataUri: row.data_uri,
  };
}

export interface PhotosRepo {
  listByProject(projectId: string): Promise<ProjectPhoto[]>;
  add(projectId: string, dataUri: string): Promise<ProjectPhoto>;
  remove(id: string): Promise<void>;
}

/** Site photos attached to a project for client-facing proposals. */
export function photoRepo(db: DatabaseLike): PhotosRepo {
  const listByProject = async (projectId: string): Promise<ProjectPhoto[]> => {
    const rows = await db.getAllAsync<PhotoRow>(
      'SELECT * FROM project_photos WHERE project_id = ? ORDER BY position',
      [projectId],
    );
    return rows.map(toPhoto);
  };

  return {
    listByProject,
    add: async (projectId, dataUri) => {
      const row = await db.getFirstAsync<{ next: number }>(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM project_photos WHERE project_id = ?',
        [projectId],
      );
      const photo: ProjectPhoto = {
        id: newId(),
        projectId,
        position: row?.next ?? 0,
        dataUri,
      };
      await db.runAsync(
        `INSERT INTO project_photos (id, project_id, position, data_uri)
         VALUES (?, ?, ?, ?)`,
        [photo.id, photo.projectId, photo.position, photo.dataUri],
      );
      return photo;
    },
    remove: async (id) => {
      await db.runAsync('DELETE FROM project_photos WHERE id = ?', [id]);
    },
  };
}
