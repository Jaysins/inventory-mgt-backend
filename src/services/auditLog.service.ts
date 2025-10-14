import { auditLogRepository } from '../repositories';
import { AuditLogData } from '../types/auditLog.type';
import { logger } from '../utils/logger';


class AuditLogService {
  async log(data: AuditLogData): Promise<void> {
    try {
      await auditLogRepository.create(data);
      logger.info('Audit log created', { action: data.action, userId: data.userId });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }

  async getUserLogs(userId: string, limit: number = 50) {
    return await auditLogRepository.findByUserId(userId, limit);
  }

  async getRecentLogs(limit: number = 100) {
    return await auditLogRepository.findRecent(limit);
  }
}

export default new AuditLogService();
