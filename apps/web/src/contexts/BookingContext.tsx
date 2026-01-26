import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { api, getAuthToken } from '../services/api';
import type { Booking as ApiBooking, CreateBookingRequest } from '../types/api.types';

/**
 * ==================== BOOKING CONTEXT ====================
 * Gestion des reservations utilisateur
 *
 * Architecture API-Ready:
 * - USE_API = true  → appels API réels
 * - USE_API = false → localStorage (par défaut)
 *
 * Endpoints API:
 * - GET /api/bookings → liste des reservations
 * - POST /api/bookings → creer une reservation
 * - POST /api/bookings/:id/cancel → annuler
 */

// Toggle pour activer l'API
const USE_API = import.meta.env.VITE_USE_API === 'true';

/**
 * ==================== TYPES ====================
 */
export interface Booking {
    id: string;
    bookingNumber: string; // Format: BARK-XXXXXX
    listingId: string;
    userId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    dogsCount: number;
    totalPrice: number;
    hasFreeCancellation: boolean; // Si l'annonce permet l'annulation gratuite
    status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
    createdAt: string;
    updatedAt: string;
    // Dénormalisé pour l'affichage (depuis l'API)
    listingTitle?: string;
    listingImage?: string;
    listingLocation?: string;
    listingPrice?: number;
    hostName?: string;
    hostAvatar?: string;
}

interface BookingContextType {
    bookings: Booking[];
    isLoading: boolean;
    error: string | null;
    createBooking: (data: CreateBookingData) => Promise<Booking>;
    updateBooking: (id: string, data: UpdateBookingData) => Promise<Booking | null>;
    cancelBooking: (id: string, cancellationFee?: number) => Promise<boolean>;
    getBookingById: (id: string) => Booking | undefined;
    refreshBookings: () => Promise<void>;
}

interface CreateBookingData {
    listingId: string;
    startDate: string;
    endDate: string;
    dogsCount: number;
    totalPrice: number;
    hasFreeCancellation: boolean;
}

interface UpdateBookingData {
    startDate?: string;
    endDate?: string;
    dogsCount?: number;
}

/**
 * ==================== CONTEXT ====================
 */
const BookingContext = createContext<BookingContextType | null>(null);

// Helper pour générer un ID unique
const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper pour générer un numéro de réservation unique (BARK-XXXXXX)
const generateBookingNumber = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BARK-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Helper pour convertir ApiBooking en Booking local
const mapApiBooking = (apiBooking: ApiBooking): Booking => ({
    id: apiBooking.id,
    bookingNumber: apiBooking.bookingNumber || `BARK-${apiBooking.id.slice(0, 6).toUpperCase()}`,
    listingId: apiBooking.listingId,
    userId: apiBooking.userId,
    startDate: apiBooking.startDate,
    endDate: apiBooking.endDate,
    dogsCount: apiBooking.guests,
    totalPrice: apiBooking.totalPrice,
    hasFreeCancellation: true, // TODO: get from listing
    status: apiBooking.status === 'completed' ? 'confirmed' : apiBooking.status,
    createdAt: apiBooking.createdAt,
    updatedAt: apiBooking.createdAt,
    // Champs dénormalisés
    listingTitle: (apiBooking as any).listingTitle,
    listingImage: (apiBooking as any).listingImage,
    listingLocation: (apiBooking as any).listingLocation,
    listingPrice: (apiBooking as any).listingPrice,
    hostName: (apiBooking as any).hostName,
    hostAvatar: (apiBooking as any).hostAvatar,
});

/**
 * ==================== PROVIDER ====================
 */
interface BookingProviderProps {
    children: ReactNode;
}

