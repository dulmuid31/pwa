/**
 * Attachments Repository v1.0
 * Pengelolaan berkas lampiran pendukung transaksi (Store: attachments).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class AttachmentsRepository extends BaseRepository {
  constructor() {
    super(STORES.ATTACHMENTS);
  }

  /**
   * Mengambil lampiran berdasarkan entitas pemilik via Compound Key [ownerType, ownerId].
   * @param {IDBDatabase} db
   * @param {string} ownerType
   * @param {string} ownerId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByOwner(db, ownerType, ownerId, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.ATTACHMENTS.OWNER_TYPE_ID.name,
      [ownerType, ownerId],
      {},
      externalTx
    );
  }
}

export const attachmentsRepository = new AttachmentsRepository();
