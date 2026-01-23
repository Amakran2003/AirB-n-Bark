/**
 * ==================== LISTINGS VALIDATION ====================
 * Schémas de validation Zod - correspond au schéma Prisma
 */

import { z } from 'zod';

// ==================== ENUMS ====================

export const ListingTypeEnum = z.enum(['niche', 'nicholoc', 'nichortoir']);
export const CancellationPolicyEnum = z.enum(['flexible', 'moderate', 'strict']);

// ==================== CREATE LISTING ====================

export const CreateListingSchema = z.object({
    title: z.string()
        .min(5, 'Titre minimum 5 caractères')
        .max(100, 'Titre maximum 100 caractères')
        .transform(val => val.trim()),
    
    subtitle: z.string()
        .min(5, 'Sous-titre minimum 5 caractères')
        .max(200, 'Sous-titre maximum 200 caractères')
        .transform(val => val.trim()),
    
    description: z.string()
        .min(20, 'Description minimum 20 caractères')
        .max(5000, 'Description maximum 5000 caractères')
        .transform(val => val.trim()),
    
    type: ListingTypeEnum,
    
    // Location
    address: z.string().min(1, 'Adresse requise').max(500),
    city: z.string().min(1, 'Ville requise').max(100),
    country: z.string().max(100).default('France'),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    
    // Pricing
    pricePerNight: z.number().min(0, 'Prix minimum 0').max(100000),
    currency: z.string().length(3).default('EUR'),
    
    // Capacity
    maxDogs: z.number().int().min(1).max(20).default(1),
    capacity: z.string().min(1).max(100), // "2 chiens max"
    
    // Images
    mainImage: z.string().url('URL image principale invalide'),
    images: z.array(z.string().url('URL image invalide')).max(20).default([]),
    
    // Policies
    cancellationPolicy: CancellationPolicyEnum.default('flexible'),
    hasFreeCancellation: z.boolean().default(true),
    
    // Anti-cat
    antiCatAvailable: z.boolean().default(false),
    antiCatExtraPrice: z.number().min(0).default(0),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

// ==================== UPDATE LISTING ====================

export const UpdateListingSchema = CreateListingSchema.partial().extend({
    isActive: z.boolean().optional(),
    isPublished: z.boolean().optional(),
});

export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;

// ==================== QUERY PARAMS ====================

export const ListingsQuerySchema = z.object({
    // Pagination
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    
    // Filtres de base
    type: ListingTypeEnum.optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    
    // Filtres de prix
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    
    // Filtres de capacité
    minCapacity: z.coerce.number().int().min(1).optional(),
    
    // Filtres de dates
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    
    // Tri
    sortBy: z.enum(['price', 'rating', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    
    // Recherche textuelle
    search: z.string().max(200).optional(),
});

export type ListingsQueryInput = z.infer<typeof ListingsQuerySchema>;

// ==================== AVAILABILITY ====================

export const AvailabilityItemSchema = z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isBlocked: z.boolean().default(false),
});

export const UpdateAvailabilitySchema = z.object({
    availability: z.array(AvailabilityItemSchema).min(1).max(365),
});

export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilitySchema>;

// ==================== SHARE ====================

export const ShareListingSchema = z.object({
    platform: z.enum(['whatsapp', 'facebook', 'twitter', 'email', 'copy', 'other']).optional(),
});

export type ShareListingInput = z.infer<typeof ShareListingSchema>;

// ==================== AMENITIES ====================

export const AddAmenitiesSchema = z.object({
    amenities: z.array(z.object({
        name: z.string().min(1).max(100),
        icon: z.string().min(1).max(50),
    })).min(1).max(50),
});

export type AddAmenitiesInput = z.infer<typeof AddAmenitiesSchema>;

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
