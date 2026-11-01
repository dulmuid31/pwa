/**
 * DocumentSequence Service v1.0
 * Pengelola penomoran dokumen otomatis berurutan PWA.
 */

import { documentSequencesRepository } from '../repositories/document-sequences.repository.js';
import { DatabaseError, ERROR_CODES } from '../db-errors.js';

export class DocumentSequenceService {
  /**
   * Menghasilkan nomor dokumen resmi berurutan.
   * Format: {prefix}/{YYYYMM}/{0001}
   *
   * @param {IDBDatabase} db
   * @param {string} prefix - Jenis/Kode Dokumen (misal: 'INV', 'BILL', 'PAY')
   * @param {Date} [date] - Tanggal transaksi
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<string>}
   */
  async generateDocumentNumber(db, prefix, date = new Date(), externalTx = null) {
    if (!prefix || typeof prefix !== 'string') {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Prefix nomor dokumen wajib berupa string.'
      );
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const period = `${year}${month}`;

    const seqNumber = await documentSequencesRepository.getNextSequence(
      db,
      prefix.toUpperCase(),
      period,
      externalTx
    );

    const formattedSeq = String(seqNumber).padStart(4, '0');
    return `${prefix.toUpperCase()}/${period}/${formattedSeq}`;
  }
}

export const documentSequenceService = new DocumentSequenceService();
