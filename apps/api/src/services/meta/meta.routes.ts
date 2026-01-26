/**
 * ==================== META ROUTES ====================
 * Routes publiques utilitaires
 */

import { Router } from 'express';
import * as metaController from './meta.controller.js';
import { globalRateLimiter } from '../../middlewares/security.js';

const router = Router();

/**
 * @route   GET /api/meta/languages
 * @desc    Liste des langues disponibles
 * @access  Public
 */
router.get('/languages', globalRateLimiter, metaController.getLanguages);

export default router;
