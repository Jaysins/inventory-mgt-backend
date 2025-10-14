import { User } from '../models';
import { Types } from 'mongoose';
import type { IUser } from '../types';

class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).select('+password');
  }

  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return await User.findById(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email });
    return count > 0;
  }

  async updateById(id: string | Types.ObjectId, updates: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }
}


export default new UserRepository();
