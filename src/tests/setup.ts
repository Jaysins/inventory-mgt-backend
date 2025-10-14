import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); 

jest.mock('../config/redis', () => ({
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../services/exchangeRate.service', () => ({
  __esModule: true,
  default: {
    getRate: jest.fn(async (from: string, to: string) => {
      if (from === 'USD' && to === 'NGN') return 1500;
      if (from === 'EUR' && to === 'USD') return 1.1;
      return 1;
    }),
  },
}));


beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI;
  console.log(`🧩 Connecting to MongoDB:`, mongoUri);

  if (!mongoUri) throw new Error('MONGO_URI not set in .env.test');

  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  console.log('🧹 MongoDB disconnected');
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
