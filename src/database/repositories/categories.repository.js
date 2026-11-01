/**
 * Categories Repository v1.0
 * Pengelolaan kategori transaksi (Store: categories).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class CategoriesRepository extends BaseRepository {
  constructor() {
    super(STORES.CATEGORIES);
  }

  /**
   * Mengambil kategori berdasarkan jenis modul (RECEIVABLE / PAYABLE).
   * @param {IDBDatabase} db
   * @param {string} moduleType
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByModuleType(db, moduleType, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.CATEGORIES.MODULE_TYPE.name,
      moduleType,
      {},
      externalTx
    );
  }

  /**
   * Mencari kategori berdasarkan kombinasi Compound Key [moduleType, categoryCode].
   * @param {IDBDatabase} db
   * @param {string} moduleType
   * @param {string} categoryCode
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object|null>}
   */
  async findByModuleAndCode(db, moduleType, categoryCode, externalTx = null) {
    const records = await this.getByIndex(
      db,
      INDEXES.CATEGORIES.MODULE_CATEGORY.name,
      [moduleType, categoryCode],
      { limit: 1 },
      externalTx
    );
    return records.length > 0 ? records[0] : null;
  }
}

export const categoriesRepository = new CategoriesRepository();
