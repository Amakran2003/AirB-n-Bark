/**
 * ==================== LISTINGS SERVICE ====================
 * Logique métier pour les opérations listings
 * Correspond au schéma Prisma
 */

import { Prisma, Listing } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config/env.js';

// ==================== TYPES ====================

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface ListingsQuery {
    page?: number;
    limit?: number;
    type?: ('niche' | 'nicholoc' | 'nichortoir')[];
    city?: string;
    country?: string;
    minPrice?: number;
    maxPrice?: number;
    minCapacity?: number;
    minRating?: number;
    antiCat?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: 'price' | 'rating' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

// Types pour les relations
export interface AmenityData {
    name: string;
    icon: string;
}

export interface HighlightData {
    title: string;
    description: string;
    icon: string;
}

export interface RoomData {
    name: string;
    description: string;
    image: string;
}

export interface RulesData {
    maxBarkHour?: string;
    mustBeVaccinated?: boolean;
    mustBeNeutered?: boolean;
    allowsPuppies?: boolean;
    minAge?: number;
}

export interface AvailabilityRangeData {
    startDate: string;
    endDate: string;
    isBlocked?: boolean;
}

export interface CreateListingData {
    title: string;
    subtitle: string;
    description: string;
    type: 'niche' | 'nicholoc' | 'nichortoir';
    address: string;
    city: string;
    country?: string;
    lat: number;
    lng: number;
    pricePerNight: number;
    currency?: string;
    maxDogs?: number;
    capacity: string;
    mainImage: string;
    images: string[];
    cancellationPolicy?: 'flexible' | 'moderate' | 'strict';
    hasFreeCancellation?: boolean;
    antiCatAvailable?: boolean;
    antiCatRiskScore?: number;
    antiCatExtraPrice?: number;
    instructions?: {
        checkInTime: string;
        checkOutTime: string;
        accessCode?: string;
        wifiName?: string;
        wifiPassword?: string;
        parkingInfo?: string;
        specialNotes?: string;
    };
    // Relations
    amenities?: AmenityData[];
    highlights?: HighlightData[];
    rooms?: RoomData[];
    rules?: RulesData;
    availableDateRanges?: AvailabilityRangeData[];
    isPublished?: boolean;
}

export interface UpdateListingData extends Partial<CreateListingData> {
    isActive?: boolean;
}

// ==================== SELECT CONSTANTS ====================

const listingSelect = {
    id: true,
    type: true,
    title: true,
    subtitle: true,
    description: true,
    address: true,
    city: true,
    country: true,
    lat: true,
    lng: true,
    pricePerNight: true,
    currency: true,
    maxDogs: true,
    capacity: true,
    mainImage: true,
    images: true,
    rating: true,
    reviewsCount: true,
    antiCatAvailable: true,
    antiCatRiskScore: true,
    antiCatExtraPrice: true,
    cancellationPolicy: true,
    hasFreeCancellation: true,
    instructions: true,
    isActive: true,
    isPublished: true,
    createdAt: true,
    updatedAt: true,
    host: {
        select: {
            id: true,
            name: true,
            avatar: true,
            isHost: true,
            isSuperHost: true,
            hostingSince: true,
            responseRate: true,
            hostDescription: true,
            createdAt: true,
        },
    },
    amenities: {
        select: {
            id: true,
            name: true,
            icon: true,
        },
    },
    highlights: {
        select: {
            id: true,
            title: true,
            description: true,
            icon: true,
        },
    },
    availability: {
        where: {
            endDate: { gte: new Date() },
        },
        orderBy: { startDate: 'asc' as const },
        select: {
            id: true,
            startDate: true,
            endDate: true,
            isBlocked: true,
        },
    },
} as const;

const listingDetailSelect = {
    ...listingSelect,
    rooms: {
        select: {
            id: true,
            name: true,
            description: true,
            image: true,
        },
    },
    rules: true,
    availability: {
        where: {
            endDate: { gte: new Date() },
        },
        orderBy: { startDate: 'asc' as const },
    },
    reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' as const },
        select: {
            id: true,
            rating: true,
            content: true,
            createdAt: true,
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    },
} as const;

// ==================== GUEST SERVICES ====================

/**
 * Récupère tous les listings avec filtres et pagination
 */
export async function getListings(query: ListingsQuery): Promise<PaginatedResult<Listing>> {
    const {
        page = 1,
        limit = config.defaultPageSize,
        type,
        city,
        country,
        minPrice,
        maxPrice,
        minCapacity,
        minRating,
        antiCat,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
    } = query;

    // Construction des conditions WHERE
    const where: Prisma.ListingWhereInput = {
        isActive: true,
        isPublished: true,
    };

    // Filtre par type (peut être plusieurs)
    if (type && type.length > 0) {
        where.type = { in: type };
    }

    // Filtres de localisation
    if (city) {
        where.city = { contains: city, mode: 'insensitive' };
    }
    if (country) {
        where.country = { contains: country, mode: 'insensitive' };
    }

    // Filtres de prix
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.pricePerNight = {};
        if (minPrice !== undefined) where.pricePerNight.gte = minPrice;
        if (maxPrice !== undefined) where.pricePerNight.lte = maxPrice;
    }

    // Filtre de capacité (nombre de chiens min)
    if (minCapacity !== undefined && minCapacity > 1) {
        where.maxDogs = { gte: minCapacity };
    }

    // Filtre anti-chat
    if (antiCat === true) {
        where.antiCatAvailable = true;
    }

    // Filtre note minimum
    if (minRating !== undefined && minRating > 0) {
        where.rating = { gte: minRating };
    }

    // Filtre par dates de disponibilité
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Le listing doit avoir au moins une période de disponibilité 
        // qui couvre entièrement la période demandée et n'est pas bloquée
        where.availability = {
            some: {
                isBlocked: false,
                startDate: { lte: start },
                endDate: { gte: end },
            }
        };
    }

    // Recherche textuelle
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
        ];
    }

    // Construction du ORDER BY
    let orderBy: Prisma.ListingOrderByWithRelationInput = {};
    switch (sortBy) {
        case 'price':
            orderBy = { pricePerNight: sortOrder };
            break;
        case 'rating':
            orderBy = { rating: sortOrder };
            break;
        case 'createdAt':
        default:
            orderBy = { createdAt: sortOrder };
    }

    // Comptage total
    const total = await prisma.listing.count({ where });

    // Récupération des listings
    const listings = await prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: listingSelect,
    });

    const totalPages = Math.ceil(total / limit);

    return {
        data: listings as unknown as Listing[],
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

/**
 * Récupère un listing par son ID
 */
export async function getListingById(id: string, userId?: string) {
    const listing = await prisma.listing.findFirst({
        where: { 
            id, 
            isActive: true,
            isPublished: true,
        },
        select: listingDetailSelect,
    });

    if (listing && userId) {
        // Enregistrer la vue
        await prisma.listingView.create({
            data: {
                listingId: id,
                userId,
            },
        }).catch(() => {}); // Ignorer les erreurs
    }

    return listing;
}

/**
 * Récupère les avis d'un listing
 */
export async function getListingReviews(listingId: string, page = 1, limit = 10) {
    const where = { listingId };

    const total = await prisma.review.count({ where });

    const reviews = await prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
            id: true,
            rating: true,
            content: true,
            createdAt: true,
            author: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });

    const totalPages = Math.ceil(total / limit);

    return {
        data: reviews,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

/**
 * Récupère la disponibilité d'un listing
 */
export async function getListingAvailability(listingId: string, startDate?: string, endDate?: string) {
    const where: Prisma.ListingAvailabilityWhereInput = {
        listingId,
        endDate: { gte: new Date() },
    };

    if (startDate) {
        where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
        where.endDate = { lte: new Date(endDate) };
    }

    const availability = await prisma.listingAvailability.findMany({
        where,
        orderBy: { startDate: 'asc' },
    });

    // Récupérer aussi les réservations confirmées pour ces dates
    const bookings = await prisma.booking.findMany({
        where: {
            listingId,
            status: { in: ['pending', 'confirmed'] },
            endDate: { gte: new Date() },
        },
        select: {
            startDate: true,
            endDate: true,
            status: true,
        },
    });

    return {
        availability,
        bookedDates: bookings,
    };
}

/**
 * Récupère les listings similaires
 */
export async function getSimilarListings(listingId: string, limit = 6) {
    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
            type: true,
            city: true,
            pricePerNight: true,
        },
    });

    if (!listing) return [];

    // Rechercher des listings similaires
    const similarListings = await prisma.listing.findMany({
        where: {
            id: { not: listingId },
            isActive: true,
            isPublished: true,
            OR: [
                { type: listing.type },
                { city: listing.city },
                {
                    pricePerNight: {
                        gte: listing.pricePerNight * 0.7,
                        lte: listing.pricePerNight * 1.3,
                    },
                },
            ],
        },
        take: limit,
        orderBy: { rating: 'desc' },
        select: listingSelect,
    });

    return similarListings;
}

