/**
 * ==================== LISTINGS VALIDATION ====================
 * Schémas de validation Zod - correspond au schéma Prisma
 */

import { z } from 'zod';

// ==================== ENUMS ====================

export const ListingTypeEnum = z.enum(['niche', 'nicholoc', 'nichortoir']);
export const CancellationPolicyEnum = z.enum(['flexible', 'moderate', 'strict']);
export const AmenityIconEnum = z.enum(['flame', 'droplets', 'scroll', 'home', 'cat', 'bone', 'shield', 'leaf', 'moon', 'sun']);
export const HighlightIconEnum = z.enum(['search', 'star', 'check', 'paw', 'shield']);

// ==================== NESTED SCHEMAS ====================

export const AmenitySchema = z.object({
    name: z.string().min(1).max(100),
    icon: AmenityIconEnum,
});

export const HighlightSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(200),
    icon: HighlightIconEnum,
});

export const RoomSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    image: z.string().min(1), // URL ou base64
});

export const RulesSchema = z.object({
    maxBarkHour: z.string().default('22h00'),
    mustBeVaccinated: z.boolean().default(true),
    mustBeNeutered: z.boolean().default(false),
    allowsPuppies: z.boolean().default(true),
    minAge: z.number().int().min(0).default(0),
});

export const AvailabilityRangeSchema = z.object({
    startDate: z.string(), // ISO date string
    endDate: z.string(),
    isBlocked: z.boolean().default(false),
});

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
    
    // Images - accepte URL ou base64
    mainImage: z.string().min(1, 'Image principale requise'),
    images: z.array(z.string()).max(20).default([]),
    
    // Policies
    cancellationPolicy: CancellationPolicyEnum.default('flexible'),
    hasFreeCancellation: z.boolean().default(true),
    
    // Anti-cat
    antiCatAvailable: z.boolean().default(false),
    antiCatRiskScore: z.number().int().min(0).max(100).default(0),
    antiCatExtraPrice: z.number().min(0).default(0),
    
    // Relations (optionnelles à la création, peuvent être ajoutées après)
    amenities: z.array(AmenitySchema).max(20).optional(),
    highlights: z.array(HighlightSchema).max(10).optional(),
    rooms: z.array(RoomSchema).max(10).optional(),
    rules: RulesSchema.optional(),
    availableDateRanges: z.array(AvailabilityRangeSchema).max(365).optional(),
    
    // Instructions d'arrivée (structurées, optionnel)
    instructions: z.object({
        checkInTime: z.string().max(20),
        checkOutTime: z.string().max(20),
        accessCode: z.string().max(50).optional(),
        wifiName: z.string().max(50).optional(),
        wifiPassword: z.string().max(50).optional(),
        parkingInfo: z.string().max(200).optional(),
        specialNotes: z.string().max(500).optional(),
    }).optional(),
    
    // Publication directe
    isPublished: z.boolean().default(false),
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
    type: z.string().optional().transform(val => {
        if (!val) return undefined;
        const types = val.split(',').filter(t => ['niche', 'nicholoc', 'nichortoir'].includes(t));
        return types.length > 0 ? types as ('niche' | 'nicholoc' | 'nichortoir')[] : undefined;
    }),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    
    // Filtres de prix
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    
    // Filtres de capacité
    minCapacity: z.coerce.number().int().min(1).optional(),
    
    // Filtre anti-chat
    antiCat: z.coerce.boolean().optional(),
    
    // Filtre note minimum
    minRating: z.coerce.number().min(0).max(5).optional(),
    
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
