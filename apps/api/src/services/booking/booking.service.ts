/**
 * ==================== BOOKINGS SERVICE ====================
 * Logique métier pour les opérations bookings
 */

import { Prisma, BookingStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { 
    generateBookingNumber, 
    calculateNights,
    PRICING,
    type CreateBookingInput,
    type BookingsQueryInput,
    type QuoteRequestInput,
} from './booking.validation.js';

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

export interface QuoteResult {
    listingId: string;
    startDate: string;
    endDate: string;
    nights: number;
    guestsCount: number;
    pricePerNight: number;
    subtotal: number;
    serviceFee: number;
    antiCatFee: number;
    totalPrice: number;
    hasFreeCancellation: boolean;
}

// ==================== GUEST SERVICES ====================

/**
 * Récupère les réservations d'un utilisateur (guest)
 */
export async function getGuestBookings(
    userId: string,
    query: BookingsQueryInput
): Promise<PaginatedResult<any>> {
    const { page, limit, status, sortBy, sortOrder } = query;

    const where: Prisma.BookingWhereInput = {
        guestId: userId,
    };

    if (status) {
        where.status = status as BookingStatus;
    }

    const total = await prisma.booking.count({ where });

    const orderBy: Prisma.BookingOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.BookingOrderByWithRelationInput] = sortOrder;

    const bookings = await prisma.booking.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
            listing: {
                select: {
                    id: true,
                    title: true,
                    subtitle: true,
                    mainImage: true,
                    city: true,
                    country: true,
                    pricePerNight: true,
                },
            },
            host: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });

    // Transformer pour correspondre au format frontend
    const formattedBookings = bookings.map(booking => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        listingId: booking.listingId,
        userId: booking.guestId,
        hostId: booking.hostId,
        startDate: booking.startDate.toISOString().split('T')[0],
        endDate: booking.endDate.toISOString().split('T')[0],
        guests: booking.guestsCount,
        totalPrice: booking.totalPrice,
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
        // Dénormalisé pour le frontend
        listingTitle: booking.listing.title,
        listingSubtitle: booking.listing.subtitle,
        listingImage: booking.listing.mainImage,
        listingLocation: `${booking.listing.city}, ${booking.listing.country}`,
        listingPrice: booking.listing.pricePerNight,
        hostName: booking.host.name,
        hostAvatar: booking.host.avatar,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
        data: formattedBookings,
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
 * Récupère une réservation par son ID
 */
export async function getBookingById(bookingId: string, userId: string) {
    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            OR: [
                { guestId: userId },
                { hostId: userId },
            ],
        },
        include: {
            listing: {
                select: {
                    id: true,
                    title: true,
                    subtitle: true,
                    mainImage: true,
                    images: true,
                    city: true,
                    country: true,
                    address: true,
                    pricePerNight: true,
                    cancellationPolicy: true,
                    hasFreeCancellation: true,
                },
            },
            host: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    phone: true,
                    email: true,
                },
            },
            guest: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    phone: true,
                    email: true,
                },
            },
        },
    });

    if (!booking) return null;

    return {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        listingId: booking.listingId,
        userId: booking.guestId,
        hostId: booking.hostId,
        startDate: booking.startDate.toISOString().split('T')[0],
        endDate: booking.endDate.toISOString().split('T')[0],
        nights: booking.nights,
        guests: booking.guestsCount,
        pricePerNight: booking.pricePerNight,
        serviceFee: booking.serviceFee,
        antiCatFee: booking.antiCatFee,
        totalPrice: booking.totalPrice,
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
        confirmedAt: booking.confirmedAt?.toISOString(),
        cancelledAt: booking.cancelledAt?.toISOString(),
        listing: booking.listing,
        host: booking.host,
        guest: booking.guest,
    };
}

/**
 * Calcule un devis pour une réservation
 */
