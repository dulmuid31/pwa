{
  id: `audit_${timestamp}_${rand}`,
  userId: string,
  entityType: string,  // 'RECEIVABLE', 'PAYABLE', 'DEBTOR', dll.
  entityId: string,
  action: string,      // 'CREATE', 'UPDATE', 'DELETE', 'VOID'
  details: object,     // Data snapshot atau rincian perubahan
  timestamp: string    // ISO String
}
