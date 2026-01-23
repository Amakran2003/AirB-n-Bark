/**
 * ==================== CONFIGURATION ENVIRONNEMENT ====================
 * Variables d'environnement avec valeurs par défaut sécurisées
 */

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Database
    databaseUrl: process.env.DATABASE_URL || '',
    
    // JWT
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    
    // CORS
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
    
    // Rate limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    
    // Pagination
    defaultPageSize: 20,
    maxPageSize: 100,
    
    // Upload
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    
    // Feature flags
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
} as const;

// Validation au démarrage
export function validateConfig() {
    const required = ['DATABASE_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0 && config.isProd) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    if (config.jwtSecret === 'dev-secret-change-in-production' && config.isProd) {
        throw new Error('JWT_SECRET must be set in production');
    }
}
