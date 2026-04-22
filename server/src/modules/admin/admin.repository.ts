import { demoAuditLog } from '@/lib/demo-data';

export const adminRepository = {
  listAuditLogs: async () => demoAuditLog,
};
