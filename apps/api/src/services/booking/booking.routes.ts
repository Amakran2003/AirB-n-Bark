/**
 * ==================== BOOKINGS ROUTES ====================
 * Routes Express pour l'API bookings
 */

import { Router } from 'express';
import * as controller from './booking.controller.js';
import { requireAuth, optionalAuth } from '../../middlewares/auth.js';

const router = Router();

// ==================== GUEST ROUTES ====================

// GET /api/bookings - Mes réservations
router.get('/', requireAuth, controller.getMyBookings);

// POST /api/bookings - Créer une réservation
router.post('/', requireAuth, controller.createBooking);

// POST /api/bookings/quote - Calculer un devis
router.post('/quote', optionalAuth, controller.getQuote);

// GET /api/bookings/availability - Vérifier disponibilité
router.get('/availability', controller.checkAvailability);

// ==================== HOST ROUTES (avant :id) ====================

// GET /api/bookings/host - Réservations reçues
router.get('/host', requireAuth, controller.getHostBookings);

// GET /api/bookings/host/stats - Statistiques
router.get('/host/stats', requireAuth, controller.getHostStats);

// POST /api/bookings/host/:id/confirm - Confirmer une réservation
router.post('/host/:id/confirm', requireAuth, controller.confirmBooking);

// POST /api/bookings/host/:id/reject - Rejeter une réservation
router.post('/host/:id/reject', requireAuth, controller.rejectBooking);

// ==================== ROUTES AVEC :id (après les routes spécifiques) ====================

// GET /api/bookings/:id - Détails d'une réservation
router.get('/:id', requireAuth, controller.getBookingById);

// POST /api/bookings/:id/cancel - Annuler une réservation
router.post('/:id/cancel', requireAuth, controller.cancelBooking);

export default router;
