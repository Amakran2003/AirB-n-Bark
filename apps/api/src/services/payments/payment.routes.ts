/**
 * ==================== PAYMENT ROUTES ====================
 * Routes Express pour l'API paiements
 */

import { Router } from 'express';
import * as controller from './payment.controller.js';

const router = Router();

// POST /api/payments/create-intent - Créer un PaymentIntent
router.post('/create-intent', controller.createIntent);

// GET /api/payments/:id/status - Statut d'un paiement
router.get('/:id/status', controller.getStatus);

export default router;
