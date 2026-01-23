/**
 * ==================== BOOKINGS CONTROLLER ====================
 * Handlers Express pour les endpoints bookings
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import { 
    CreateBookingSchema, 
    BookingsQuerySchema, 
    QuoteRequestSchema,
    RejectBookingSchema,
    formatZodErrors,
} from './booking.validation.js';
import * as bookingService from './booking.service.js';

// ==================== GUEST ENDPOINTS ====================

/**
 * GET /api/bookings
 * Récupère les réservations du guest connecté
 */
export async function getMyBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Non authentifié' },
            });
        }

        const parseResult = BookingsQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: { 
                    code: 'VALIDATION_ERROR', 
                    message: 'Paramètres invalides',
                    details: formatZodErrors(parseResult.error),
                },
            });
        }

        const result = await bookingService.getGuestBookings(userId, parseResult.data);

        return res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/bookings/:id
 * Récupère une réservation par son ID
 */
export async function getBookingById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Non authentifié' },
            });
        }

        const { id } = req.params;

        const booking = await bookingService.getBookingById(id, userId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Réservation non trouvée' },
            });
        }

        return res.json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/bookings
 * Crée une nouvelle réservation
 */
export async function createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Non authentifié' },
            });
        }

        const parseResult = CreateBookingSchema.safeParse(req.body);
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

        const booking = await bookingService.createBooking(userId, parseResult.data);

        return res.status(201).json({
            success: true,
            data: booking,
            message: 'Réservation créée avec succès',
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('non disponibles') || error.message.includes('déjà réservées')) {
                return res.status(409).json({
                    success: false,
                    error: { code: 'CONFLICT', message: error.message },
                });
            }
            if (error.message.includes('non trouvé')) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: error.message },
                });
            }
            if (error.message.includes('propre listing') || error.message.includes('maximum')) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'BAD_REQUEST', message: error.message },
                });
            }
        }
        next(error);
    }
}

/**
 * POST /api/bookings/:id/cancel
 * Annule une réservation
 */
export async function cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Non authentifié' },
            });
        }

        const { id } = req.params;

        const result = await bookingService.cancelBooking(id, userId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Réservation non trouvée ou déjà annulée' },
            });
        }

        return res.json({
            success: true,
            data: result,
            message: 'Réservation annulée',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/bookings/quote
 * Calcule un devis pour une réservation
 */
export async function getQuote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const parseResult = QuoteRequestSchema.safeParse(req.body);
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

        const quote = await bookingService.getQuote(parseResult.data);

        if (!quote) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Listing non trouvé ou capacité dépassée' },
            });
        }

        return res.json({ success: true, data: quote });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/bookings/availability
 * Vérifie la disponibilité d'un listing
 */
export async function checkAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { listingId, startDate, endDate } = req.query;

        if (!listingId || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'Paramètres manquants: listingId, startDate, endDate' },
            });
        }

        const result = await bookingService.checkAvailability(
            listingId as string,
            startDate as string,
            endDate as string
        );

        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}

// ==================== HOST ENDPOINTS ====================

/**
 * GET /api/bookings/host
 * Récupère les réservations reçues par l'hôte
 */
export async function getHostBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const hostId = req.user?.id;
        if (!hostId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Non authentifié' },
            });
        }

        const parseResult = BookingsQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: { 
                    code: 'VALIDATION_ERROR', 
                    message: 'Paramètres invalides',
                    details: formatZodErrors(parseResult.error),
                },
            });
        }

        const result = await bookingService.getHostBookings(hostId, parseResult.data);

        return res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/bookings/host/stats
 * Récupère les statistiques de réservation pour l'hôte
 */
export async function getHostStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const hostId = req.user?.id;
        if (!hostId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Non authentifié' },
            });
        }

        const stats = await bookingService.getHostBookingStats(hostId);

        return res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/bookings/host/:id/confirm
 * Confirme une réservation
 */
export async function confirmBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const hostId = req.user?.id;
        if (!hostId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Non authentifié' },
            });
        }

        const { id } = req.params;

        const result = await bookingService.confirmBooking(id, hostId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Réservation non trouvée ou déjà traitée' },
            });
        }

        return res.json({
            success: true,
            data: result,
            message: 'Réservation confirmée',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/bookings/host/:id/reject
 * Rejette une réservation
 */
export async function rejectBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const hostId = req.user?.id;
        if (!hostId) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Non authentifié' },
            });
        }

        const { id } = req.params;

        const parseResult = RejectBookingSchema.safeParse(req.body);
        const reason = parseResult.success ? parseResult.data.reason : undefined;

        const result = await bookingService.rejectBooking(id, hostId, reason);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Réservation non trouvée ou déjà traitée' },
            });
        }

        return res.json({
            success: true,
            data: result,
            message: 'Réservation rejetée',
        });
    } catch (error) {
        next(error);
    }
}
