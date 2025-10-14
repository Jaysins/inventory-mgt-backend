import jwt, { SignOptions } from 'jsonwebtoken';

import { authConfig } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { JwtPayload } from '../types';


export function generateToken(payload: JwtPayload, expiresIn?: string): string {
  const options: SignOptions = {
    // Cast since 'expiresIn' can be string or number
    expiresIn: expiresIn || (authConfig.jwt.expiresIn as any),
  };

  return jwt.sign(payload, authConfig.jwt.secret, options);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, authConfig.jwt.secret) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
}