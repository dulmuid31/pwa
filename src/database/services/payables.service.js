/**
 * Payables Service v1.0
 * Pengelola bisnis transaksi Hutang Usaha PWA.
 */

import { payablesRepository } from '../repositories/payables.repository.js';
import { documentSequenceService } from './document-sequence.service.js';
import { auditLogService } from './audit-log.service.js';
import { DatabaseError, ERROR_CODES } from '../db-errors.js';

export class PayablesService {
  /**
   * Membuat transaksi Hutang Usaha baru.
   *
   * @param {IDBDatabase} db
   * @param {Object} data - { creditorId, categoryId, totalAmount, transactionDate, dueDate, notes }
   * @param {string} currentUserId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object>}
   */
  async createPayable(db, data, currentUserId = 'system', externalTx = null) {
    if (!data || !data.creditorId || !data.totalAmount || data.totalAmount <= 0) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Data hutang wajib memiliki creditorId dan totalAmount > 0.'
      );
    }

    const txDate = data.transactionDate ? new Date(data.transactionDate) : new Date();
    const docNum = await documentSequenceService.generateDocumentNumber(db, 'BILL', txDate, externalTx);

    const now = new Date().toISOString();
    const id = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const record = {
      id,
      documentNumber: docNum,
      creditorId: data.creditorId,
      categoryId: data.categoryId || null,
      totalAmount: data.totalAmount,
      remainingBalance: data.totalAmount,
      transactionDate: txDate.toISOString(),
      dueDate: data.dueDate || null,
      lifecycleStatus: 'OPEN',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now
    };

    await payablesRepository.add(db, record, externalTx);

    await auditLogService.logAction(
      db,
      {
        userId: currentUserId,
        entityType: 'PAYABLE',
        entityId: id,
        action: 'CREATE',
        details: { documentNumber: docNum, creditorId: data.creditorId, totalAmount: data.totalAmount }
      },
      externalTx
    );

    return record;
  }
}

export const payablesService = new PayablesService();
