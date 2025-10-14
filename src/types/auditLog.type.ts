import { Types, Document } from 'mongoose';


export enum AuditAction {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  CONVERSION_CREATED = 'CONVERSION_CREATED',
  RATE_FETCHED = 'RATE_FETCHED'
}
export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  action: AuditAction;
  resource?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}


export interface AuditLogData {
  userId?: string | Types.ObjectId;
  action: AuditAction;
  resource?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

