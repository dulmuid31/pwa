/**
 * AppMeta Repository v1.0
 * Pengelolaan metadata sistem, versi skema, dan status migrasi (Store: app_meta).
 */

import { STORES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';
import { DatabaseError, ERROR_CODES } from '../db-errors.js';

export class AppMetaRepository extends BaseRepository {
  constructor() {
    super(STORES.APP_META);
  }

  /**
   * Membaca versi skema aplikasi saat ini dari metadata.
   * @param {IDBDatabase} db
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<number|null>}
   */
  async getSchemaVersion(db, externalTx = null) {
    const record = await this.getById(db, 'schemaVersion', externalTx);
    return record ? record.value : null;
  }

  /**
   * Memperbarui versi skema dan timestamp pembaharuan.
   * @param {IDBDatabase} db
   * @param {number} version
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<string>}
   */
  async setSchemaVersion(db, version, externalTx = null) {
    if (!Number.isSafeInteger(version) || version < 1) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        `Versi skema tidak valid: ${version}`
      );
    }

    const payload = {
      key: 'schemaVersion',
      value: version,
      updatedAt: new Date().toISOString()
    };

    return await this.update(db, payload, externalTx);
  }
}

export const appMetaRepository = new AppMetaRepository();
