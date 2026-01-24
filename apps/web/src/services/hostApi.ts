/**
 * ==================== HOST API SERVICE ====================
 * Service dédié aux appels API pour les hôtes
 * Gère la création, modification et suppression des listings
 */

import { getAuthToken } from './api';
import type { ListingFullData, ListingAmenity, ListingHighlight, ListingRules, DateRange } from '../data/listings';

// ==================== TYPES API ====================

// Format attendu par l'API backend
export interface CreateListingPayload {
    title: string;
    subtitle: string;
    description: string;
    type: 'niche' | 'nicholoc' | 'nichortoir';
    address: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    pricePerNight: number;
    currency: string;
    maxDogs: number;
    capacity: string;
    mainImage: string;
    images: string[];
    cancellationPolicy: 'flexible' | 'moderate' | 'strict';
    hasFreeCancellation: boolean;
    antiCatAvailable: boolean;
    antiCatRiskScore: number;
    antiCatExtraPrice: number;
    instructions?: {
        checkInTime: string;
        checkOutTime: string;
        accessCode?: string;
        wifiName?: string;
        wifiPassword?: string;
        parkingInfo?: string;
        specialNotes?: string;
    };
    amenities?: Array<{ name: string; icon: string }>;
    highlights?: Array<{ title: string; description: string; icon: string }>;
    rooms?: Array<{ name: string; description: string; image: string }>;
    rules?: {
        maxBarkHour: string;
        mustBeVaccinated: boolean;
        mustBeNeutered: boolean;
        allowsPuppies: boolean;
        minAge: number;
    };
    availableDateRanges?: Array<{ startDate: string; endDate: string; isBlocked?: boolean }>;
    isPublished: boolean;
}

// Réponse de l'API après création
export interface ListingApiResponse {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    description: string;
    address: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    pricePerNight: number;
    currency: string;
    maxDogs: number;
    capacity: string;
    mainImage: string;
    images: string[];
    rating: number;
    reviewsCount: number;
    antiCatAvailable: boolean;
    antiCatRiskScore: number;
    antiCatExtraPrice: number;
    cancellationPolicy: string;
    hasFreeCancellation: boolean;
    isActive: boolean;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    host: {
        id: string;
        name: string;
        avatar: string | null;
    };
    amenities: Array<{ id: string; name: string; icon: string }>;
    highlights: Array<{ id: string; title: string; description: string; icon: string }>;
    rooms?: Array<{ id: string; name: string; description: string; image: string }>;
    rules?: {
        maxBarkHour: string;
        mustBeVaccinated: boolean;
        mustBeNeutered: boolean;
        allowsPuppies: boolean;
        minAge: number;
    };
    availability?: Array<{ startDate: string; endDate: string; isBlocked: boolean }>;
}

// ==================== MAPPERS ====================

/**
 * Convertit les données du formulaire HostAddListing vers le format API
 */
