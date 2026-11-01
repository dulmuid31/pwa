/**
 * DocumentSequences Repository v1.0
 * Pengelolaan penomoran otomatis dokumen secara terisolasi dan atomik (Store: document_sequences).
 */

import { STORES, INDEXES } from '../db-config.js';
import { BaseRepository } from './base.repository.js';

export class DocumentSequencesRepository extends BaseRepository {
  constructor() {
    super(STORES.DOCUMENT_SEQUENCES);
  }

  /**
   * Membaca dan menaikkan nilai nomor urut dokumen berikutnya secara atomik.
   * @param {IDBDatabase} db
   * @param {string} documentType - Jenis dokumen (misal: INV, PAY, PK)
   * @param {string} period - Periode format 'YYYYMM'
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<number>} Sequence number berikutnya
   */
  async getNextSequence(db, documentType, period, externalTx = null) {
    const existingSeq = await this.getByIndex(
      db,
      INDEXES.DOCUMENT_SEQUENCES.TYPE_PERIOD.name,
      [documentType, period],
      { limit: 1 },
      externalTx
    );

    let nextVal = 1;
    let seqRecord;

    if (existingSeq.length > 0) {
      seqRecord = existingSeq[0];
      nextVal = seqRecord.lastSequence + 1;
      seqRecord.lastSequence = nextVal;
      seqRecord.updatedAt = new Date().toISOString();
    } else {
      seqRecord = {
        id: `${documentType}_${period}`,
        documentType,
        period,
        lastSequence: nextVal,
        updatedAt: new Date().toISOString()
      };
    }

    await this.update(db, seqRecord, externalTx);
    return nextVal;
  }
}

export const documentSequencesRepository = new DocumentSequencesRepository();
