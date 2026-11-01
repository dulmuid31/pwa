/**
 * Receivables Service v1.0
 * Pengelola bisnis transaksi Piutang Usaha PWA.
 */

import { receivablesRepository } from '../repositories/receivables.repository.js';
import { documentSequenceService } from './document-sequence.service.js';
import { auditLogService } from './audit-log.service.js';
import { DatabaseError, ERROR_CODES } from '../db-errors.js';

export class ReceivablesService {
  /**
   * Membuat transaksi Piutang Usaha baru.
   *
   * @param {IDBDatabase} db
   * @param {Object} data - { debtorId, categoryId, totalAmount, transactionDate, dueDate, notes }
   * @param {string} currentUserId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object>}
   */
  async createReceivable(db, data, currentUserId = 'system', externalTx = null) {
    if (!data || !data.debtorId || !data.totalAmount || data.totalAmount <= 0) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Data piutang wajib memiliki debtorId dan totalAmount > 0.'
      );
    }

    const txDate = data.transactionDate ? new Date(data.transactionDate) : new Date();
    const docNum = await documentSequenceService.generateDocumentNumber(db, 'INV', txDate, externalTx);

    const now = new Date().toISOString();
    const id = `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const record = {
      id,
      documentNumber: docNum,
      debtorId: data.debtorId,
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

    await receivablesRepository.add(db, record, externalTx);

    await auditLogService.logAction(
      db,
      {
        userId: currentUserId,
        entityType: 'RECEIVABLE',
        entityId: id,
        action: 'CREATE',
        details: { documentNumber: docNum, debtorId: data.debtorId, totalAmount: data.totalAmount }
      },
      externalTx
    );

    return record;
  }
}

export const receivablesService = new ReceivablesService();