export function mapFormDataToApiPayload(
    formData: {
        type: string;
        title: string;
        description: string;
        price: number;
        capacity: { dogs: number; niches: number; beds: number; bowls: number };
        images: string[];
        locationDetails: { lat: number; lng: number; address: string; city: string; country: string };
        amenities: ListingAmenity[];
        highlights: ListingHighlight[];
        rooms: Array<{ name: string; description: string; image: string }>;
        rules: ListingRules;
        availableDateRanges: DateRange[];
        antiCatAvailable: boolean;
        antiCatRiskScore: number;
        antiCatExtraPrice: number;
        cancellationPolicy: 'flexible' | 'moderate' | 'strict';
        instructions?: {
            checkInTime: string;
            checkOutTime: string;
            accessCode: string;
            wifiName: string;
            wifiPassword: string;
            parkingInfo: string;
            specialNotes: string;
        };
    },
    _hostName: string
): CreateListingPayload {
    // Générer la capacité string
    const capacityParts = [];
    if (formData.capacity.dogs > 0) capacityParts.push(`${formData.capacity.dogs} chien${formData.capacity.dogs > 1 ? 's' : ''}`);
    if (formData.capacity.niches > 0) capacityParts.push(`${formData.capacity.niches} niche${formData.capacity.niches > 1 ? 's' : ''}`);
    if (formData.capacity.beds > 0) capacityParts.push(`${formData.capacity.beds} couchage${formData.capacity.beds > 1 ? 's' : ''}`);
    if (formData.capacity.bowls > 0) capacityParts.push(`${formData.capacity.bowls} coin${formData.capacity.bowls > 1 ? 's' : ''} gamelle`);
    const capacityString = capacityParts.join(' · ');

    // Générer le subtitle
    const typeLabels: Record<string, string> = {
        niche: 'Niche entière',
        nicholoc: 'Chambre en coloc canine',
        nichortoir: 'Lit en dortoir canin'
    };
    const subtitle = `${typeLabels[formData.type] || formData.type} à ${formData.locationDetails.city}, ${formData.locationDetails.country}`;

    return {
        title: formData.title,
        subtitle,
        description: formData.description,
        type: formData.type as 'niche' | 'nicholoc' | 'nichortoir',
        address: formData.locationDetails.address,
        city: formData.locationDetails.city,
        country: formData.locationDetails.country,
        lat: formData.locationDetails.lat,
        lng: formData.locationDetails.lng,
        pricePerNight: formData.price,
        currency: 'EUR',
        maxDogs: formData.capacity.dogs,
        capacity: capacityString,
        mainImage: formData.images[0] || '/placeholder-dog.svg',
        images: formData.images,
        cancellationPolicy: formData.cancellationPolicy,
        hasFreeCancellation: formData.cancellationPolicy === 'flexible',
        antiCatAvailable: formData.antiCatAvailable,
        antiCatRiskScore: formData.antiCatRiskScore,
        antiCatExtraPrice: formData.antiCatExtraPrice,
        amenities: formData.amenities.map(a => ({ name: a.name, icon: a.icon })),
        highlights: formData.highlights.map(h => ({ title: h.title, description: h.description, icon: h.icon })),
        rooms: formData.rooms.map(r => ({ name: r.name, description: r.description, image: r.image })),
        rules: {
            maxBarkHour: formData.rules.maxBarkHour,
            mustBeVaccinated: formData.rules.mustBeVaccinated,
            mustBeNeutered: formData.rules.mustBeNeutered,
            allowsPuppies: formData.rules.allowsPuppies,
            minAge: formData.rules.minAge,
        },
        availableDateRanges: formData.availableDateRanges.map(r => ({
            startDate: r.start,
            endDate: r.end,
            isBlocked: false,
        })),
        instructions: formData.instructions ? {
            checkInTime: formData.instructions.checkInTime,
            checkOutTime: formData.instructions.checkOutTime,
            accessCode: formData.instructions.accessCode || undefined,
            wifiName: formData.instructions.wifiName || undefined,
            wifiPassword: formData.instructions.wifiPassword || undefined,
            parkingInfo: formData.instructions.parkingInfo || undefined,
            specialNotes: formData.instructions.specialNotes || undefined,
        } : undefined,
        isPublished: true, // Publié directement
    };
}

/**
 * Convertit la réponse API vers le format ListingFullData du frontend
 */
export function mapApiResponseToListingData(apiResponse: ListingApiResponse, hostName: string): ListingFullData {
    return {
        id: apiResponse.id,
        type: apiResponse.type as 'niche' | 'nicholoc' | 'nichortoir',
        title: apiResponse.title,
        subtitle: apiResponse.subtitle,
        location: `${apiResponse.city}, ${apiResponse.country}`,
        image: apiResponse.mainImage,
        price: apiResponse.pricePerNight,
        rating: apiResponse.rating,
        hostName: apiResponse.host?.name || hostName,
        hostAvatar: apiResponse.host?.avatar || '/placeholder-dog.svg',
        antiCat: {
            available: apiResponse.antiCatAvailable,
            riskScore: apiResponse.antiCatRiskScore,
            extraPrice: apiResponse.antiCatExtraPrice,
        },
        maxDogs: apiResponse.maxDogs,
        availableDateRanges: apiResponse.availability?.map(a => ({
            start: a.startDate.split('T')[0],
            end: a.endDate.split('T')[0],
        })) || [],
        capacity: apiResponse.capacity,
        images: apiResponse.images.length > 0 ? apiResponse.images : [apiResponse.mainImage],
        description: apiResponse.description,
        host: {
            name: apiResponse.host?.name || hostName,
            avatar: apiResponse.host?.avatar || '/placeholder-dog.svg',
            isNewHost: true,
            isSuperHost: false,
            rating: 0,
            reviewCount: apiResponse.reviewsCount,
            responseRate: 100,
            yearsHosting: 0,
        },
        locationDetails: {
            lat: apiResponse.lat,
            lng: apiResponse.lng,
            address: apiResponse.address,
            city: apiResponse.city,
            country: apiResponse.country,
        },
        rooms: apiResponse.rooms?.map(r => ({
            name: r.name,
            description: r.description,
            image: r.image,
        })) || [],
        amenities: apiResponse.amenities.map(a => ({
            name: a.name,
            icon: a.icon as ListingAmenity['icon'],
        })),
        highlights: apiResponse.highlights.map(h => ({
            title: h.title,
            description: h.description,
            icon: h.icon as ListingHighlight['icon'],
        })),
        reviews: [],
        pricing: {
            amount: apiResponse.pricePerNight,
            currency: '€',
            nights: 1,
            dateRange: '',
            hasFreeCancellation: apiResponse.hasFreeCancellation,
        },
        rules: apiResponse.rules || {
            maxBarkHour: '22h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: true,
            minAge: 0,
        },
        reviewsCount: apiResponse.reviewsCount,
        cancellationPolicy: apiResponse.cancellationPolicy as 'flexible' | 'moderate' | 'strict',
    };
}

