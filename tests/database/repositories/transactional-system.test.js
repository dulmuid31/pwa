import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { initDB, closeDB } from '../../../src/database/db.js';
import {
  receivablesRepository,
  payablesRepository,
  paymentsRepository,
  paymentAllocationsRepository,
  attachmentsRepository,
  auditLogsRepository,
  documentSequencesRepository,
  appPreferencesRepository
} from '../../../src/database/repositories/index.js';

async function deleteDatabaseAsync(dbName, timeoutMs = 3000) {
  closeDB();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Database cleanup timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    const req = indexedDB.deleteDatabase(dbName);
    req.onsuccess = () => { clearTimeout(timer); resolve(); };
    req.onerror = (e) => { clearTimeout(timer); reject(e.target.error); };
    req.onblocked = () => {
      clearTimeout(timer);
      reject(new Error('Database deletion blocked by unclosed connections'));
    };
  });
}

describe('Transactional & System Repositories Tests (Step 3.3)', () => {
  let db;

  beforeEach(async () => {
    db = await initDB();
  });

  afterEach(async () => {
    closeDB();
    await deleteDatabaseAsync('finance_management_db');
  });

  it('T1: ReceivablesRepository & PayablesRepository mengelola transaksi piutang dan hutang', async () => {
    await receivablesRepository.add(db, {
      id: 'rec_1',
      documentNumber: 'INV/2026/001',
      debtorId: 'deb_1',
      amount: 1500000,
      lifecycleStatus: 'OPEN'
    });

    await payablesRepository.add(db, {
      id: 'pay_1',
      documentNumber: 'BILL/2026/001',
      creditorId: 'cred_1',
      amount: 750000,
      lifecycleStatus: 'OPEN'
    });

    const rec = await receivablesRepository.findByDocumentNumber(db, 'INV/2026/001');
    expect(rec).toBeDefined();
    expect(rec.amount).toBe(1500000);

    const payList = await payablesRepository.getByCreditorId(db, 'cred_1');
    expect(payList.length).toBe(1);
    expect(payList[0].documentNumber).toBe('BILL/2026/001');
  });

  it('T2: PaymentsRepository & PaymentAllocationsRepository menyaring via modul & Compound Key', async () => {
    await paymentsRepository.add(db, {
      id: 'pmt_1',
      documentNumber: 'PAY/2026/001',
      moduleType: 'RECEIVABLE',
      amount: 500000
    });

    await paymentAllocationsRepository.add(db, {
      id: 'alloc_1',
      paymentId: 'pmt_1',
      moduleType: 'RECEIVABLE',
      transactionId: 'rec_1',
      allocatedAmount: 500000
    });

    const pmt = await paymentsRepository.findByDocumentNumber(db, 'PAY/2026/001');
    expect(pmt.moduleType).toBe('RECEIVABLE');

    const allocs = await paymentAllocationsRepository.getByModuleAndTransaction(db, 'RECEIVABLE', 'rec_1');
    expect(allocs.length).toBe(1);
    expect(allocs[0].allocatedAmount).toBe(500000);
  });

  it('T3: AttachmentsRepository & AuditLogsRepository menyaring via Compound Key', async () => {
    await attachmentsRepository.add(db, {
      id: 'att_1',
      ownerType: 'RECEIVABLE',
      ownerId: 'rec_1',
      fileName: 'kwitansi.pdf'
    });

    await auditLogsRepository.add(db, {
      id: 'log_1',
      userId: 'usr_1',
      entityType: 'RECEIVABLE',
      entityId: 'rec_1',
      action: 'CREATE'
    });

    const attachments = await attachmentsRepository.getByOwner(db, 'RECEIVABLE', 'rec_1');
    expect(attachments.length).toBe(1);
    expect(attachments[0].fileName).toBe('kwitansi.pdf');

    const logs = await auditLogsRepository.getByEntity(db, 'RECEIVABLE', 'rec_1');
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('CREATE');
  });

  it('T4: DocumentSequencesRepository menghasilkan penomoran otomatis bertahap', async () => {
    const seq1 = await documentSequencesRepository.getNextSequence(db, 'INV', '202611');
    expect(seq1).toBe(1);

    const seq2 = await documentSequencesRepository.getNextSequence(db, 'INV', '202611');
    expect(seq2).toBe(2);

    const seqDiffPeriod = await documentSequencesRepository.getNextSequence(db, 'INV', '202612');
    expect(seqDiffPeriod).toBe(1);
  });

  it('T5: AppPreferencesRepository membaca dan menyimpan preferensi lokal', async () => {
    await appPreferencesRepository.setPreference(db, 'sidebar_collapsed', true);
    const pref = await appPreferencesRepository.getPreference(db, 'sidebar_collapsed');
    expect(pref).toBe(true);
  });
});
