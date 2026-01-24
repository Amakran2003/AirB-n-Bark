/**
 * ==================== AUTH SERVICE ====================
 * Logique métier pour l'authentification
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { generateToken, generateRefreshToken } from '../../middlewares/auth.js';
import type { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from './auth.validation.js';

// ==================== TYPES ====================

export interface AuthResult {
    user: {
        id: string;
        email: string;
        name: string;
        avatar: string | null;
        phone: string | null;
        isHost: boolean;
        isVerified: boolean;
        createdAt: Date;
    };
    token: string;
    refreshToken: string;
}

// ==================== SERVICES ====================

/**
 * Inscription d'un nouvel utilisateur
 */
export async function register(data: RegisterInput): Promise<AuthResult> {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
        throw new Error('EMAIL_EXISTS');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
        data: {
            email: data.email.toLowerCase(),
            password: hashedPassword,
            name: data.name,
            isHost: data.isHost ?? false,
            isVerified: false, // TODO: implémenter la vérification email
        },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            phone: true,
            role: true,
            isHost: true,
            isVerified: true,
            createdAt: true,
        },
    });

    // Générer les tokens
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        isHost: user.isHost,
    });
    const refreshToken = generateRefreshToken(user.id);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            phone: user.phone,
            isHost: user.isHost,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
        },
        token,
        refreshToken,
    };
}

/**
 * Connexion d'un utilisateur existant
 */
export async function login(data: LoginInput): Promise<AuthResult> {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        select: {
            id: true,
            email: true,
            password: true,
            name: true,
            avatar: true,
            phone: true,
            role: true,
            isHost: true,
            isVerified: true,
            createdAt: true,
        },
    });

    if (!user || !user.password) {
        throw new Error('INVALID_CREDENTIALS');
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
        throw new Error('INVALID_CREDENTIALS');
    }

    // Mettre à jour lastLoginAt
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });

    // Générer les tokens
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        isHost: user.isHost,
    });
    const refreshToken = generateRefreshToken(user.id);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            phone: user.phone,
            isHost: user.isHost,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
        },
        token,
        refreshToken,
    };
}

/**
 * Récupère le profil de l'utilisateur connecté
 */
export async function getProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            phone: true,
            role: true,
            isHost: true,
            isVerified: true,
            createdAt: true,
            _count: {
                select: {
                    listings: true,
                    bookingsAsGuest: true,
                    reviews: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    return {
        ...user,
        listingsCount: user._count.listings,
        bookingsCount: user._count.bookingsAsGuest,
        reviewsCount: user._count.reviews,
    };
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.avatar && { avatar: data.avatar }),
            ...(data.phone && { phone: data.phone }),
            ...(data.isHost !== undefined && { isHost: data.isHost }),
        },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            phone: true,
            role: true,
            isHost: true,
            isVerified: true,
            createdAt: true,
        },
    });

    return user;
}

/**
 * Change le mot de passe
 */
export async function changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
    });

    if (!user || !user.password) {
        throw new Error('USER_NOT_FOUND');
    }

    // Vérifier l'ancien mot de passe
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValidPassword) {
        throw new Error('INVALID_PASSWORD');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    return true;
}

/**
 * Passe un utilisateur en mode hôte
 */
export async function becomeHost(userId: string) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { isHost: true },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            phone: true,
            role: true,
            isHost: true,
            isVerified: true,
            createdAt: true,
        },
    });

    // Générer un nouveau token avec isHost = true
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        isHost: user.isHost,
    });

    return { user, token };
}
