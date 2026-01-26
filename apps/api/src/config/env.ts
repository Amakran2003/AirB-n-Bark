/**
 * ==================== CONFIGURATION ENVIRONNEMENT ====================
 * Variables d'environnement - TOUTES les valeurs sensibles viennent du .env
 * 
 * ⚠️ En Docker: les variables sont passées via docker-compose.yml
 * ⚠️ En local: créer un .env à la racine du projet
 */

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Database
    databaseUrl: process.env.DATABASE_URL || '',
    
    // JWT - ⚠️ OBLIGATOIRE via variable d'environnement
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    
    // CORS
    corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    
    // Rate limiting (plus permissif en dev)
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 min
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // 1000 requetes/min en dev
    
    // Pagination
    defaultPageSize: 20,
    maxPageSize: 100,
    
    // Upload
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    
    // Feature flags
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',

    // Stripe
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
} as const;

// Validation au démarrage
export function validateConfig() {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}\n` +
            `   → Vérifiez que le .env racine existe et contient ces variables\n` +
            `   → En Docker: vérifiez docker-compose.yml`);
    }
    
    if (config.jwtSecret.length < 32) {
        throw new Error('❌ JWT_SECRET must be at least 32 characters long');
    }
}
