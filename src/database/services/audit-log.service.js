/**
 * AuditLog Service v1.0
 * Pengelola pencatatan rekam jejak audit trail transaksi PWA.
 */

import { auditLogsRepository } from '../repositories/audit-logs.repository.js';
import { DatabaseError, ERROR_CODES } from '../db-errors.js';

export class AuditLogService {
  /**
   * Mencatat log aktivitas audit secara atomik.
   *
   * @param {IDBDatabase} db
   * @param {Object} params - { userId, entityType, entityId, action, details }
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<string>} Log ID
   */
  async logAction(db, { userId, entityType, entityId, action, details = {} }, externalTx = null) {
    if (!userId || !entityType || !entityId || !action) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Parameter userId, entityType, entityId, dan action wajib diisi untuk audit log.'
      );
    }

    const timestamp = new Date().toISOString();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const logId = `log_${Date.now()}_${randomSuffix}`;

    const payload = {
      id: logId,
      userId,
      entityType: entityType.toUpperCase(),
      entityId,
      action: action.toUpperCase(),
      details,
      timestamp
    };

    await auditLogsRepository.add(db, payload, externalTx);
    return logId;
  }

  /**
   * Mengambil riwayat audit berdasarkan entitas.
   *
   * @param {IDBDatabase} db
   * @param {string} entityType
   * @param {string} entityId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Array<Object>>}
   */
  async getEntityLogs(db, entityType, entityId, externalTx = null) {
    return await auditLogsRepository.getByEntity(db, entityType.toUpperCase(), entityId, externalTx);
  }
}

export const auditLogService = new AuditLogService();