export async function getQuote(input: QuoteRequestInput): Promise<QuoteResult | null> {
    const listing = await prisma.listing.findUnique({
        where: { id: input.listingId, isActive: true, isPublished: true },
        select: {
            id: true,
            pricePerNight: true,
            antiCatAvailable: true,
            antiCatExtraPrice: true,
            hasFreeCancellation: true,
            maxDogs: true,
        },
    });

    if (!listing) return null;

    // Vérifier capacité
    if (input.guestsCount > listing.maxDogs) {
        return null;
    }

    const nights = calculateNights(input.startDate, input.endDate);
    const subtotal = listing.pricePerNight * nights;
    const serviceFee = Math.round(subtotal * PRICING.SERVICE_FEE_PERCENTAGE * 100) / 100;
    const antiCatFee = input.antiCatOption && listing.antiCatAvailable 
        ? listing.antiCatExtraPrice * nights 
        : 0;
    const totalPrice = subtotal + serviceFee + antiCatFee;

    return {
        listingId: listing.id,
        startDate: input.startDate,
        endDate: input.endDate,
        nights,
        guestsCount: input.guestsCount,
        pricePerNight: listing.pricePerNight,
        subtotal,
        serviceFee,
        antiCatFee,
        totalPrice,
        hasFreeCancellation: listing.hasFreeCancellation,
    };
}

/**
 * Vérifie la disponibilité d'un listing pour des dates données
 */
export async function checkAvailability(
    listingId: string,
    startDate: string,
    endDate: string
): Promise<{ available: boolean; reason?: string }> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Vérifier les dates bloquées
    const blockedPeriod = await prisma.listingAvailability.findFirst({
        where: {
            listingId,
            isBlocked: true,
            OR: [
                {
                    startDate: { lte: end },
                    endDate: { gte: start },
                },
            ],
        },
    });

    if (blockedPeriod) {
        return { available: false, reason: 'Dates non disponibles' };
    }

    // Vérifier les réservations existantes
    const existingBooking = await prisma.booking.findFirst({
        where: {
            listingId,
            status: { in: ['pending', 'confirmed'] },
            OR: [
                {
                    startDate: { lte: end },
                    endDate: { gte: start },
                },
            ],
        },
    });

    if (existingBooking) {
        return { available: false, reason: 'Dates déjà réservées' };
    }

    return { available: true };
}

/**
 * Crée une nouvelle réservation
 */
export async function createBooking(
    userId: string,
    input: CreateBookingInput
) {
    // Vérifier disponibilité
    const availability = await checkAvailability(input.listingId, input.startDate, input.endDate);
    if (!availability.available) {
        throw new Error(availability.reason || 'Dates non disponibles');
    }

    // Récupérer le listing et l'hôte
    const listing = await prisma.listing.findUnique({
        where: { id: input.listingId, isActive: true, isPublished: true },
        select: {
            id: true,
            hostId: true,
            pricePerNight: true,
            maxDogs: true,
            antiCatAvailable: true,
            antiCatExtraPrice: true,
            hasFreeCancellation: true,
        },
    });

    if (!listing) {
        throw new Error('Listing non trouvé');
    }

    if (listing.hostId === userId) {
        throw new Error('Vous ne pouvez pas réserver votre propre listing');
    }

    if (input.guestsCount > listing.maxDogs) {
        throw new Error(`Ce listing accepte maximum ${listing.maxDogs} chien(s)`);
    }

    // Calculer les prix
    const nights = calculateNights(input.startDate, input.endDate);
    const subtotal = listing.pricePerNight * nights;
    const serviceFee = Math.round(subtotal * PRICING.SERVICE_FEE_PERCENTAGE * 100) / 100;
    const antiCatFee = input.antiCatOption && listing.antiCatAvailable 
        ? listing.antiCatExtraPrice * nights 
        : 0;
    const totalPrice = subtotal + serviceFee + antiCatFee;

    // Créer la réservation
    const booking = await prisma.booking.create({
        data: {
            bookingNumber: generateBookingNumber(),
            listingId: input.listingId,
            guestId: userId,
            hostId: listing.hostId,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            nights,
            guestsCount: input.guestsCount,
            pricePerNight: listing.pricePerNight,
            serviceFee,
            antiCatFee,
            totalPrice,
            status: 'pending',
        },
        include: {
            listing: {
                select: {
                    title: true,
                    mainImage: true,
                    city: true,
                    country: true,
                },
            },
            host: {
                select: {
                    name: true,
                    avatar: true,
                },
            },
        },
    });

    return {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        listingId: booking.listingId,
        userId: booking.guestId,
        hostId: booking.hostId,
        startDate: booking.startDate.toISOString().split('T')[0],
        endDate: booking.endDate.toISOString().split('T')[0],
        nights: booking.nights,
        guests: booking.guestsCount,
        totalPrice: booking.totalPrice,
        serviceFee: booking.serviceFee,
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
        hasFreeCancellation: listing.hasFreeCancellation,
        listingTitle: booking.listing.title,
        listingImage: booking.listing.mainImage,
        listingLocation: `${booking.listing.city}, ${booking.listing.country}`,
        hostName: booking.host.name,
        hostAvatar: booking.host.avatar,
    };
}

