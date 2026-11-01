/**
 * PaymentAllocations Repository v1.0
 * Pengelolaan alokasi pembayaran terhadap piutang/hutang (Store: payment_allocations).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class PaymentAllocationsRepository extends BaseRepository {
  constructor() {
    super(STORES.PAYMENT_ALLOCATIONS);
  }

  /**
   * Mengambil seluruh alokasi untuk suatu paymentId.
   * @param {IDBDatabase} db
   * @param {string} paymentId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByPaymentId(db, paymentId, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.PAYMENT_ALLOCATIONS.PAYMENT_ID.name,
      paymentId,
      {},
      externalTx
    );
  }

  /**
   * Mengambil alokasi berdasarkan modul dan transaksi asal via Compound Key [moduleType, transactionId].
   * @param {IDBDatabase} db
   * @param {string} moduleType
   * @param {string} transactionId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByModuleAndTransaction(db, moduleType, transactionId, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.PAYMENT_ALLOCATIONS.MODULE_TX.name,
      [moduleType, transactionId],
      {},
      externalTx
    );
  }
}

export const paymentAllocationsRepository = new PaymentAllocationsRepository();
