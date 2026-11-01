/**
 * Payments Repository v1.0
 * Pengelolaan transaksi Pembayaran / Penerimaan Kas (Store: payments).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class PaymentsRepository extends BaseRepository {
  constructor() {
    super(STORES.PAYMENTS);
  }

  /**
   * Mencari pembayaran berdasarkan nomor dokumen.
   * @param {IDBDatabase} db
   * @param {string} documentNumber
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object|null>}
   */
  async findByDocumentNumber(db, documentNumber, externalTx = null) {
    const records = await this.getByIndex(
      db,
      INDEXES.PAYMENTS.DOCUMENT_NUMBER.name,
      documentNumber,
      { limit: 1 },
      externalTx
    );
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Mengambil pembayaran berdasarkan jenis modul (RECEIVABLE / PAYABLE).
   * @param {IDBDatabase} db
   * @param {string} moduleType
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByModuleType(db, moduleType, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.PAYMENTS.MODULE_TYPE.name,
      moduleType,
      {},
      externalTx
    );
  }
}

export const paymentsRepository = new PaymentsRepository();
