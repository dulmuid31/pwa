/**
 * Receivables Repository v1.0
 * Pengelolaan transaksi Piutang Usaha (Store: receivables).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class ReceivablesRepository extends BaseRepository {
  constructor() {
    super(STORES.RECEIVABLES);
  }

  /**
   * Mencari piutang berdasarkan nomor dokumen unik (documentNumber).
   * @param {IDBDatabase} db
   * @param {string} documentNumber
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object|null>}
   */
  async findByDocumentNumber(db, documentNumber, externalTx = null) {
    const records = await this.getByIndex(
      db,
      INDEXES.RECEIVABLES.DOCUMENT_NUMBER.name,
      documentNumber,
      { limit: 1 },
      externalTx
    );
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Mengambil seluruh piutang berdasarkan debtorId.
   * @param {IDBDatabase} db
   * @param {string} debtorId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByDebtorId(db, debtorId, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.RECEIVABLES.DEBTOR_ID.name,
      debtorId,
      {},
      externalTx
    );
  }

  /**
   * Mengambil piutang berdasarkan status siklus hidup (misal: OPEN, PAID, OVERDUE).
   * @param {IDBDatabase} db
   * @param {string} status
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByStatus(db, status, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.RECEIVABLES.LIFECYCLE_STATUS.name,
      status,
      {},
      externalTx
    );
  }
}

export const receivablesRepository = new ReceivablesRepository();
