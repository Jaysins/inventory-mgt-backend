import mongoose, { Schema } from 'mongoose';
import { AuditAction, type IAuditLog } from '../types/auditLog.type';


const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true
    },
    resource: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
      }
  },
  {
    timestamps: false,
    toJSON: {
        transform: (_doc, ret: Record<string, any>) => {
            delete ret.__v;
            return ret;
        }
    }
  }
);

// TTL index - auto-delete audit logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