/**
 * Enregistre un partage de listing
 */
export async function recordListingShare(listingId: string, platform?: string) {
    const share = await prisma.listingShare.create({
        data: {
            listingId,
            platform,
        },
    });

    return share;
}

// ==================== HOST SERVICES ====================

/**
 * Récupère les listings d'un hôte
 */
export async function getHostListings(
    hostId: string, 
    page = 1, 
    limit = 20,
    includeInactive = true
) {
    const where: Prisma.ListingWhereInput = { hostId };
    
    if (!includeInactive) {
        where.isActive = true;
    }

    const total = await prisma.listing.count({ where });

    const listings = await prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
            ...listingSelect,
            _count: {
                select: {
                    bookings: true,
                    reviews: true,
                },
            },
        },
    });

    const totalPages = Math.ceil(total / limit);

    return {
        data: listings,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

/**
 * Crée un nouveau listing avec toutes ses relations
 */
export async function createListing(hostId: string, data: CreateListingData) {
    // Utiliser une transaction pour créer le listing et ses relations
    const listing = await prisma.$transaction(async (tx) => {
        // 1. Créer le listing principal
        const newListing = await tx.listing.create({
            data: {
                hostId,
                title: data.title,
                subtitle: data.subtitle,
                description: data.description,
                type: data.type,
                address: data.address,
                city: data.city,
                country: data.country || 'France',
                lat: data.lat,
                lng: data.lng,
                pricePerNight: data.pricePerNight,
                currency: data.currency || 'EUR',
                maxDogs: data.maxDogs || 1,
                capacity: data.capacity,
                mainImage: data.mainImage,
                images: data.images || [],
                cancellationPolicy: data.cancellationPolicy || 'flexible',
                hasFreeCancellation: data.hasFreeCancellation ?? true,
                antiCatAvailable: data.antiCatAvailable ?? false,
                antiCatRiskScore: data.antiCatRiskScore || 0,
                antiCatExtraPrice: data.antiCatExtraPrice || 0,
                instructions: data.instructions ? data.instructions : undefined,
                isActive: true,
                isPublished: data.isPublished ?? true,
            },
        });

        // 2. Créer les amenities
        if (data.amenities && data.amenities.length > 0) {
            await tx.listingAmenity.createMany({
                data: data.amenities.map(a => ({
                    listingId: newListing.id,
                    name: a.name,
                    icon: a.icon,
                })),
            });
        }

        // 3. Créer les highlights
        if (data.highlights && data.highlights.length > 0) {
            await tx.listingHighlight.createMany({
                data: data.highlights.map(h => ({
                    listingId: newListing.id,
                    title: h.title,
                    description: h.description,
                    icon: h.icon,
                })),
            });
        }

        // 4. Créer les rooms
        if (data.rooms && data.rooms.length > 0) {
            await tx.listingRoom.createMany({
                data: data.rooms.map(r => ({
                    listingId: newListing.id,
                    name: r.name,
                    description: r.description,
                    image: r.image,
                })),
            });
        }

        // 5. Créer les rules
        if (data.rules) {
            await tx.listingRules.create({
                data: {
                    listingId: newListing.id,
                    maxBarkHour: data.rules.maxBarkHour || '22h00',
                    mustBeVaccinated: data.rules.mustBeVaccinated ?? true,
                    mustBeNeutered: data.rules.mustBeNeutered ?? false,
                    allowsPuppies: data.rules.allowsPuppies ?? true,
                    minAge: data.rules.minAge || 0,
                },
            });
        }

        // 6. Créer les disponibilités
        if (data.availableDateRanges && data.availableDateRanges.length > 0) {
            await tx.listingAvailability.createMany({
                data: data.availableDateRanges.map(range => ({
                    listingId: newListing.id,
                    startDate: new Date(range.startDate),
                    endDate: new Date(range.endDate),
                    isBlocked: range.isBlocked ?? false,
                })),
            });
        }

        return newListing;
    });

    // Récupérer le listing complet avec toutes ses relations
    const fullListing = await prisma.listing.findUnique({
        where: { id: listing.id },
        select: listingDetailSelect,
    });

    return fullListing;
}

/**
 * Met à jour un listing
 */
export async function updateListing(
    id: string, 
    hostId: string, 
    data: UpdateListingData
) {
    // Vérifier que le listing appartient à l'hôte
    const existing = await prisma.listing.findFirst({
        where: { id, hostId },
    });

    if (!existing) {
        return null;
    }

    // Mise à jour
    const listing = await prisma.listing.update({
        where: { id },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.subtitle && { subtitle: data.subtitle }),
            ...(data.description && { description: data.description }),
            ...(data.type && { type: data.type }),
            ...(data.address && { address: data.address }),
            ...(data.city && { city: data.city }),
            ...(data.country && { country: data.country }),
            ...(data.lat !== undefined && { lat: data.lat }),
            ...(data.lng !== undefined && { lng: data.lng }),
            ...(data.pricePerNight !== undefined && { pricePerNight: data.pricePerNight }),
            ...(data.currency && { currency: data.currency }),
            ...(data.maxDogs !== undefined && { maxDogs: data.maxDogs }),
            ...(data.capacity && { capacity: data.capacity }),
            ...(data.mainImage && { mainImage: data.mainImage }),
            ...(data.images && { images: data.images }),
            ...(data.cancellationPolicy && { cancellationPolicy: data.cancellationPolicy }),
            ...(data.hasFreeCancellation !== undefined && { hasFreeCancellation: data.hasFreeCancellation }),
            ...(data.antiCatAvailable !== undefined && { antiCatAvailable: data.antiCatAvailable }),
            ...(data.antiCatExtraPrice !== undefined && { antiCatExtraPrice: data.antiCatExtraPrice }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        },
        select: listingDetailSelect,
    });

    return listing;
}

