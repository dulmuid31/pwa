/**
 * Public Repositories Registry & Exports v1.0
 */

export { BaseRepository } from './base.repository.js';

// Core & Master Data Repositories
export { AppMetaRepository, appMetaRepository } from './app-meta.repository.js';
export { SettingsRepository, settingsRepository } from './settings.repository.js';
export { UsersRepository, usersRepository } from './users.repository.js';
export { DebtorsRepository, debtorsRepository } from './debtors.repository.js';
export { CreditorsRepository, creditorsRepository } from './creditors.repository.js';
export { CategoriesRepository, categoriesRepository } from './categories.repository.js';
export { PaymentMethodsRepository, paymentMethodsRepository } from './payment-methods.repository.js';

// Transactional & System Repositories
export { ReceivablesRepository, receivablesRepository } from './receivables.repository.js';
export { PayablesRepository, payablesRepository } from './payables.repository.js';
export { PaymentsRepository, paymentsRepository } from './payments.repository.js';
export { PaymentAllocationsRepository, paymentAllocationsRepository } from './payment-allocations.repository.js';
export { AttachmentsRepository, attachmentsRepository } from './attachments.repository.js';
export { AuditLogsRepository, auditLogsRepository } from './audit-logs.repository.js';
export { DocumentSequencesRepository, documentSequencesRepository } from './document-sequences.repository.js';
export { BackupRecordsRepository, backupRecordsRepository } from './backup-records.repository.js';
export { LocalSnapshotsRepository, localSnapshotsRepository } from './local-snapshots.repository.js';
export { AppPreferencesRepository, appPreferencesRepository } from './app-preferences.repository.js';