/**
 * Annule une réservation (par le guest)
 */
export async function cancelBooking(bookingId: string, userId: string) {
    // Permettre au guest OU à l'hôte d'annuler
    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            OR: [
                { guestId: userId },
                { hostId: userId },
            ],
            status: { in: ['pending', 'confirmed'] },
        },
    });

    if (!booking) {
        return null;
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: 'cancelled',
            cancelledAt: new Date(),
        },
    });

    return {
        id: updated.id,
        status: updated.status,
        cancelledAt: updated.cancelledAt?.toISOString(),
    };
}

// ==================== HOST SERVICES ====================

/**
 * Récupère les réservations reçues par un hôte
 */
export async function getHostBookings(
    hostId: string,
    query: BookingsQueryInput
): Promise<PaginatedResult<any>> {
    const { page, limit, status, sortBy, sortOrder } = query;

    const where: Prisma.BookingWhereInput = {
        hostId,
    };

    if (status) {
        where.status = status as BookingStatus;
    }

    const total = await prisma.booking.count({ where });

    const orderBy: Prisma.BookingOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.BookingOrderByWithRelationInput] = sortOrder;

    const bookings = await prisma.booking.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
            listing: {
                select: {
                    id: true,
                    title: true,
                    mainImage: true,
                    city: true,
                },
            },
            guest: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    email: true,
                    phone: true,
                },
            },
        },
    });

    // Transformer pour correspondre au format frontend (HostBookings.tsx)
    const formattedBookings = bookings.map(booking => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        listingId: booking.listingId,
        listingTitle: booking.listing.title,
        listingImage: booking.listing.mainImage,
        guestId: booking.guestId,
        guestName: booking.guest.name,
        guestAvatar: booking.guest.avatar,
        guestEmail: booking.guest.email,
        guestPhone: booking.guest.phone,
        dogsCount: booking.guestsCount,
        startDate: booking.startDate.toISOString().split('T')[0],
        endDate: booking.endDate.toISOString().split('T')[0],
        nights: booking.nights,
        totalPrice: booking.totalPrice,
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);

    return {
        data: formattedBookings,
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
 * Confirme une réservation (par l'hôte)
 */
export async function confirmBooking(bookingId: string, hostId: string) {
    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            hostId,
            status: 'pending',
        },
    });

    if (!booking) {
        return null;
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: 'confirmed',
            confirmedAt: new Date(),
        },
    });

    return {
        id: updated.id,
        status: updated.status,
        confirmedAt: updated.confirmedAt?.toISOString(),
    };
}

/**
 * Rejette une réservation (par l'hôte)
 */
export async function rejectBooking(bookingId: string, hostId: string, reason?: string) {
    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            hostId,
            status: 'pending',
        },
    });

    if (!booking) {
        return null;
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: 'rejected',
            cancelledAt: new Date(),
        },
    });

    return {
        id: updated.id,
        status: updated.status,
        cancelledAt: updated.cancelledAt?.toISOString(),
        reason,
    };
}

/**
 * Récupère les statistiques de réservation pour un hôte
 */
export async function getHostBookingStats(hostId: string) {
    const stats = await prisma.booking.groupBy({
        by: ['status'],
        where: { hostId },
        _count: true,
        _sum: { totalPrice: true },
    });

    const totalRevenue = await prisma.booking.aggregate({
        where: { hostId, status: 'completed' },
        _sum: { totalPrice: true },
    });

    const pendingCount = stats.find(s => s.status === 'pending')?._count || 0;
    const confirmedCount = stats.find(s => s.status === 'confirmed')?._count || 0;
    const completedCount = stats.find(s => s.status === 'completed')?._count || 0;
    const cancelledCount = stats.find(s => s.status === 'cancelled')?._count || 0;

    return {
        pending: pendingCount,
        confirmed: confirmedCount,
        completed: completedCount,
        cancelled: cancelledCount,
        totalBookings: pendingCount + confirmedCount + completedCount + cancelledCount,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
    };
}
