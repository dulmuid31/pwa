/**
 * AuditLogs Repository v1.0
 * Pengelolaan rekam jejak aktivitas & audit trail (Store: audit_logs).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class AuditLogsRepository extends BaseRepository {
  constructor() {
    super(STORES.AUDIT_LOGS);
  }

  /**
   * Mengambil audit log berdasarkan userId.
   * @param {IDBDatabase} db
   * @param {string} userId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByUserId(db, userId, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.AUDIT_LOGS.USER_ID.name,
      userId,
      {},
      externalTx
    );
  }

  /**
   * Mengambil audit log berdasarkan entitas via Compound Key [entityType, entityId].
   * @param {IDBDatabase} db
   * @param {string} entityType
   * @param {string} entityId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getByEntity(db, entityType, entityId, externalTx = null) {
    return await this.getByIndex(
      db,
      INDEXES.AUDIT_LOGS.ENTITY_TYPE_ID.name,
      [entityType, entityId],
      {},
      externalTx
    );
  }
}

export const auditLogsRepository = new AuditLogsRepository();
