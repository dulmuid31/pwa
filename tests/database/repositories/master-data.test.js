import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { initDB, closeDB } from '../../../src/database/db.js';
import {
  appMetaRepository,
  settingsRepository,
  usersRepository,
  debtorsRepository,
  creditorsRepository,
  categoriesRepository,
  paymentMethodsRepository
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

describe('Core & Master Data Repositories Tests (Step 3.2)', () => {
  let db;

  beforeEach(async () => {
    db = await initDB();
  });

  afterEach(async () => {
    closeDB();
    await deleteDatabaseAsync('finance_management_db');
  });

  it('M1: AppMetaRepository & SettingsRepository membaca dan menulis konfigurasi', async () => {
    await appMetaRepository.setSchemaVersion(db, 2);
    const ver = await appMetaRepository.getSchemaVersion(db);
    expect(ver).toBe(2);

    await settingsRepository.setSetting(db, 'theme_mode', 'dark');
    const theme = await settingsRepository.getSetting(db, 'theme_mode');
    expect(theme).toBe('dark');
  });

  it('M2: UsersRepository mencari berdasarkan username dan menyaring pengguna aktif', async () => {
    await usersRepository.add(db, { id: 'u1', username: 'bang_dul', isActive: true });
    await usersRepository.add(db, { id: 'u2', username: 'guest_user', isActive: false });

    const user = await usersRepository.findByUsername(db, 'bang_dul');
    expect(user).toBeDefined();
    expect(user.id).toBe('u1');

    const activeUsers = await usersRepository.getActiveUsers(db);
    expect(activeUsers.length).toBe(1);
    expect(activeUsers[0].username).toBe('bang_dul');
  });

  it('M3: DebtorsRepository & CreditorsRepository mencari via kode unik dan status aktif', async () => {
    await debtorsRepository.add(db, { id: 'd1', debtorCode: 'DEB-001', name: 'PT Sejahtera', isActive: true });
    await creditorsRepository.add(db, { id: 'c1', creditorCode: 'CRE-001', name: 'CV Makmur', isActive: true });

    const debtor = await debtorsRepository.findByCode(db, 'DEB-001');
    expect(debtor.name).toBe('PT Sejahtera');

    const creditor = await creditorsRepository.findByCode(db, 'CRE-001');
    expect(creditor.name).toBe('CV Makmur');
  });

  it('M4: CategoriesRepository menyaring via moduleType dan Compound Key [moduleType, categoryCode]', async () => {
    await categoriesRepository.add(db, { id: 'cat1', moduleType: 'RECEIVABLE', categoryCode: 'REV_SERVICE', name: 'Jasa Inap' });
    await categoriesRepository.add(db, { id: 'cat2', moduleType: 'PAYABLE', categoryCode: 'EXP_MEDICINE', name: 'Obat-obatan' });

    const recCategories = await categoriesRepository.getByModuleType(db, 'RECEIVABLE');
    expect(recCategories.length).toBe(1);

    const exactCat = await categoriesRepository.findByModuleAndCode(db, 'RECEIVABLE', 'REV_SERVICE');
    expect(exactCat).toBeDefined();
    expect(exactCat.name).toBe('Jasa Inap');
  });

  it('M5: PaymentMethodsRepository mencari via kode dan status aktif', async () => {
    await paymentMethodsRepository.add(db, { id: 'pm1', code: 'CASH', name: 'Tunai Kasir', isActive: true });
    await paymentMethodsRepository.add(db, { id: 'pm2', code: 'TRANSFER', name: 'Transfer Bank', isActive: true });

    const method = await paymentMethodsRepository.findByCode(db, 'TRANSFER');
    expect(method.name).toBe('Transfer Bank');

    const activeMethods = await paymentMethodsRepository.getActiveMethods(db);
    expect(activeMethods.length).toBe(2);
  });
});
