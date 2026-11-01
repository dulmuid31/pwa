/**
 * Users Repository v1.0
 * Pengelolaan data pengguna dan otentikasi (Store: users).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class UsersRepository extends BaseRepository {
  constructor() {
    super(STORES.USERS);
  }

  /**
   * Mencari pengguna berdasarkan username unik.
   * @param {IDBDatabase} db
   * @param {string} username
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object|null>}
   */
  async findByUsername(db, username, externalTx = null) {
    const records = await this.getByIndex(
      db,
      INDEXES.USERS.USERNAME.name,
      username,
      { limit: 1 },
      externalTx
    );
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Mengambil seluruh pengguna aktif.
   * @param {IDBDatabase} db
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getActiveUsers(db, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.USERS.IS_ACTIVE.name,
      true,
      {},
      externalTx
    );
  }
}

export const usersRepository = new UsersRepository();
