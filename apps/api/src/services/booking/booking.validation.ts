/**
 * ==================== BOOKINGS VALIDATION ====================
 * Schémas de validation Zod - correspond au schéma Prisma
 */

import { z } from 'zod';

// ==================== ENUMS ====================

export const BookingStatusEnum = z.enum(['pending', 'confirmed', 'cancelled', 'completed']);

// ==================== CREATE BOOKING ====================

export const CreateBookingSchema = z.object({
    listingId: z.string().uuid('ID listing invalide'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
    guestsCount: z.number().int().min(1, 'Minimum 1 chien').max(10, 'Maximum 10 chiens').default(1),
    antiCatOption: z.boolean().optional().default(false),
    specialRequests: z.string().max(1000).optional(),
}).refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    { message: 'La date de fin doit être après la date de début', path: ['endDate'] }
);

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// ==================== QUOTE REQUEST ====================

export const QuoteRequestSchema = z.object({
    listingId: z.string().uuid('ID listing invalide'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
    guestsCount: z.number().int().min(1).max(10).default(1),
    antiCatOption: z.boolean().optional().default(false),
}).refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    { message: 'La date de fin doit être après la date de début', path: ['endDate'] }
);

export type QuoteRequestInput = z.infer<typeof QuoteRequestSchema>;

// ==================== QUERY PARAMS ====================

export const BookingsQuerySchema = z.object({
    // Pagination
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    
    // Filtres
    status: BookingStatusEnum.optional(),
    
    // Tri
    sortBy: z.enum(['startDate', 'createdAt', 'totalPrice']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type BookingsQueryInput = z.infer<typeof BookingsQuerySchema>;

// ==================== HOST ACTIONS ====================

export const RejectBookingSchema = z.object({
    reason: z.string().min(10, 'Raison minimum 10 caractères').max(500).optional(),
});

export type RejectBookingInput = z.infer<typeof RejectBookingSchema>;

// ==================== ID PARAMS ====================

export const IdParamSchema = z.object({
    id: z.string().uuid('ID invalide'),
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Formate les erreurs Zod pour la réponse API
 */
export function formatZodErrors(error: z.ZodError): Array<{ path: string; message: string }> {
    return error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
    }));
}

/**
 * Génère un numéro de réservation unique
 */
export function generateBookingNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BARK-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Calcule le nombre de nuits entre deux dates
 */
export function calculateNights(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Constantes de prix
 */
export const PRICING = {
    SERVICE_FEE_PERCENTAGE: 0.12, // 12% comme dans le frontend
    MIN_NIGHTS: 1,
    MAX_NIGHTS: 365,
} as const;
