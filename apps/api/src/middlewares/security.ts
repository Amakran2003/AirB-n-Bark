/**
 * ==================== MIDDLEWARES DE SÉCURITÉ ====================
 * Validation, sanitization, rate limiting, etc.
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import xss from 'xss';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Middleware de validation - vérifie les erreurs de express-validator
 */
export const validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Exécuter toutes les validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Données invalides',
                details: errors.array().map(err => ({
                    field: 'path' in err ? err.path : 'unknown',
                    message: err.msg,
                })),
            },
        });
    };
};

/**
 * Sanitize une string contre XSS
 */
export const sanitizeString = (value: string): string => {
    if (typeof value !== 'string') return value;
    return xss(value.trim());
};

/**
 * Middleware de sanitization global
 */
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
};

/**
 * Sanitize récursivement un objet
 */
const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                typeof item === 'string' ? sanitizeString(item) : 
                typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
            );
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
};

/**
 * Rate limiter global
 */
export const globalRateLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Trop de requêtes, réessaie plus tard',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter strict pour auth
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives
    message: {
        success: false,
        error: {
            code: 'AUTH_RATE_LIMIT',
            message: 'Trop de tentatives de connexion, réessaie dans 15 minutes',
        },
    },
    skipSuccessfulRequests: true,
});

/**
 * Rate limiter pour création de ressources
 */
export const createRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 20, // 20 créations par heure
    message: {
        success: false,
        error: {
            code: 'CREATE_RATE_LIMIT',
            message: 'Trop de créations, réessaie plus tard',
        },
    },
});

/**
 * Middleware pour logger les requêtes (dev only)
 */
export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
    if (config.isDev) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
};

/**
 * Error handler global
 */
export const errorHandler = (
    err: Error & { status?: number; code?: string },
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error('[Error]', err);

    // Prisma errors
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_ENTRY',
                message: 'Cette entrée existe déjà',
            },
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Ressource non trouvée',
            },
        });
    }

    // Generic error
    const status = err.status || 500;
    const message = config.isProd ? 'Une erreur est survenue' : err.message;

    return res.status(status).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message,
        },
    });
};

/**
 * 404 handler
 */
export const notFoundHandler = (_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route non trouvée',
        },
    });
};
