import { adminRepository } from './admin.repository';

export const adminService = {
  listAuditLogs: () => adminRepository.listAuditLogs(),
};
