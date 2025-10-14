import bcrypt from 'bcrypt';
import { authConfig } from '../config';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, authConfig.bcrypt.saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}