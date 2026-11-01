/**
 * BackupRecords Repository v1.0
 * Pengelolaan rekam riwayat backup data (Store: backup_records).
 */

import { STORES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class BackupRecordsRepository extends BaseRepository {
  constructor() {
    super(STORES.BACKUP_RECORDS);
  }
}

export const backupRecordsRepository = new BackupRecordsRepository();
