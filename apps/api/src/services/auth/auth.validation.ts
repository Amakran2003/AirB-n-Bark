/**
 * ==================== AUTH VALIDATION ====================
 * Schémas Zod pour la validation des requêtes auth
 */

import { z } from 'zod';

export const RegisterSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    isHost: z.boolean().optional().default(false),
});

export const LoginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
});

export const UpdateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    avatar: z.string().optional(), // Accepte URL ou base64
    phone: z.string().optional(),
    isHost: z.boolean().optional(),
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
});

export const formatZodErrors = (error: z.ZodError) => {
    return error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
    }));
};

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
