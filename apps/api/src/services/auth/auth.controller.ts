/**
 * ==================== AUTH CONTROLLER ====================
 * Handlers Express pour les endpoints auth
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import * as authService from './auth.service.js';
import {
    RegisterSchema,
    LoginSchema,
    UpdateProfileSchema,
    ChangePasswordSchema,
    formatZodErrors,
} from './auth.validation.js';

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
export async function register(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const parseResult = RegisterSchema.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: formatZodErrors(parseResult.error),
                },
            });
        }

        const result = await authService.register(parseResult.data);

        return res.status(201).json({
            success: true,
            data: result,
            message: 'Inscription réussie',
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'EMAIL_EXISTS',
                    message: 'Cet email est déjà utilisé',
                },
            });
        }
        next(error);
    }
}

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
export async function login(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const parseResult = LoginSchema.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: formatZodErrors(parseResult.error),
                },
            });
        }

        const result = await authService.login(parseResult.data);

        return res.json({
            success: true,
            data: result,
            message: 'Connexion réussie',
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Email ou mot de passe incorrect',
                },
            });
        }
        next(error);
    }
}

/**
 * GET /api/auth/me
 * Récupère le profil de l'utilisateur connecté
 */
export async function getMe(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Non authentifié',
                },
            });
        }

        const profile = await authService.getProfile(req.user.id);

        return res.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'Utilisateur non trouvé',
                },
            });
        }
        next(error);
    }
}

/**
 * PUT /api/auth/profile
 * Met à jour le profil utilisateur
 */
export async function updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Non authentifié',
                },
            });
        }

        const parseResult = UpdateProfileSchema.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: formatZodErrors(parseResult.error),
                },
            });
        }

        const user = await authService.updateProfile(req.user.id, parseResult.data);

        return res.json({
            success: true,
            data: user,
            message: 'Profil mis à jour',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/change-password
 * Change le mot de passe
 */
export async function changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Non authentifié',
                },
            });
        }

        const parseResult = ChangePasswordSchema.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: formatZodErrors(parseResult.error),
                },
            });
        }

        await authService.changePassword(req.user.id, parseResult.data);

        return res.json({
            success: true,
            message: 'Mot de passe modifié',
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_PASSWORD') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PASSWORD',
                    message: 'Mot de passe actuel incorrect',
                },
            });
        }
        next(error);
    }
}

/**
 * POST /api/auth/become-host
 * Passe l'utilisateur en mode hôte
 */
export async function becomeHost(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Non authentifié',
                },
            });
        }

        const result = await authService.becomeHost(req.user.id);

        return res.json({
            success: true,
            data: result,
            message: 'Vous êtes maintenant hôte !',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/auth/language
 * Met à jour la langue préférée de l'utilisateur
 */
export async function updateLanguage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Non authentifié',
                },
            });
        }

        const { language } = req.body;

        if (!language || typeof language !== 'string') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_LANGUAGE',
                    message: 'Langue non supportee.',
                },
            });
        }

        const result = await authService.updateLanguage(req.user.id, language);

        return res.json({
            success: true,
            data: result,
            message: 'Langue mise à jour',
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_LANGUAGE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_LANGUAGE',
                    message: 'Langue non supportee.',
                },
            });
        }
        next(error);
    }
}

/**
 * POST /api/auth/logout
 * Déconnexion (côté client, invalider le token)
 */
export async function logout(
    _req: AuthenticatedRequest,
    res: Response
) {
    // Le logout est géré côté client en supprimant le token
    // On pourrait aussi implémenter une blacklist de tokens ici
    return res.json({
        success: true,
        message: 'Déconnexion réussie',
    });
}