/**
 * Supprime un listing (soft delete)
 */
export async function deleteListing(id: string, hostId: string): Promise<boolean> {
    const existing = await prisma.listing.findFirst({
        where: { id, hostId },
    });

    if (!existing) {
        return false;
    }

    // Soft delete - on désactive le listing
    await prisma.listing.update({
        where: { id },
        data: { 
            isActive: false,
            isPublished: false,
        },
    });

    return true;
}

/**
 * Active/Désactive un listing
 */
export async function toggleListingStatus(id: string, hostId: string): Promise<boolean | null> {
    const existing = await prisma.listing.findFirst({
        where: { id, hostId },
    });

    if (!existing) {
        return null;
    }

    const newActiveStatus = !existing.isActive;
    
    const updated = await prisma.listing.update({
        where: { id },
        data: { 
            isActive: newActiveStatus,
            // Quand on active, on publie aussi pour que l'annonce soit visible
            ...(newActiveStatus && { isPublished: true }),
        },
    });

    return updated.isActive;
}

/**
 * Publie/Dépublie un listing
 */
export async function toggleListingPublished(id: string, hostId: string): Promise<boolean | null> {
    const existing = await prisma.listing.findFirst({
        where: { id, hostId },
    });

    if (!existing) {
        return null;
    }

    const updated = await prisma.listing.update({
        where: { id },
        data: { isPublished: !existing.isPublished },
    });

    return updated.isPublished;
}

