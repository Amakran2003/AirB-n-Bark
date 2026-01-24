/**
 * ==================== AUTH ROUTES ====================
 * Routes Express pour l'authentification
 */

import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../middlewares/auth.js';
import { globalRateLimiter, authRateLimiter } from '../../middlewares/security.js';

const router = Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', authRateLimiter, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', authRateLimiter, authController.login);

// ==================== PROTECTED ROUTES ====================

/**
 * @route   GET /api/auth/me
 * @desc    Récupère le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', globalRateLimiter, requireAuth, authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Met à jour le profil utilisateur
 * @access  Private
 */
router.put('/profile', globalRateLimiter, requireAuth, authController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change le mot de passe
 * @access  Private
 */
router.post('/change-password', globalRateLimiter, requireAuth, authController.changePassword);

/**
 * @route   POST /api/auth/become-host
 * @desc    Passe l'utilisateur en mode hôte
 * @access  Private
 */
router.post('/become-host', globalRateLimiter, requireAuth, authController.becomeHost);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion
 * @access  Private
 */
router.post('/logout', globalRateLimiter, requireAuth, authController.logout);

export default router;
