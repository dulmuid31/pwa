/**
 * PaymentMethods Repository v1.0
 * Pengelolaan metode pembayaran (Store: payment_methods).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class PaymentMethodsRepository extends BaseRepository {
  constructor() {
    super(STORES.PAYMENT_METHODS);
  }

  /**
   * Mencari metode pembayaran berdasarkan kode unik (misal: CASH, BANK_TRANSFER).
   * @param {IDBDatabase} db
   * @param {string} code
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object|null>}
   */
  async findByCode(db, code, externalTx = null) {
    const records = await this.getByIndex(
      db,
      INDEXES.PAYMENT_METHODS.CODE.name,
      code,
      { limit: 1 },
      externalTx
    );
    return records.length > 0 ? records[0] : null;
  }

  /**
   * Mengambil seluruh metode pembayaran aktif.
   * @param {IDBDatabase} db
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getActiveMethods(db, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.PAYMENT_METHODS.IS_ACTIVE.name,
      true,
      {},
      externalTx
    );
  }
}

export const paymentMethodsRepository = new PaymentMethodsRepository();
