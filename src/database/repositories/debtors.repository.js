/**
 * Debtors Repository v1.0
 * Pengelolaan entitas Debitur / Piutang (Store: debtors).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class DebtorsRepository extends BaseRepository {
  constructor() {
    super(STORES.DEBTORS);
  }

  /**
   * Mencari debitur berdasarkan kode unik (debtorCode).
   * @param {IDBDatabase} db
   * @param {string} debtorCode
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object|null>}
   */
  async findByCode(db, debtorCode, externalTx = null) {
    const records = await this.getByIndex(
      db,
      INDEXES.DEBTORS.DEBTOR_CODE.name,
      debtorCode,
      { limit: 1 },
      externalTx
    );
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Mengambil seluruh debitur aktif.
   * @param {IDBDatabase} db
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getActiveDebtors(db, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.DEBTORS.IS_ACTIVE.name,
      true,
      {},
      externalTx
    );
  }
}

export const debtorsRepository = new DebtorsRepository();
