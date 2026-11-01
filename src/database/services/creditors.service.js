/**
 * Creditors Service v1.0
 * Pengelola bisnis data master Kreditur.
 */

import { creditorsRepository } from '../repositories/creditors.repository.js';
import { auditLogService } from './audit-log.service.js';
import { DatabaseError, ERROR_CODES } from '../db-errors.js';

export class CreditorsService {
  /**
   * Mendaftarkan kreditur baru dengan kode unik.
   *
   * @param {IDBDatabase} db
   * @param {Object} creditorData - { id, creditorCode, name, phone, address }
   * @param {string} currentUserId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object>}
   */
  async createCreditor(db, creditorData, currentUserId = 'system', externalTx = null) {
    if (!creditorData || !creditorData.id || !creditorData.creditorCode || !creditorData.name) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Data kreditur wajib memiliki id, creditorCode, dan name.'
      );
    }

    const existingCode = await creditorsRepository.findByCode(db, creditorData.creditorCode, externalTx);
    if (existingCode) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        `Kode Kreditur '${creditorData.creditorCode}' sudah digunakan.`
      );
    }

    const now = new Date().toISOString();
    const creditorRecord = {
      ...creditorData,
      isActive: creditorData.isActive !== undefined ? creditorData.isActive : true,
      createdAt: now,
      updatedAt: now
    };

    await creditorsRepository.add(db, creditorRecord, externalTx);

    await auditLogService.logAction(
      db,
      {
        userId: currentUserId,
        entityType: 'CREDITORS',
        entityId: creditorRecord.id,
        action: 'CREATE',
        details: { creditorCode: creditorRecord.creditorCode, name: creditorRecord.name }
      },
      externalTx
    );

    return creditorRecord;
  }
}

export const creditorsService = new CreditorsService();
