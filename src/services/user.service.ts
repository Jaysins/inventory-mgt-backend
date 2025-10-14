import { userRepository } from '../repositories';
import { hashPassword, comparePassword } from '../helpers/encryption';
import { generateToken } from '../helpers/jwt';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { ERROR_MESSAGES } from '../utils/constants';
import { isValidEmail } from '../helpers/validation';
import { AuthResponse, RegisterData, LoginData } from '../types';

class UserService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, name } = data;

    if (!isValidEmail(email)) {
      throw new BadRequestError('Invalid email format');
    }

    if (password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters');
    }

    const existingUser = await userRepository.existsByEmail(email.toLowerCase());
    if (existingUser) {
      throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS || 'Email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const user = await userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
    });

    const token = generateToken({
      userId: user.id, 
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    const user = await userRepository.findByEmailWithPassword(email.toLowerCase());
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS || 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive. Please contact support.');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS || 'Invalid credentials');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async getUserById(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_NOT_FOUND || 'User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getProfile(userId: string) {
    return await this.getUserById(userId);
  }

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const updatedUser = await userRepository.updateById(userId, {
      name: data.name || user.name,
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);

    await userRepository.updateById(userId, {
      password: hashedPassword,
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}

export default new UserService();