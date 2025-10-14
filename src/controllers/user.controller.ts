import { Response, NextFunction } from 'express';
import { userService } from '../services';
import { sendSuccess } from '../utils/response';
import { SUCCESS_MESSAGES } from '../utils/constants';
import { AuthRequest } from '../types';

class UserController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      const result = await userService.register({
        email,
        password,
        name,
      });

      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await userService.login({
        email,
        password,
      });

      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const user = await userService.getProfile(userId);

      return sendSuccess(res, user, SUCCESS_MESSAGES.DATA_FETCHED);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { name } = req.body;

      const user = await userService.updateProfile(userId, { name });

      return sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;

      const result = await userService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();