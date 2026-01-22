import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

/**
 * ==================== TYPES ====================
 */
export interface Booking {
    id: string;
    bookingNumber: string; // Format: BARK-XXXXXX
    listingId: string;
    userId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    dogsCount: number;
    totalPrice: number;
    hasFreeCancellation: boolean; // Si l'annonce permet l'annulation gratuite
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
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

    // Charger les réservations depuis localStorage au démarrage
    useEffect(() => {
        const stored = localStorage.getItem('airbnbark_bookings');
        if (stored) {
            try {
                setBookings(JSON.parse(stored));
            } catch {
                console.error('Erreur lors du chargement des réservations');
            }
        }
    }, []);

    // Sauvegarder les réservations dans localStorage
    useEffect(() => {
        if (bookings.length > 0) {
            localStorage.setItem('airbnbark_bookings', JSON.stringify(bookings));
        }
    }, [bookings]);

    // Rafraîchir les réservations
    // TODO: Connecter à l'API backend
    const refreshBookings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        // TODO: fetch depuis l'API
        setIsLoading(false);
    }, []);

    // Créer une nouvelle réservation
    // TODO: Connecter à l'API backend
    const createBooking = useCallback(async (data: CreateBookingData): Promise<Booking> => {
        setIsLoading(true);
        setError(null);

        const newBooking: Booking = {
            id: generateId(),
            bookingNumber: generateBookingNumber(),
            listingId: data.listingId,
            userId: 'user-1', // TODO: Récupérer depuis AuthContext
            startDate: data.startDate,
            endDate: data.endDate,
            dogsCount: data.dogsCount,
            totalPrice: data.totalPrice,
            hasFreeCancellation: data.hasFreeCancellation,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // TODO: POST vers l'API
        setBookings((prev) => [...prev, newBooking]);
        setIsLoading(false);
        return newBooking;
    }, []);

    // Modifier une réservation
    // TODO: Connecter à l'API backend
    const updateBooking = useCallback(async (id: string, data: UpdateBookingData): Promise<Booking | null> => {
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
    }, [bookings]);

    // Annuler une réservation
    // TODO: Connecter à l'API backend
    const cancelBooking = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        // TODO: DELETE vers l'API
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
    const getBookingById = useCallback((id: string): Booking | undefined => {
        return bookings.find((b) => b.id === id);
    }, [bookings]);

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
