/**
 * LocalSnapshots Repository v1.0
 * Pengelolaan snapshot data lokal PWA (Store: local_snapshots).
 */

import { STORES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class LocalSnapshotsRepository extends BaseRepository {
  constructor() {
    super(STORES.LOCAL_SNAPSHOTS);
  }
}

export const localSnapshotsRepository = new LocalSnapshotsRepository();
