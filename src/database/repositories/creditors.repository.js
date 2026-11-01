/**
 * Creditors Repository v1.0
 * Pengelolaan entitas Kreditur / Hutang (Store: creditors).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class CreditorsRepository extends BaseRepository {
  constructor() {
    super(STORES.CREDITORS);
  }

  /**
   * Mencari kreditur berdasarkan kode unik (creditorCode).
   * @param {IDBDatabase} db
   * @param {string} creditorCode
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object|null>}
   */
  async findByCode(db, creditorCode, externalTx = null) {
    const records = await this.getByIndex(
      db,
      INDEXES.CREDITORS.CREDITOR_CODE.name,
      creditorCode,
      { limit: 1 },
      externalTx
    );
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Mengambil seluruh kreditur aktif.
   * @param {IDBDatabase} db
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getActiveCreditors(db, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.CREDITORS.IS_ACTIVE.name,
      true,
      {},
      externalTx
    );
  }
}

export const creditorsRepository = new CreditorsRepository();
