/**
 * Settings Repository v1.0
 * Pengelolaan konfigurasi aplikasi dan preferensi umum (Store: settings).
 */

import { STORES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class SettingsRepository extends BaseRepository {
  constructor() {
    super(STORES.SETTINGS);
  }

  /**
   * Membaca nilai konfigurasi berdasarkan key id.
   * @param {IDBDatabase} db
   * @param {string} id
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<any>}
   */
  async getSetting(db, id, externalTx = null) {
    const record = await this.getById(db, id, externalTx);
    return record ? record.value : null;
  }

  /**
   * Menyimpan atau memperbarui konfigurasi key-value.
   * @param {IDBDatabase} db
   * @param {string} id
   * @param {any} value
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<string>}
   */
  async setSetting(db, id, value, externalTx = null) {
    const payload = {
      id,
      value,
      updatedAt: new Date().toISOString()
    };
    return await this.update(db, payload, externalTx);
  }
}

export const settingsRepository = new SettingsRepository();
