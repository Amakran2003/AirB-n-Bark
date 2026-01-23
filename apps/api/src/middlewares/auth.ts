/**
 * ==================== AUTH MIDDLEWARE ====================
 * Vérification JWT et extraction utilisateur
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    isHost: boolean;
}

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        isHost: boolean;
    };
}

/**
 * Middleware d'authentification obligatoire
 */
export const requireAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Token manquant',
                },
            });
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
            
            // Vérifier que l'utilisateur existe toujours
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isHost: true,
                },
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'Utilisateur non trouvé',
                    },
                });
            }

            req.user = user;
            next();
        } catch {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Token invalide ou expiré',
                },
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware d'authentification optionnelle
 * (pour les routes qui fonctionnent avec ou sans auth)
 */
export const optionalAuth = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader?.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
            
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isHost: true,
                },
            });

            if (user) {
                req.user = user;
            }
        } catch {
            // Token invalide, on continue sans user
        }
        
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware pour vérifier que l'utilisateur est un hôte
 */
export const requireHost = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user?.isHost) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Accès réservé aux hôtes',
            },
        });
    }
    next();
};

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
export const requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Accès réservé aux administrateurs',
            },
        });
    }
    next();
};

/**
 * Génère un token JWT
 */
export const generateToken = (user: { id: string; email: string; role: string; isHost: boolean }): string => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            isHost: user.isHost,
        } as JwtPayload,
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );
};

/**
 * Génère un refresh token
 */
export const generateRefreshToken = (userId: string): string => {
    return jwt.sign(
        { userId, type: 'refresh' },
        config.jwtSecret,
        { expiresIn: config.jwtRefreshExpiresIn } as jwt.SignOptions
    );
};
