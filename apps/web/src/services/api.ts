/**
 * ==================== API SERVICE ====================
 * Service centralisé pour tous les appels API
 * 
 * Configuration:
 * - Base URL configuré via env
 * - Gestion automatique des tokens
 * - Error handling uniforme
 * - Support TypeScript complet
 */

import type {
    ApiResponse,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    ListingsResponse,
    ListingsFilters,
    ListingFull,
    BookingsResponse,
    Booking,
    CreateBookingRequest,
    ConversationsResponse,
    MessagesResponse,
    SendMessageRequest,
    HostDashboardStats,
    HostListingsResponse,
    PaymentIntent,
    CreatePaymentRequest,
    Language,
} from '../types/api.types';

// ==================== CONFIGURATION ====================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Token storage
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string | null) => {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

export const getAuthToken = () => authToken;

// ==================== BASE FETCH ====================

async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: {
                    message: data.error?.message || data.message || 'Une erreur est survenue',
                    code: data.error?.code || data.code || 'UNKNOWN_ERROR',
                    status: response.status,
                    details: data.error?.details,
                },
            };
        }

        // L'API renvoie { success: true, data: {...} } - on extrait data.data
        return { success: true, data: data.data || data };
    } catch (error) {
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Erreur réseau',
                code: 'NETWORK_ERROR',
                status: 0,
            },
        };
    }
}

// ==================== AUTH API ====================

export const authApi = {
    login: (credentials: LoginRequest) =>
        apiFetch<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),

    register: (data: RegisterRequest) =>
        apiFetch<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    logout: () =>
        apiFetch<void>('/auth/logout', {
            method: 'POST',
        }),

    me: () => apiFetch<AuthResponse['user']>('/auth/me'),

    becomeHost: () =>
        apiFetch<AuthResponse['user']>('/auth/become-host', {
            method: 'POST',
        }),

    updateAvatar: (avatarUrl: string) =>
        apiFetch<AuthResponse['user']>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ avatar: avatarUrl }),
        }),

    changePassword: (currentPassword: string, newPassword: string) =>
        apiFetch<{ message: string }>('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        }),

    // OAuth
    oauthGoogle: (token: string) =>
        apiFetch<AuthResponse>('/auth/oauth/google', {
            method: 'POST',
            body: JSON.stringify({ token }),
        }),

    oauthApple: (token: string) =>
        apiFetch<AuthResponse>('/auth/oauth/apple', {
            method: 'POST',
            body: JSON.stringify({ token }),
        }),

    updateLanguage: (language: string) =>
        apiFetch<AuthResponse['user']>('/auth/language', {
            method: 'PUT',
            body: JSON.stringify({ language }),
        }),
};

// ==================== LISTINGS API ====================

export const listingsApi = {
    getAll: (filters?: ListingsFilters, page = 1, limit = 20) => {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', limit.toString());

        if (filters) {
            if (filters.city) params.set('city', filters.city);
            if (filters.startDate) params.set('startDate', filters.startDate);
            if (filters.endDate) params.set('endDate', filters.endDate);
            if (filters.minCapacity) params.set('minCapacity', filters.minCapacity.toString());
            if (filters.type?.length) params.set('type', filters.type.join(','));
            if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
            if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
            if (filters.minRating) params.set('minRating', filters.minRating.toString());
            if (filters.antiCat) params.set('antiCat', 'true');
        }

        return apiFetch<ListingsResponse>(`/listings?${params.toString()}`);
    },

    getById: (id: string) => apiFetch<ListingFull>(`/listings/${id}`),

    // Pour les hôtes
    create: (data: Partial<ListingFull>) =>
        apiFetch<ListingFull>('/listings', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: Partial<ListingFull>) =>
        apiFetch<ListingFull>(`/listings/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiFetch<void>(`/listings/${id}`, {
            method: 'DELETE',
        }),
};

// ==================== BOOKINGS API ====================

export const bookingsApi = {
    getAll: () => apiFetch<BookingsResponse>('/bookings'),

    getById: (id: string) => apiFetch<Booking>(`/bookings/${id}`),

    create: (data: CreateBookingRequest) =>
        apiFetch<Booking>('/bookings', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    cancel: (id: string) =>
        apiFetch<Booking>(`/bookings/${id}/cancel`, {
            method: 'POST',
        }),

    // Pour les hôtes
    getHostBookings: () => apiFetch<BookingsResponse>('/host/bookings'),

    confirmBooking: (id: string) =>
        apiFetch<Booking>(`/host/bookings/${id}/confirm`, {
            method: 'POST',
        }),

    rejectBooking: (id: string, reason?: string) =>
        apiFetch<Booking>(`/host/bookings/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }),
};

// ==================== MESSAGES API ====================

export const messagesApi = {
    getConversations: () => apiFetch<ConversationsResponse>('/conversations'),

    getMessages: (conversationId: string) =>
        apiFetch<MessagesResponse>(`/conversations/${conversationId}/messages`),

    sendMessage: (data: SendMessageRequest) =>
        apiFetch<MessagesResponse['messages'][0]>(`/conversations/${data.conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: data.content }),
        }),

    markAsRead: (conversationId: string) =>
        apiFetch<void>(`/conversations/${conversationId}/read`, {
            method: 'POST',
        }),

    // Pour les hôtes
    getHostConversations: () => apiFetch<ConversationsResponse>('/host/conversations'),
};

// ==================== HOST API ====================

export const hostApi = {
    getDashboard: () => apiFetch<HostDashboardStats>('/host/dashboard'),

    getListings: () => apiFetch<HostListingsResponse>('/host/listings'),

    toggleListingStatus: (id: string, status: 'active' | 'paused') =>
        apiFetch<void>(`/host/listings/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
};

// ==================== PAYMENTS API ====================

export const paymentsApi = {
    createIntent: (data: CreatePaymentRequest) =>
        apiFetch<PaymentIntent>('/payments/intent', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    confirm: (paymentIntentId: string) =>
        apiFetch<void>(`/payments/${paymentIntentId}/confirm`, {
            method: 'POST',
        }),
};

// ==================== META API ====================

export const metaApi = {
    getLanguages: () => apiFetch<Language[]>('/meta/languages'),
};

// ==================== EXPORT GROUPED ====================

export const api = {
    auth: authApi,
    listings: listingsApi,
    bookings: bookingsApi,
    messages: messagesApi,
    host: hostApi,
    payments: paymentsApi,
    meta: metaApi,
};

export default api;