export const BookingProvider = ({ children }: BookingProviderProps) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // État pour forcer le rechargement quand l'auth change
    const [authTrigger, setAuthTrigger] = useState(0);

    // Écouter les changements d'authentification
    useEffect(() => {
        const handleAuthChange = () => {
            setAuthTrigger((prev) => prev + 1);
        };

        // Écouter l'événement personnalisé de login/logout
        window.addEventListener('auth-changed', handleAuthChange);
        // Écouter aussi les changements de localStorage (pour sync entre onglets)
        window.addEventListener('storage', (e) => {
            if (e.key === 'airbnbark_token') {
                handleAuthChange();
            }
        });

        return () => {
            window.removeEventListener('auth-changed', handleAuthChange);
        };
    }, []);

    // Charger les réservations au démarrage et quand l'auth change
    useEffect(() => {
        const loadBookings = async () => {
            const token = getAuthToken();

            // Ne pas charger si pas de token (pas connecté)
            if (USE_API && !token) {
                setBookings([]);
                return;
            }

            if (USE_API) {
                setIsLoading(true);
                const response = await api.bookings.getAll();
                if (response.success && response.data?.bookings) {
                    setBookings(response.data.bookings.map(mapApiBooking));
                } else if (response.success && Array.isArray(response.data)) {
                    // Fallback si l'API renvoie un tableau directement
                    setBookings(response.data.map(mapApiBooking));
                } else {
                    setBookings([]);
                }
                setIsLoading(false);
            } else {
                // Fallback localStorage
                const stored = localStorage.getItem('airbnbark_bookings');
                if (stored) {
                    try {
                        setBookings(JSON.parse(stored));
                    } catch {
                        console.error('Erreur lors du chargement des réservations');
                    }
                }
            }
        };
        loadBookings();
    }, [authTrigger]);

    // Sauvegarder les réservations dans localStorage (mode local uniquement)
    useEffect(() => {
        if (!USE_API && bookings.length > 0) {
            localStorage.setItem('airbnbark_bookings', JSON.stringify(bookings));
        }
    }, [bookings]);

    // Rafraîchir les réservations
    const refreshBookings = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        if (USE_API) {
            const response = await api.bookings.getAll();
            if (response.success) {
                setBookings(response.data.bookings.map(mapApiBooking));
            } else {
                setError(response.error.message);
            }
        }

        setIsLoading(false);
    }, []);

    // Créer une nouvelle réservation
    const createBooking = useCallback(async (data: CreateBookingData): Promise<Booking> => {
        setIsLoading(true);
        setError(null);

        if (USE_API) {
            const apiData: CreateBookingRequest = {
                listingId: data.listingId,
                startDate: data.startDate,
                endDate: data.endDate,
                guestsCount: data.dogsCount,
            };

            const response = await api.bookings.create(apiData);
            setIsLoading(false);

            if (response.success) {
                const booking = mapApiBooking(response.data);
                setBookings((prev) => [...prev, booking]);
                // Rafraîchir pour s'assurer de la synchronisation
                refreshBookings();
                return booking;
            } else {
                setError(response.error.message);
                throw new Error(response.error.message);
            }
        }

        // Mode local
        const newBooking: Booking = {
            id: generateId(),
            bookingNumber: generateBookingNumber(),
            listingId: data.listingId,
            userId: 'user-1',
            startDate: data.startDate,
            endDate: data.endDate,
            dogsCount: data.dogsCount,
            totalPrice: data.totalPrice,
            hasFreeCancellation: data.hasFreeCancellation,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setBookings((prev) => [...prev, newBooking]);
        setIsLoading(false);
        return newBooking;
    }, []);

    // Modifier une réservation
    // TODO: Connecter à l'API backend
    const updateBooking = useCallback(
        async (id: string, data: UpdateBookingData): Promise<Booking | null> => {
            setIsLoading(true);
            setError(null);

            const existingBooking = bookings.find((b) => b.id === id);
            if (!existingBooking) {
                setError('Réservation non trouvée');
                setIsLoading(false);
                return null;
            }

            const updatedBooking: Booking = {
                ...existingBooking,
                ...data,
                updatedAt: new Date().toISOString(),
            };

            // TODO: PUT vers l'API
            setBookings((prev) => prev.map((b) => (b.id === id ? updatedBooking : b)));
            setIsLoading(false);
            return updatedBooking;
        },
        [bookings]
    );

    // Annuler une réservation
    const cancelBooking = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        if (USE_API) {
            const response = await api.bookings.cancel(id);
            setIsLoading(false);

            if (response.success) {
                setBookings((prev) =>
                    prev.map((b) =>
                        b.id === id
                            ? {
                                  ...b,
                                  status: 'cancelled' as const,
                                  updatedAt: new Date().toISOString(),
                              }
                            : b
                    )
                );
                return true;
            } else {
                setError(response.error.message);
                return false;
            }
        }

        // Mode local
        setBookings((prev) =>
            prev.map((b) =>
                b.id === id
                    ? { ...b, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
                    : b
            )
        );
        setIsLoading(false);
        return true;
    }, []);

    // Récupérer une réservation par ID
    const getBookingById = useCallback(
        (id: string): Booking | undefined => {
            return bookings.find((b) => b.id === id);
        },
        [bookings]
    );

    const value: BookingContextType = {
        bookings,
        isLoading,
        error,
        createBooking,
        updateBooking,
        cancelBooking,
        getBookingById,
        refreshBookings,
    };

    return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

/**
 * ==================== HOOK ====================
 */
export const useBookings = (): BookingContextType => {
    const context = useContext(BookingContext);
    if (!context) {
        throw new Error('useBookings must be used within a BookingProvider');
    }
    return context;
};
