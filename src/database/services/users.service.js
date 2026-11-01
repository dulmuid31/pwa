/**
 * Users Service v1.0
 * Pengelola bisnis pengguna dan otentikasi lokal PWA.
 */

import { usersRepository } from '../repositories/users.repository.js';
import { auditLogService } from './audit-log.service.js';
import { DatabaseError, ERROR_CODES } from '../db-errors.js';

export class UsersService {
  /**
   * Mendaftarkan pengguna baru dengan validasi username unik.
   *
   * @param {IDBDatabase} db
   * @param {Object} userData - { id, username, fullName, role }
   * @param {string} currentUserId - User ID eksekutor
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object>} Object user yang tersimpan
   */
  async createUser(db, userData, currentUserId = 'system', externalTx = null) {
    if (!userData || !userData.id || !userData.username) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        'Data user wajib memiliki id dan username.'
      );
    }

    const existingUser = await usersRepository.findByUsername(db, userData.username, externalTx);
    if (existingUser) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        `Username '${userData.username}' sudah digunakan.`
      );
    }

    const now = new Date().toISOString();
    const userRecord = {
      ...userData,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: now,
      updatedAt: now
    };

    await usersRepository.add(db, userRecord, externalTx);

    await auditLogService.logAction(
      db,
      {
        userId: currentUserId,
        entityType: 'USERS',
        entityId: userRecord.id,
        action: 'CREATE',
        details: { username: userRecord.username, role: userRecord.role }
      },
      externalTx
    );

    return userRecord;
  }

  /**
   * Mengubah status aktif pengguna.
   *
   * @param {IDBDatabase} db
   * @param {string} userId
   * @param {boolean} isActive
   * @param {string} currentUserId
   * @param {IDBTransaction} [externalTx]
   * @returns {Promise<Object>}
   */
  async setUserStatus(db, userId, isActive, currentUserId = 'system', externalTx = null) {
    const user = await usersRepository.getById(db, userId, externalTx);
    if (!user) {
      throw new DatabaseError(
        ERROR_CODES.DATABASE_SCHEMA_ERROR,
        `User dengan ID '${userId}' tidak ditemukan.`
      );
    }

    user.isActive = Boolean(isActive);
    user.updatedAt = new Date().toISOString();

    await usersRepository.update(db, user, externalTx);

    await auditLogService.logAction(
      db,
      {
        userId: currentUserId,
        entityType: 'USERS',
        entityId: userId,
        action: 'UPDATE',
        details: { field: 'isActive', newValue: user.isActive }
      },
      externalTx
    );

    return user;
  }
}

export const usersService = new UsersService();