/**
 * Met à jour les disponibilités d'un listing
 */
export async function updateListingAvailability(
    id: string, 
    hostId: string, 
    availability: Array<{ startDate: Date; endDate: Date; isBlocked?: boolean }>
) {
    // Vérifier que le listing appartient à l'hôte
    const existing = await prisma.listing.findFirst({
        where: { id, hostId },
    });

    if (!existing) {
        return null;
    }

    // Supprimer les anciennes disponibilités futures
    await prisma.listingAvailability.deleteMany({
        where: {
            listingId: id,
            startDate: { gte: new Date() },
        },
    });

    // Créer les nouvelles disponibilités
    await prisma.listingAvailability.createMany({
        data: availability.map(a => ({
            listingId: id,
            startDate: a.startDate,
            endDate: a.endDate,
            isBlocked: a.isBlocked ?? false,
        })),
    });

    // Récupérer les disponibilités mises à jour
    const updatedAvailability = await prisma.listingAvailability.findMany({
        where: { listingId: id },
        orderBy: { startDate: 'asc' },
    });

    return updatedAvailability;
}

/**
 * Ajoute des aménités à un listing
 */
export async function addListingAmenities(
    id: string,
    hostId: string,
    amenities: Array<{ name: string; icon: string }>
) {
    const existing = await prisma.listing.findFirst({
        where: { id, hostId },
    });

    if (!existing) {
        return null;
    }

    await prisma.listingAmenity.createMany({
        data: amenities.map(a => ({
            listingId: id,
            name: a.name,
            icon: a.icon,
        })),
    });

    return prisma.listingAmenity.findMany({
        where: { listingId: id },
    });
}

/**
 * Récupère les statistiques d'un listing
 */
export async function getListingStats(id: string, hostId: string) {
    const existing = await prisma.listing.findFirst({
        where: { id, hostId },
        select: {
            rating: true,
            reviewsCount: true,
        },
    });

    if (!existing) {
        return null;
    }

    // Comptage des vues
    const viewCount = await prisma.listingView.count({
        where: { listingId: id },
    });

    // Comptage des partages
    const shareCount = await prisma.listingShare.count({
        where: { listingId: id },
    });

    // Stats de réservation
    const bookingStats = await prisma.booking.groupBy({
        by: ['status'],
        where: { listingId: id },
        _count: true,
        _sum: { totalPrice: true },
    });

    // Revenus totaux
    const totalRevenue = await prisma.booking.aggregate({
        where: { 
            listingId: id, 
            status: 'completed',
        },
        _sum: { totalPrice: true },
    });

    return {
        views: viewCount,
        shares: shareCount,
        rating: existing.rating,
        reviews: existing.reviewsCount,
        bookings: bookingStats,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
    };
}
