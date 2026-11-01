/**
 * AppPreferences Repository v1.0
 * Pengelolaan preferensi antarmuka pengguna & state lokal PWA (Store: app_preferences).
 */

import { STORES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class AppPreferencesRepository extends BaseRepository {
  constructor() {
    super(STORES.APP_PREFERENCES);
  }

  /**
   * Membaca nilai preferensi berdasarkan id.
   * @param {IDBDatabase} db
   * @param {string} id
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<any>}
   */
  async getPreference(db, id, externalTx = null) {
    const record = await this.getById(db, id, externalTx);
    return record ? record.value : null;
  }

  /**
   * Menyimpan atau memperbarui nilai preferensi.
   * @param {IDBDatabase} db
   * @param {string} id
   * @param {any} value
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<string>}
   */
  async setPreference(db, id, value, externalTx = null) {
    const payload = {
      id,
      value,
      updatedAt: new Date().toISOString()
    };
    return await this.update(db, payload, externalTx);
  }
}

export const appPreferencesRepository = new AppPreferencesRepository();
