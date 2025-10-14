import { userRepository } from '../repositories';
import { hashPassword, comparePassword } from '../helpers/encryption';
import { generateToken } from '../helpers/jwt';
import { 
  BadRequestError, 
  UnauthorizedError, 
  ConflictError 
} from '../utils/errors';
import { ERROR_MESSAGES } from '../utils/constants';
import { isValidEmail } from '../helpers/validation';
import { AuditAction } from '../types/auditLog.type';
import auditLogService from './auditLog.service';
import { RegisterData, AuthResponse, LoginData } from '../types/core.type';


class AuthService {
  async register(data: RegisterData, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password, name } = data;

    if (!isValidEmail(email)) {
      throw new BadRequestError('Invalid email format');
    }

    if (password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters');
    }

    const existingUser = await userRepository.existsByEmail(email);
    if (existingUser) {
      throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    const hashedPassword = await hashPassword(password);

    const user = await userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name
    });

    const token = generateToken({
      userId: String(user._id),
      email: user.email
    });

    await auditLogService.log({
      userId: String(user._id),
      action: AuditAction.USER_REGISTERED,
      metadata: { email: user.email },
      ipAddress,
      userAgent
    });

    return {
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name
      },
      token
    };
  }

  async login(data: LoginData, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = data;

    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const token = generateToken({
      userId: String(user._id),
      email: user.email
    });

    await auditLogService.log({
      userId: String(user._id),
      action: AuditAction.USER_LOGIN,
      metadata: { email: user.email },
      ipAddress,
      userAgent
    });

    return {
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name
      },
      token
    };
  }

  async getUserById(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
  }
}

export default new AuthService();
