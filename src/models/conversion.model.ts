import mongoose, { Schema } from 'mongoose';
import { type IConversion } from '../types/conversion.type';


const conversionSchema = new Schema<IConversion>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        fromCurrency: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            length: 3
        },
        toCurrency: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            length: 3
        },
        conversionRate: {
            type: Number,
            required: true
        },
        convertedAmount: {
            type: Number,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret: Record<string, any>) => {
                delete ret.__v;
                return ret;
            }
        }
    }
);

// Compound index for efficient dashboard queries
conversionSchema.index({ userId: 1, timestamp: -1 });
conversionSchema.index({ userId: 1, fromCurrency: 1, toCurrency: 1 });

export const Conversion = mongoose.model<IConversion>('Conversion', conversionSchema);

