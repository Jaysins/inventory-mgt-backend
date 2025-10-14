
export const appConfig = {
    port: parseInt(process.env.PORT as string, 10),
    nodeEnv: process.env.NODE_ENV as string,
    apiPrefix: process.env.API_PREFIX as string,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
    rateLimit: {
        windowMs: 15 * 60 * 1000, 
        max: 3100 
    }
};
