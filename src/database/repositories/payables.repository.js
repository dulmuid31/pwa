/**
 * Payables Repository v1.0
 * Pengelolaan transaksi Hutang Usaha (Store: payables).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class PayablesRepository extends BaseRepository {
  constructor() {
    super(STORES.PAYABLES);
  }

  /**
   * Mencari hutang berdasarkan nomor dokumen unik (documentNumber).
   * @param {IDBDatabase} db
   * @param {string} documentNumber
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object|null>}
   */
  async findByDocumentNumber(db, documentNumber, externalTx = null) {
    const records = await this.getByIndex(
      db,
      INDEXES.PAYABLES.DOCUMENT_NUMBER.name,
      documentNumber,
      { limit: 1 },
      externalTx
    );
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Mengambil seluruh hutang berdasarkan creditorId.
   * @param {IDBDatabase} db
   * @param {string} creditorId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByCreditorId(db, creditorId, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.PAYABLES.CREDITOR_ID.name,
      creditorId,
      {},
      externalTx
    );
  }

  /**
   * Mengambil hutang berdasarkan status siklus hidup.
   * @param {IDBDatabase} db
   * @param {string} status
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByStatus(db, status, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.PAYABLES.LIFECYCLE_STATUS.name,
      status,
      {},
      externalTx
    );
  }
}

export const payablesRepository = new PayablesRepository();
