import { Response, NextFunction } from 'express';
import { auditLogService } from '../services';
import { sendSuccess } from '../utils/response';
import { SUCCESS_MESSAGES } from '../utils/constants';
import { getPaginationParams } from '../utils/pagination';
import { AuthRequest } from '../middlewares';

class AuditLogController {
  async getUserLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { limit } = getPaginationParams(req.query);

      const logs = await auditLogService.getUserLogs(userId, limit);

      return sendSuccess(res, logs, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async getRecentLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { limit } = getPaginationParams(req.query);

      const logs = await auditLogService.getRecentLogs(limit);

      return sendSuccess(res, logs, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuditLogController();
