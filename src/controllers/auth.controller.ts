import { Response, NextFunction } from 'express';
import { authService } from '../services';
import { sendSuccess } from '../utils/response';
import { SUCCESS_MESSAGES } from '../utils/constants';
import { AuthRequest } from '../middlewares';

class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await authService.register(
        { email, password, name },
        ipAddress,
        userAgent
      );

      return sendSuccess(res, result, SUCCESS_MESSAGES.USER_REGISTERED, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await authService.login(
        { email, password },
        ipAddress,
        userAgent
      );

      return sendSuccess(res, result, SUCCESS_MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await authService.getUserById(userId);

      return sendSuccess(res, user, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
