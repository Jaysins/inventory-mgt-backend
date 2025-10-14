import { AuditLog } from '../models';
import { Types } from 'mongoose';
import { type IAuditLog, type AuditLogData, AuditAction } from '../types/auditLog.type';

class AuditLogRepository {
  async create(logData: AuditLogData): Promise<IAuditLog> {
    const log = new AuditLog(logData);
    return await log.save();
  }

  async findByUserId(
    userId: string | Types.ObjectId,
    limit: number = 50
  ): Promise<IAuditLog[]> {
    return await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<IAuditLog[]>();
  }

  async findByAction(
    action: AuditAction,
    limit: number = 100
  ): Promise<IAuditLog[]> {
    return await AuditLog.find({ action })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<IAuditLog[]>();
  }

  async findRecent(limit: number = 100): Promise<IAuditLog[]> {
    return await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean<IAuditLog[]>();
  }
}

export default new AuditLogRepository();