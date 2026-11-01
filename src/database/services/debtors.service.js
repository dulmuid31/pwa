/**
 * Debtors Service v1.0
 * Pengelola bisnis data master Debitur.
 */

import { debtorsRepository } from '../repositories/debtors.repository.js';
import { auditLogService } from './audit-log.service.js';
import { DatabaseError, ERROR_CODES } from '../db-errors.js';

export class DebtorsService {
  /**
   * Mendaftarkan debitur baru dengan kode unik.
   *
   * @param {IDBDatabase} db
   * @param {Object} debtorData - { id, debtorCode, name, phone, address }
   * @param {string} currentUserId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object>}
   */
  async createDebtor(db, debtorData, currentUserId = 'system', externalTx = null) {
    if (!debtorData || !debtorData.id || !debtorData.debtorCode || !debtorData.name) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Data debitur wajib memiliki id, debtorCode, dan name.'
      );
    }

    const existingCode = await debtorsRepository.findByCode(db, debtorData.debtorCode, externalTx);
    if (existingCode) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        `Kode Debitur '${debtorData.debtorCode}' sudah digunakan.`
      );
    }

    const now = new Date().toISOString();
    const debtorRecord = {
      ...debtorData,
      isActive: debtorData.isActive !== undefined ? debtorData.isActive : true,
      createdAt: now,
      updatedAt: now
    };

    await debtorsRepository.add(db, debtorRecord, externalTx);

    await auditLogService.logAction(
      db,
      {
        userId: currentUserId,
        entityType: 'DEBTORS',
        entityId: debtorRecord.id,
        action: 'CREATE',
        details: { debtorCode: debtorRecord.debtorCode, name: debtorRecord.name }
      },
      externalTx
    );

    return debtorRecord;
  }
}

export const debtorsService = new DebtorsService();
