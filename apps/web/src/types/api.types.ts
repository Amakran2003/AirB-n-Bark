/**
 * ==================== TYPES API PARTAGÉS ====================
 * Types TypeScript pour l'API AirB-n-Bark
 * À utiliser côté frontend ET backend pour garantir la cohérence
 * 
 * Convention:
 * - Les types sont séparés des mock data
 * - Compatible avec les réponses API REST
 * - Prêt pour React Query / SWR
 */

// ==================== AUTH ====================

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    phone?: string;
    isHost: boolean;
    language?: string;
    createdAt: string;
}

export interface Language {
    id: string;
    code: string;
    label: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

// ==================== LISTINGS ====================

export type ListingType = 'niche' | 'nicholoc' | 'nichortoir';

export interface ListingHost {
    id: string;
    name: string;
    avatar: string;
    isNewHost: boolean;
    isSuperHost: boolean;
    rating: number;
    reviewCount: number;
    responseRate: number;
    yearsHosting: number;
}

export interface ListingLocation {
    lat: number;
    lng: number;
    address: string;
    city: string;
    country: string;
}

export interface ListingAmenity {
    id: string;
    name: string;
    icon: string;
}

export interface ListingReview {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    rating: number;
    date: string;
    content: string;
}

export interface DateRange {
    start: string; // ISO format: "2026-01-20"
    end: string;   // ISO format: "2026-03-15"
}

export interface AntiCatOption {
    available: boolean;
    riskScore: number; // 0-100
    extraPrice: number;
}

// Données pour la carte swipable (liste)
export interface ListingCard {
    id: string;
    type: ListingType;
    title: string;
    subtitle: string;
    location: string;
    image: string;
    price: number;
    rating: number;
    hostName: string;
    hostAvatar: string;
    antiCat: AntiCatOption;
    maxDogs: number;
    availableDateRanges: DateRange[];
}

// Données complètes pour la page détail
export interface ListingFull extends ListingCard {
    capacity: string;
    images: string[];
    description: string;
    host: ListingHost;
    locationDetails: ListingLocation;
    amenities: ListingAmenity[];
    reviews: ListingReview[];
    reviewsCount: number;
    cancellationPolicy: 'flexible' | 'moderate' | 'strict';
    rules: {
        maxBarkHour: string;
        mustBeVaccinated: boolean;
        mustBeNeutered: boolean;
        allowsPuppies: boolean;
        minAge: number;
    };
    instructions?: {
        checkInTime?: string;
        checkOutTime?: string;
        accessCode?: string;
        wifiName?: string;
        wifiPassword?: string;
        parkingInfo?: string;
        specialNotes?: string;
    };
}

// Filtres pour la recherche
export interface ListingsFilters {
    city?: string;
    startDate?: string;
    endDate?: string;
    minCapacity?: number;
    type?: ListingType[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    antiCat?: boolean;
}

// Réponse API listings
export interface ListingsResponse {
    listings: ListingCard[];
    total: number;
    page: number;
    limit: number;
}

// ==================== BOOKINGS ====================

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
    id: string;
    bookingNumber?: string;
    listingId: string;
    userId: string;
    hostId: string;
    startDate: string;
    endDate: string;
    guests: number;
    totalPrice: number;
    status: BookingStatus;
    createdAt: string;
    // Denormalized for display
    listingTitle: string;
    listingImage: string;
    listingLocation: string;
    hostName: string;
    hostAvatar: string;
}

export interface CreateBookingRequest {
    listingId: string;
    startDate: string;
    endDate: string;
    guestsCount: number;
    antiCatOption?: boolean;
}

export interface BookingsResponse {
    bookings: Booking[];
    total: number;
}

// ==================== MESSAGES ====================

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    timestamp: string;
    isRead: boolean;
}

export interface Conversation {
    id: string;
    participants: {
        id: string;
        name: string;
        avatar: string;
    }[];
    listingId: string;
    listingTitle: string;
    listingImage: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export interface ConversationsResponse {
    conversations: Conversation[];
    total: number;
}

export interface MessagesResponse {
    messages: Message[];
    total: number;
}

export interface SendMessageRequest {
    conversationId: string;
    content: string;
}

// ==================== HOST ====================

export interface HostDashboardStats {
    totalEarnings: number;
    monthlyEarnings: number;
    totalBookings: number;
    pendingBookings: number;
    averageRating: number;
    responseRate: number;
    viewsThisMonth: number;
}

export interface HostListing extends ListingCard {
    status: 'active' | 'paused' | 'draft';
    bookingsCount: number;
    earnings: number;
    nextBooking?: {
        guestName: string;
        startDate: string;
    };
}

export interface HostListingsResponse {
    listings: HostListing[];
    total: number;
}

export interface HostBooking extends Booking {
    guestName: string;
    guestAvatar: string;
    dogName?: string;
}

// ==================== PAYMENTS ====================

export interface PaymentIntent {
    clientSecret: string;
    amount: number;
    currency: string;
}

export interface CreatePaymentRequest {
    bookingId: string;
    paymentMethodId?: string;
}

// ==================== API HELPERS ====================

export interface ApiError {
    message: string;
    code: string;
    status: number;
    details?: unknown;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

// Type helper pour les réponses API
export type ApiResponse<T> = {
    data: T;
    success: true;
} | {
    error: ApiError;
    success: false;
};
