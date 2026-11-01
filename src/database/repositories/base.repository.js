/**
 * Base Repository Class v1.0
 * Abstraksi dasar CRUD, akses Indeks, dan Transaksi Atomik IndexedDB.
 */

import { STORES } from '../db-config.js';
import { DatabaseError, ERROR_CODES } from '../db-errors.js';

export class BaseRepository {
  /**
   * @param {string} storeName - Nama Object Store resmi dari STORES
   */
  constructor(storeName) {
    if (!storeName || typeof storeName !== 'string') {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Nama storeName wajib berupa string tidak kosong.'
      );
    }

    const validStores = Object.values(STORES);
    if (!validStores.includes(storeName)) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        `Object Store '${storeName}' tidak terdaftar pada STORES resmi.`
      );
    }

    this.storeName = storeName;
  }

  /**
   * Helper internal untuk mendapatkan transaksi atau menggunakan externalTx jika ada.
   */
  _getTransaction(db, mode, externalTx = null) {
    if (externalTx) {
      return { tx: externalTx, isExternal: true };
    }

    if (!db || typeof db.transaction !== 'function') {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_OPEN_FAILED,
        'Instance database tidak valid untuk membuka transaksi.'
      );
    }

    try {
      const tx = db.transaction([this.storeName], mode);
      return { tx, isExternal: false };
    } catch (err) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_OPEN_FAILED,
        `Gagal membuka transaksi '${mode}' pada store '${this.storeName}'.`,
        err
      );
    }
  }

  /**
   * Mengambil 1 record berdasarkan Primary Key.
   *
   * @param {IDBDatabase} db - Instance database aktif
   * @param {string|number} id - Primary Key dari record
   * @param {IDBTransaction} [externalTx] - Transaksi opsional
   * @returns {Promise<Object|null>}
   */
  async getById(db, id, externalTx = null) {
    if (id === undefined || id === null || id === '') {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Parameter id wajib diisi.'
      );
    }

    const { tx, isExternal } = this._getTransaction(db, 'readonly', externalTx);

    return new Promise((resolve, reject) => {
      let resultVal = null;
      let explicitError = null;

      try {
        const store = tx.objectStore(this.storeName);
        const req = store.get(id);

        req.onsuccess = (e) => {
          resultVal = e.target.result || null;
        };

        req.onerror = (e) => {
          explicitError = new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Gagal membaca record id '${id}' dari store '${this.storeName}'.`,
            e.target.error
          );
        };
      } catch (err) {
        explicitError = new DatabaseError(
          ERROR_CODES.DATABASE_SCHEMA_ERROR,
          `Exception saat membaca record id '${id}'.`,
          err
        );
      }

      if (isExternal) {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(resultVal);
        }
        return;
      }

      tx.oncomplete = () => {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(resultVal);
        }
      };

      tx.onabort = () => {
        reject(
          explicitError ||
          new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Transaksi getById pada store '${this.storeName}' dibatalkan.`,
            tx.error
          )
        );
      };
    });
  }

  /**
   * Mengambil seluruh record dari Object Store.
   *
   * @param {IDBDatabase} db - Instance database aktif
   * @param {Object} [options] - Opsi kueri ({ limit, direction })
   * @param {IDBTransaction} [externalTx] - Transaksi opsional
   * @returns {Promise<Array<Object>>}
   */
  async getAll(db, options = {}, externalTx = null) {
    const { limit, direction = 'next' } = options;
    const { tx, isExternal } = this._getTransaction(db, 'readonly', externalTx);

    return new Promise((resolve, reject) => {
      const records = [];
      let explicitError = null;

      try {
        const store = tx.objectStore(this.storeName);
        const req = store.openCursor(null, direction);

        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            records.push(cursor.value);
            if (limit && Number.isSafeInteger(limit) && records.length >= limit) {
              return;
            }
            cursor.continue();
          }
        };

        req.onerror = (e) => {
          explicitError = new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Gagal mengambil seluruh record dari store '${this.storeName}'.`,
            e.target.error
          );
        };
      } catch (err) {
        explicitError = new DatabaseError(
          ERROR_CODES.DATABASE_SCHEMA_ERROR,
          `Exception saat mengambil seluruh record.`,
          err
        );
      }

      if (isExternal) {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(records);
        }
        return;
      }

      tx.oncomplete = () => {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(records);
        }
      };

      tx.onabort = () => {
        reject(
          explicitError ||
          new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Transaksi getAll pada store '${this.storeName}' dibatalkan.`,
            tx.error
          )
        );
      };
    });
  }

  /**
   * Mengambil record berdasarkan Indeks.
   *
   * @param {IDBDatabase} db - Instance database aktif
   * @param {string} indexName - Nama indeks resmi
   * @param {any|IDBKeyRange} keyOrRange - Nilai kunci atau IDBKeyRange
   * @param {Object} [options] - Opsi kueri ({ limit, direction })
   * @param {IDBTransaction} [externalTx] - Transaksi opsional
   * @returns {Promise<Array<Object>>}
   */
  async getByIndex(db, indexName, keyOrRange, options = {}, externalTx = null) {
    if (!indexName || typeof indexName !== 'string') {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Parameter indexName wajib berupa string.'
      );
    }

    if (keyOrRange === undefined || keyOrRange === null) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Parameter keyOrRange wajib diisi.'
      );
    }

    const { limit, direction = 'next' } = options;
    const { tx, isExternal } = this._getTransaction(db, 'readonly', externalTx);

    return new Promise((resolve, reject) => {
      const records = [];
      let explicitError = null;

      try {
        const store = tx.objectStore(this.storeName);
        if (!store.indexNames.contains(indexName)) {
          explicitError = new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Indeks '${indexName}' tidak ditemukan pada store '${this.storeName}'.`
          );
          if (!isExternal) { try { tx.abort(); } catch (_) {} }
          return;
        }

        const index = store.index(indexName);
        const req = index.openCursor(keyOrRange, direction);

        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            records.push(cursor.value);
            if (limit && Number.isSafeInteger(limit) && records.length >= limit) {
              return;
            }
            cursor.continue();
          }
        };

        req.onerror = (e) => {
          explicitError = new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Gagal membaca dari indeks '${indexName}'.`,
            e.target.error
          );
        };
      } catch (err) {
        explicitError = new DatabaseError(
          ERROR_CODES.DATABASE_SCHEMA_ERROR,
          `Exception saat membaca dari indeks '${indexName}'.`,
          err
        );
      }

      if (isExternal) {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(records);
        }
        return;
      }

      tx.oncomplete = () => {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(records);
        }
      };

      tx.onabort = () => {
        reject(
          explicitError ||
          new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Transaksi getByIndex '${indexName}' pada store '${this.storeName}' dibatalkan.`,
            tx.error
          )
        );
      };
    });
  }

  /**
   * Menambahkan 1 record baru ke Object Store.
   *
   * @param {IDBDatabase} db - Instance database aktif
   * @param {Object} item - Record data baru
   * @param {IDBTransaction} [externalTx] - Transaksi opsional
   * @returns {Promise<string|number>} Primary key dari record yang baru ditambahkan
   */
  async add(db, item, externalTx = null) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Data item wajib berupa object.'
      );
    }

    const { tx, isExternal } = this._getTransaction(db, 'readwrite', externalTx);

    return new Promise((resolve, reject) => {
      let generatedKey = null;
      let explicitError = null;

      try {
        const store = tx.objectStore(this.storeName);
        const req = store.add(item);

        req.onsuccess = (e) => {
          generatedKey = e.target.result;
        };

        req.onerror = (e) => {
          explicitError = new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Gagal menambah item ke store '${this.storeName}': ${e.target.error?.message || 'Error'}`,
            e.target.error
          );
        };
      } catch (err) {
        explicitError = new DatabaseError(
          ERROR_CODES.DATABASE_SCHEMA_ERROR,
          `Exception saat menambah item ke store '${this.storeName}'.`,
          err
        );
      }

      if (isExternal) {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(generatedKey);
        }
        return;
      }

      tx.oncomplete = () => {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(generatedKey);
        }
      };

      tx.onabort = () => {
        reject(
          explicitError ||
          new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Transaksi add pada store '${this.storeName}' dibatalkan.`,
            tx.error
          )
        );
      };
    });
  }

  /**
   * Memperbarui record yang ada atau memasukkan record baru jika belum ada (Upsert).
   *
   * @param {IDBDatabase} db - Instance database aktif
   * @param {Object} item - Record data yang akan diperbarui
   * @param {IDBTransaction} [externalTx] - Transaksi opsional
   * @returns {Promise<string|number>}
   */
  async update(db, item, externalTx = null) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Data item wajib berupa object.'
      );
    }

    const { tx, isExternal } = this._getTransaction(db, 'readwrite', externalTx);

    return new Promise((resolve, reject) => {
      let resultKey = null;
      let explicitError = null;

      try {
        const store = tx.objectStore(this.storeName);
        const req = store.put(item);

        req.onsuccess = (e) => {
          resultKey = e.target.result;
        };

        req.onerror = (e) => {
          explicitError = new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Gagal memperbarui item pada store '${this.storeName}'.`,
            e.target.error
          );
        };
      } catch (err) {
        explicitError = new DatabaseError(
          ERROR_CODES.DATABASE_SCHEMA_ERROR,
          `Exception saat memperbarui item pada store '${this.storeName}'.`,
          err
        );
      }

      if (isExternal) {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(resultKey);
        }
        return;
      }

      tx.oncomplete = () => {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(resultKey);
        }
      };

      tx.onabort = () => {
        reject(
          explicitError ||
          new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Transaksi update pada store '${this.storeName}' dibatalkan.`,
            tx.error
          )
        );
      };
    });
  }

  /**
   * Menghapus 1 record berdasarkan Primary Key.
   *
   * @param {IDBDatabase} db - Instance database aktif
   * @param {string|number} id - Primary Key record yang akan dihapus
   * @param {IDBTransaction} [externalTx] - Transaksi opsional
   * @returns {Promise<boolean>}
   */
  async delete(db, id, externalTx = null) {
    if (id === undefined || id === null || id === '') {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Parameter id wajib diisi untuk operasi delete.'
      );
    }

    const { tx, isExternal } = this._getTransaction(db, 'readwrite', externalTx);

    return new Promise((resolve, reject) => {
      let explicitError = null;

      try {
        const store = tx.objectStore(this.storeName);
        const req = store.delete(id);

        req.onerror = (e) => {
          explicitError = new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Gagal menghapus record id '${id}' dari store '${this.storeName}'.`,
            e.target.error
          );
        };
      } catch (err) {
        explicitError = new DatabaseError(
          ERROR_CODES.DATABASE_SCHEMA_ERROR,
          `Exception saat menghapus record id '${id}'.`,
          err
        );
      }

      if (isExternal) {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(true);
        }
        return;
      }

      tx.oncomplete = () => {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(true);
        }
      };

      tx.onabort = () => {
        reject(
          explicitError ||
          new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Transaksi delete pada store '${this.storeName}' dibatalkan.`,
            tx.error
          )
        );
      };
    });
  }

  /**
   * Operasi simpan massal (Bulk Put/Upsert) di dalam 1 Transaksi Atomik.
   *
   * @param {IDBDatabase} db - Instance database aktif
   * @param {Array<Object>} items - Array record yang akan disimpan
   * @param {IDBTransaction} [externalTx] - Transaksi opsional
   * @returns {Promise<number>} Jumlah record yang berhasil disimpan
   */
  async bulkPut(db, items, externalTx = null) {
    if (!Array.isArray(items)) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Parameter items pada bulkPut wajib berupa Array.'
      );
    }

    if (items.length === 0) {
      return 0;
    }

    const { tx, isExternal } = this._getTransaction(db, 'readwrite', externalTx);

    return new Promise((resolve, reject) => {
      let successCount = 0;
      let explicitError = null;

      try {
        const store = tx.objectStore(this.storeName);

        for (const item of items) {
          if (!item || typeof item !== 'object') {
            explicitError = new DatabaseError(
              ERROR_CODES.DATABASE_SCHEMA_ERROR,
              'Elemen di dalam items bulkPut mengandung data non-object.'
            );
            if (!isExternal) { try { tx.abort(); } catch (_) {} }
            break;
          }

          const req = store.put(item);

          req.onsuccess = () => {
            successCount++;
          };

          req.onerror = (e) => {
            explicitError = new DatabaseError(
              ERROR_CODES.DATABASE_SCHEMA_ERROR,
              `Gagal mengeksekusi bulkPut item pada store '${this.storeName}'.`,
              e.target.error
            );
          };
        }
      } catch (err) {
        explicitError = new DatabaseError(
          ERROR_CODES.DATABASE_SCHEMA_ERROR,
          `Exception saat mengeksekusi bulkPut pada store '${this.storeName}'.`,
          err
        );
      }

      if (isExternal) {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(successCount);
        }
        return;
      }

      tx.oncomplete = () => {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(successCount);
        }
      };

      tx.onabort = () => {
        reject(
          explicitError ||
          new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Transaksi bulkPut pada store '${this.storeName}' dibatalkan (rollback atomik).`,
            tx.error
          )
        );
      };
    });
  }

  /**
   * Menghitung total record di dalam Object Store atau Indeks.
   *
   * @param {IDBDatabase} db - Instance database aktif
   * @param {string} [indexName] - Nama indeks opsional
   * @param {any|IDBKeyRange} [keyOrRange] - Range kunci opsional
   * @param {IDBTransaction} [externalTx] - Transaksi opsional
   * @returns {Promise<number>} Total jumlah record
   */
  async count(db, indexName = null, keyOrRange = null, externalTx = null) {
    const { tx, isExternal } = this._getTransaction(db, 'readonly', externalTx);

    return new Promise((resolve, reject) => {
      let countVal = 0;
      let explicitError = null;

      try {
        const store = tx.objectStore(this.storeName);
        let targetStoreOrIndex = store;

        if (indexName) {
          if (!store.indexNames.contains(indexName)) {
            explicitError = new DatabaseError(
              ERROR_CODES.DATABASE_SCHEMA_ERROR,
              `Indeks '${indexName}' tidak ditemukan pada store '${this.storeName}'.`
            );
            if (!isExternal) { try { tx.abort(); } catch (_) {} }
            return;
          }
          targetStoreOrIndex = store.index(indexName);
        }

        const req = keyOrRange !== null && keyOrRange !== undefined
          ? targetStoreOrIndex.count(keyOrRange)
          : targetStoreOrIndex.count();

        req.onsuccess = (e) => {
          countVal = e.target.result || 0;
        };

        req.onerror = (e) => {
          explicitError = new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Gagal menghitung jumlah record pada store '${this.storeName}'.`,
            e.target.error
          );
        };
      } catch (err) {
        explicitError = new DatabaseError(
          ERROR_CODES.DATABASE_SCHEMA_ERROR,
          `Exception saat menghitung jumlah record.`,
          err
        );
      }

      if (isExternal) {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(countVal);
        }
        return;
      }

      tx.oncomplete = () => {
        if (explicitError) {
          reject(explicitError);
        } else {
          resolve(countVal);
        }
      };

      tx.onabort = () => {
        reject(
          explicitError ||
          new DatabaseError(
            ERROR_CODES.DATABASE_SCHEMA_ERROR,
            `Transaksi count pada store '${this.storeName}' dibatalkan.`,
            tx.error
          )
        );
      };
    });
  }
}
