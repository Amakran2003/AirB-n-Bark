/**
 * ==================== LISTINGS CONTROLLER ====================
 * Contrôleurs pour les endpoints listings (Guest + Host)
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import * as listingsService from './listings.service.js';
import {
    CreateListingSchema,
    UpdateListingSchema,
    ListingsQuerySchema,
    UpdateAvailabilitySchema,
    ShareListingSchema,
    AddAmenitiesSchema,
    IdParamSchema,
    formatZodErrors,
} from './listings.validation.js';

// ==================== HELPERS ====================

/**
 * Transforme un listing DB en format frontend
 */
function formatListingForFrontend(listing: any) {
    const hostingSince = listing.host?.hostingSince || listing.host?.createdAt;
    const isNewHost = hostingSince 
        ? (Date.now() - new Date(hostingSince).getTime()) < 90 * 24 * 60 * 60 * 1000 // < 90 jours
        : true;

    return {
        id: listing.id,
        type: listing.type,
        title: listing.title,
        subtitle: listing.subtitle,
        location: `${listing.city}, ${listing.country}`,
        image: listing.mainImage,
        images: listing.images || [],
        price: listing.pricePerNight,
        rating: listing.rating || 0,
        reviewsCount: listing.reviewsCount || 0,
        hostName: listing.host?.name || 'Hôte',
        hostAvatar: listing.host?.avatar || '',
        antiCat: {
            available: listing.antiCatAvailable || false,
            riskScore: listing.antiCatRiskScore || 0,
            extraPrice: listing.antiCatExtraPrice || 0,
        },
        maxDogs: listing.maxDogs || 1,
        availableDateRanges: (listing.availability || []).map((a: any) => ({
            start: a.startDate?.toISOString?.()?.split('T')[0] || a.startDate,
            end: a.endDate?.toISOString?.()?.split('T')[0] || a.endDate,
        })),
        // Données complètes pour ListingDetails
        capacity: listing.capacity || `${listing.maxDogs} chien${listing.maxDogs > 1 ? 's' : ''} max`,
        description: listing.description || '',
        host: {
            id: listing.host?.id || '',
            name: listing.host?.name || 'Hôte',
            avatar: listing.host?.avatar || '',
            isNewHost,
            isSuperHost: listing.host?.isSuperHost || false,
            hostingSince: hostingSince?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0],
            responseRate: listing.host?.responseRate || 100,
            description: listing.host?.hostDescription || 'Hôte passionné par les chiens.',
            joinedDate: listing.host?.createdAt?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0],
        },
        locationDetails: {
            address: listing.address || '',
            city: listing.city || '',
            country: listing.country || 'France',
            lat: listing.lat || 0,
            lng: listing.lng || 0,
            neighborhood: listing.city || '',
        },
        rooms: (listing.rooms || []).map((r: any) => ({
            name: r.name,
            description: r.description,
            image: r.image,
        })),
        amenities: (listing.amenities || []).map((a: any) => ({
            name: a.name,
            icon: a.icon,
        })),
        highlights: (listing.highlights || []).map((h: any) => ({
            icon: h.icon,
            title: h.title,
            description: h.description,
        })),
        reviews: (listing.reviews || []).map((r: any) => ({
            author: r.author?.name || 'Anonyme',
            avatar: r.author?.avatar || '',
            rating: r.rating,
            date: r.createdAt?.toISOString?.()?.split('T')[0] || '',
            content: r.content,
            platformDate: r.createdAt?.toISOString?.()?.split('T')[0] || '',
        })),
        pricing: {
            amount: listing.pricePerNight || 0,
            currency: listing.currency === 'EUR' ? '€' : listing.currency || '€',
            nights: 1, // Sera calculé côté frontend selon les dates sélectionnées
            dateRange: 'Sélectionnez des dates',
            hasFreeCancellation: listing.hasFreeCancellation ?? true,
        },
        rules: listing.rules ? {
            maxBarkHour: listing.rules.maxBarkHour || '22h00',
            mustBeVaccinated: listing.rules.mustBeVaccinated ?? true,
            mustBeNeutered: listing.rules.mustBeNeutered ?? false,
            allowsPuppies: listing.rules.allowsPuppies ?? true,
            minAge: listing.rules.minAge || 0,
        } : {
            maxBarkHour: '22h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: true,
            minAge: 0,
        },
        cancellationPolicy: listing.cancellationPolicy || 'flexible',
    };
}

// ==================== GUEST CONTROLLERS ====================

/**
 * GET /api/listings
 * Récupère tous les listings avec filtres et pagination
 */
