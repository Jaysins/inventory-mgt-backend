import { User } from '@prisma/client';
import { prisma } from '../config/database';
import { PublicUser } from '../types/user.type';


class UserRepository {
  async create(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<User> {
    return await prisma.user.create({
      data,
    });
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  async updateById(id: string, data: Partial<User>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async findActive(): Promise<PublicUser[]> {
    return await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        password: false,
      },
    });
  }
}

export default new UserRepository();