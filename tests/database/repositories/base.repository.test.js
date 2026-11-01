import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { initDB, closeDB } from '../../../src/database/db.js';
import { STORES, INDEXES } from '../../../src/database/db-config.js';
import { BaseRepository } from '../../../src/database/repositories/base.repository.js';
import { DatabaseError } from '../../../src/database/db-errors.js';

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

describe('BaseRepository Generic CRUD & Transaction Layer Tests (Step 3.1)', () => {
  let db;
  let userRepo;
  let categoryRepo;

  beforeEach(async () => {
    db = await initDB();
    userRepo = new BaseRepository(STORES.USERS);
    categoryRepo = new BaseRepository(STORES.CATEGORIES);
  });

  afterEach(async () => {
    closeDB();
    await deleteDatabaseAsync('finance_management_db');
  });

  it('R1: add() dan getById() mengambil record dengan akurat', async () => {
    const newUser = { id: 'usr_1', username: 'bang_dul', isActive: true };
    const addedKey = await userRepo.add(db, newUser);
    expect(addedKey).toBe('usr_1');

    const fetchedUser = await userRepo.getById(db, 'usr_1');
    expect(fetchedUser).toBeDefined();
    expect(fetchedUser.username).toBe('bang_dul');
    expect(fetchedUser.isActive).toBe(true);
  });

  it('R2: update() memperbarui record yang ada secara tepat (Upsert)', async () => {
    const user = { id: 'usr_2', username: 'john_doe', isActive: true };
    await userRepo.add(db, user);

    const updatedUser = { id: 'usr_2', username: 'john_doe_updated', isActive: false };
    await userRepo.update(db, updatedUser);

    const fetchedUser = await userRepo.getById(db, 'usr_2');
    expect(fetchedUser.username).toBe('john_doe_updated');
    expect(fetchedUser.isActive).toBe(false);
  });

  it('R3: delete() menghapus record dan getById() mengembalikan null', async () => {
    const user = { id: 'usr_3', username: 'to_be_deleted', isActive: true };
    await userRepo.add(db, user);

    const isDeleted = await userRepo.delete(db, 'usr_3');
    expect(isDeleted).toBe(true);

    const fetchedUser = await userRepo.getById(db, 'usr_3');
    expect(fetchedUser).toBeNull();
  });

  it('R4: getAll() dan count() mendukung pembatasan limit dan pengurutan cursor', async () => {
    const users = [
      { id: 'usr_a', username: 'user_a', isActive: true },
      { id: 'usr_b', username: 'user_b', isActive: true },
      { id: 'usr_c', username: 'user_c', isActive: false }
    ];

    await userRepo.bulkPut(db, users);

    const totalCount = await userRepo.count(db);
    expect(totalCount).toBe(3);

    const limitedUsers = await userRepo.getAll(db, { limit: 2 });
    expect(limitedUsers.length).toBe(2);
    expect(limitedUsers[0].id).toBe('usr_a');
    expect(limitedUsers[1].id).toBe('usr_b');
  });

  it('R5: getByIndex() berhasil menyaring data via Indeks tunggal dan Compound Key', async () => {
    const categories = [
      { id: 'cat_1', moduleType: 'RECEIVABLE', categoryCode: 'REV', isActive: true },
      { id: 'cat_2', moduleType: 'PAYABLE', categoryCode: 'EXP', isActive: true },
      { id: 'cat_3', moduleType: 'RECEIVABLE', categoryCode: 'OTH', isActive: false }
    ];

    await categoryRepo.bulkPut(db, categories);

    // Filter via Index Tunggal (moduleType)
    const receivables = await categoryRepo.getByIndex(
      db,
      INDEXES.CATEGORIES.MODULE_TYPE.name,
      'RECEIVABLE'
    );
    expect(receivables.length).toBe(2);

    // Filter via Compound Index ([moduleType, categoryCode])
    const exactCategory = await categoryRepo.getByIndex(
      db,
      INDEXES.CATEGORIES.MODULE_CATEGORY.name,
      ['PAYABLE', 'EXP']
    );
    expect(exactCategory.length).toBe(1);
    expect(exactCategory[0].id).toBe('cat_2');
  });

  it('R6: bulkPut() menyimpan banyak record dalam 1 transaksi atomik', async () => {
    const users = Array.from({ length: 10 }, (_, i) => ({
      id: `bulk_usr_${i}`,
      username: `bulk_user_${i}`,
      isActive: true
    }));

    const count = await userRepo.bulkPut(db, users);
    expect(count).toBe(10);

    const total = await userRepo.count(db);
    expect(total).toBe(10);
  });

  it('R7: ROLLBACK ATOMIK: Jika salah satu elemen pada bulkPut() gagal, seluruh transaksi di-rollback', async () => {
    // Tambahkan user1 dengan username 'duplicate_uname' (Unique Index)
    await userRepo.add(db, { id: 'usr_exist', username: 'duplicate_uname', isActive: true });

    // Coba bulkPut dengan item ke-2 memiliki username duplikat yang melanggar constraint Unique Index
    const invalidBatch = [
      { id: 'usr_new_1', username: 'valid_uname_1', isActive: true },
      { id: 'usr_new_2', username: 'duplicate_uname', isActive: true } // Akan memicu error unique constraint
    ];

    await expect(userRepo.bulkPut(db, invalidBatch)).rejects.toThrow(DatabaseError);

    // Verifikasi bahwa item ke-1 ('usr_new_1') TIDAK TERSIMPAN (Rollback Atomik Utuh)
    const checkUsr1 = await userRepo.getById(db, 'usr_new_1');
    expect(checkUsr1).toBeNull();
  });

  it('R8: External Transaction Injection: Menjalankan beberapa operasi di dalam 1 externalTx yang sama', async () => {
    const tx = db.transaction([STORES.USERS, STORES.CATEGORIES], 'readwrite');

    // Eksekusi add pada 2 repository berbeda menggunakan 1 externalTx
    await userRepo.add(db, { id: 'usr_tx_1', username: 'tx_user', isActive: true }, tx);
    await categoryRepo.add(db, { id: 'cat_tx_1', moduleType: 'INCOME', categoryCode: 'SALES', isActive: true }, tx);

    // Tunggu transaksi eksternal selesai
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });

    // Verifikasi kedua data tersimpan setelah transaksi external complete
    const usr = await userRepo.getById(db, 'usr_tx_1');
    const cat = await categoryRepo.getById(db, 'cat_tx_1');

    expect(usr).toBeDefined();
    expect(usr.username).toBe('tx_user');
    expect(cat).toBeDefined();
    expect(cat.categoryCode).toBe('SALES');
  });
});
