import cors from 'cors';
import { appConfig } from '../config';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || appConfig.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
});