export async function getListings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const result = ListingsQuerySchema.safeParse(req.query);
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Paramètres invalides',
                    details: formatZodErrors(result.error),
                },
            });
        }

        const listings = await listingsService.getListings(result.data);

        // Formater les listings pour le frontend
        const formattedListings = listings.data.map(formatListingForFrontend);

        return res.json({
            success: true,
            data: {
                listings: formattedListings,
            },
            pagination: listings.pagination,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/listings/:id
 * Récupère un listing par son ID
 */
export async function getListingById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const listing = await listingsService.getListingById(
            paramResult.data.id,
            req.user?.id
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Listing non trouvé',
                },
            });
        }

        // Formater pour le frontend
        const formattedListing = formatListingForFrontend(listing);

        return res.json({
            success: true,
            data: formattedListing,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/listings/:id/reviews
 * Récupère les avis d'un listing
 */
export async function getListingReviews(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

        const result = await listingsService.getListingReviews(
            paramResult.data.id,
            page,
            limit
        );

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
 * GET /api/listings/:id/availability
 * Récupère la disponibilité d'un listing
 */
export async function getListingAvailability(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

        const result = await listingsService.getListingAvailability(
            paramResult.data.id,
            startDate,
            endDate
        );

        return res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/listings/:id/similar
 * Récupère les listings similaires
 */
export async function getSimilarListings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const limit = Math.min(parseInt(req.query.limit as string) || 6, 20);

        const listings = await listingsService.getSimilarListings(
            paramResult.data.id,
            limit
        );

        return res.json({
            success: true,
            data: listings,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/listings/:id/share
 * Enregistre un partage de listing
 */
export async function shareListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const bodyResult = ShareListingSchema.safeParse(req.body);
        
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: formatZodErrors(bodyResult.error),
                },
            });
        }

        const share = await listingsService.recordListingShare(
            paramResult.data.id,
            bodyResult.data.platform
        );

        return res.status(201).json({
            success: true,
            data: share,
        });
    } catch (error) {
        next(error);
    }
}

// ==================== HOST CONTROLLERS ====================

/**
 * GET /api/listings/host/my-listings
 * Récupère les listings de l'hôte connecté
 */
export async function getHostListings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const includeInactive = req.query.includeInactive !== 'false';

        const result = await listingsService.getHostListings(
            req.user!.id,
            page,
            limit,
            includeInactive
        );

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
 * POST /api/listings/host/create
 * Crée un nouveau listing
 */
export async function createListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const bodyResult = CreateListingSchema.safeParse(req.body);
        
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: formatZodErrors(bodyResult.error),
                },
            });
        }

        const listing = await listingsService.createListing(
            req.user!.id,
            bodyResult.data
        );

        return res.status(201).json({
            success: true,
            data: listing,
            message: 'Listing créé avec succès',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/listings/host/:id
 * Met à jour un listing
 */
export async function updateListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const bodyResult = UpdateListingSchema.safeParse(req.body);
        
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: formatZodErrors(bodyResult.error),
                },
            });
        }

        const listing = await listingsService.updateListing(
            paramResult.data.id,
            req.user!.id,
            bodyResult.data
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Listing non trouvé ou non autorisé',
                },
            });
        }

        return res.json({
            success: true,
            data: listing,
            message: 'Listing mis à jour avec succès',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/listings/host/:id
 * Supprime un listing (soft delete)
 */
export async function deleteListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const deleted = await listingsService.deleteListing(
            paramResult.data.id,
            req.user!.id
        );

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Listing non trouvé ou non autorisé',
                },
            });
        }

        return res.json({
            success: true,
            message: 'Listing supprimé avec succès',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/listings/host/:id/toggle
 * Active/Désactive un listing
 */
export async function toggleListingStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const isActive = await listingsService.toggleListingStatus(
            paramResult.data.id,
            req.user!.id
        );

        if (isActive === null) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Listing non trouvé ou non autorisé',
                },
            });
        }

        return res.json({
            success: true,
            data: { isActive },
            message: isActive ? 'Listing activé' : 'Listing désactivé',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/listings/host/:id/publish
 * Publie/Dépublie un listing
 */
export async function toggleListingPublished(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const isPublished = await listingsService.toggleListingPublished(
            paramResult.data.id,
            req.user!.id
        );

        if (isPublished === null) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Listing non trouvé ou non autorisé',
                },
            });
        }

        return res.json({
            success: true,
            data: { isPublished },
            message: isPublished ? 'Listing publié' : 'Listing dépublié',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/listings/host/:id/availability
 * Met à jour les disponibilités d'un listing
 */
export async function updateListingAvailability(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const bodyResult = UpdateAvailabilitySchema.safeParse(req.body);
        
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: formatZodErrors(bodyResult.error),
                },
            });
        }

        const availability = await listingsService.updateListingAvailability(
            paramResult.data.id,
            req.user!.id,
            bodyResult.data.availability
        );

        if (!availability) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Listing non trouvé ou non autorisé',
                },
            });
        }

        return res.json({
            success: true,
            data: availability,
            message: 'Disponibilités mises à jour',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/listings/host/:id/amenities
 * Ajoute des aménités à un listing
 */
export async function addListingAmenities(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const bodyResult = AddAmenitiesSchema.safeParse(req.body);
        
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Données invalides',
                    details: formatZodErrors(bodyResult.error),
                },
            });
        }

        const amenities = await listingsService.addListingAmenities(
            paramResult.data.id,
            req.user!.id,
            bodyResult.data.amenities
        );

        if (!amenities) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Listing non trouvé ou non autorisé',
                },
            });
        }

        return res.status(201).json({
            success: true,
            data: amenities,
            message: 'Aménités ajoutées',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/listings/host/:id/stats
 * Récupère les statistiques d'un listing
 */
export async function getListingStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const paramResult = IdParamSchema.safeParse(req.params);
        
        if (!paramResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'ID invalide',
                },
            });
        }

        const stats = await listingsService.getListingStats(
            paramResult.data.id,
            req.user!.id
        );

        if (!stats) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Listing non trouvé ou non autorisé',
                },
            });
        }

        return res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
}