// ==================== API CALLS ====================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Crée un nouveau listing via l'API
 */
export async function createListing(payload: CreateListingPayload): Promise<{ success: boolean; data?: ListingApiResponse; error?: string }> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/listings/host/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            return { 
                success: false, 
                error: data.error?.message || data.message || 'Erreur lors de la création' 
            };
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Erreur création listing:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

/**
 * Récupère les listings de l'hôte connecté
 */
export async function getMyListings(): Promise<{ success: boolean; data?: ListingApiResponse[]; error?: string }> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/listings/host/my-listings`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error?.message || 'Erreur' };
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Erreur récupération listings:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

/**
 * Active/Désactive un listing
 */
export async function toggleListingStatus(
    listingId: string, 
    isActive: boolean
): Promise<{ success: boolean; error?: string }> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/listings/host/${listingId}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ isActive }),
        });

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error?.message || 'Erreur' };
        }

        return { success: true };
    } catch (error) {
        console.error('Erreur toggle listing:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

/**
 * Supprime un listing
 */
export async function deleteListing(listingId: string): Promise<{ success: boolean; error?: string }> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/listings/host/${listingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error?.message || 'Erreur' };
        }

        return { success: true };
    } catch (error) {
        console.error('Erreur suppression listing:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

/**
 * Met à jour un listing
 */
export async function updateListing(
    listingId: string, 
    payload: Partial<CreateListingPayload>
): Promise<{ success: boolean; data?: ListingApiResponse; error?: string }> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/listings/host/${listingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error?.message || 'Erreur' };
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Erreur mise à jour listing:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

// ==================== BOOKINGS HOST API ====================

export interface HostBooking {
    id: string;
    bookingNumber: string;
    guestName: string;
    guestAvatar: string;
    guestId: string;
    dogsCount: number;
    listingId: string;
    listingTitle: string;
    startDate: string;
    endDate: string;
    nights: number;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    createdAt: string;
}

/**
 * Récupère les réservations reçues par l'hôte
 */
export async function getHostBookings(
    status?: string
): Promise<{ success: boolean; bookings?: HostBooking[]; total?: number; error?: string }> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('limit', '50');

        const response = await fetch(`${API_BASE_URL}/bookings/host?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error?.message || 'Erreur' };
        }

        return { success: true, bookings: data.data?.bookings || [], total: data.data?.total || 0 };
    } catch (error) {
        console.error('Erreur récupération réservations:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

/**
 * Confirme une réservation
 */
export async function confirmBooking(
    bookingId: string
): Promise<{ success: boolean; error?: string }> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/host/${bookingId}/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error?.message || 'Erreur' };
        }

        return { success: true };
    } catch (error) {
        console.error('Erreur confirmation réservation:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

/**
 * Rejette une réservation
 */
export async function rejectBooking(
    bookingId: string,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/host/${bookingId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason: reason || 'Refusé par l\'hôte' }),
        });

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error?.message || 'Erreur' };
        }

        return { success: true };
    } catch (error) {
        console.error('Erreur rejet réservation:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

/**
 * Annule une réservation confirmée (par l'hôte)
 */
export async function cancelBookingAsHost(
    bookingId: string,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason: reason || 'Annulé par l\'hôte' }),
        });

        if (!response.ok) {
            const data = await response.json();
            return { success: false, error: data.error?.message || 'Erreur' };
        }

        return { success: true };
    } catch (error) {
        console.error('Erreur annulation réservation:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}

/**
 * Récupère les statistiques de l'hôte
 */
export async function getHostStats(): Promise<{ 
    success: boolean; 
    stats?: {
        pendingCount: number;
        confirmedCount: number;
        completedCount: number;
        cancelledCount: number;
        totalRevenue: number;
    }; 
    error?: string 
}> {
    const token = getAuthToken();
    
    if (!token) {
        return { success: false, error: 'Non authentifié' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/host/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error?.message || 'Erreur' };
        }

        return { success: true, stats: data.data };
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        return { success: false, error: 'Erreur réseau' };
    }
}
