import { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import type { ListingType, ListingCardData } from '../data/listings';
import { getListings } from '../data/listings';
import type { ListingCard, ListingsFilters } from '../types/api.types';
import { api } from '../services/api';

/**
 * ==================== FILTER CONTEXT ====================
 * Gestion globale des filtres de recherche
 * 
 * Architecture API-Ready:
 * - USE_API = true  → appels API réels
 * - USE_API = false → mock data local (par défaut)
 * 
 * Endpoints API:
 * - GET /api/listings?filters=... → filtrage cote serveur
 */

// Toggle pour activer l'API (mettre à true quand le backend est prêt)
const USE_API = import.meta.env.VITE_USE_API === 'true';

export interface FilterState {
    // Dates
    checkIn: string | null;
    checkOut: string | null;

    // Type de logement
    listingTypes: ListingType[];

    // Prix
    priceMin: number | null;
    priceMax: number | null;

    // Localisation
    city: string | null;

    // Options
    antiCatOnly: boolean;

    // Rating minimum
    minRating: number | null;

    // Nombre de chiens
    dogsCount: number;
}

interface FilterContextType {
    filters: FilterState;
    setFilters: (filters: Partial<FilterState>) => void;
    resetFilters: () => void;
    isFilterModalOpen: boolean;
    openFilterModal: () => void;
    closeFilterModal: () => void;
    activeFiltersCount: number;
    // Listings filtrés
    filteredListings: ListingCardData[];
    // États de chargement pour API
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

const defaultFilters: FilterState = {
    checkIn: null,
    checkOut: null,
    listingTypes: [],
    priceMin: null,
    priceMax: null,
    city: null,
    antiCatOnly: false,
    minRating: null,
    dogsCount: 1,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
    const [filters, setFiltersState] = useState<FilterState>(defaultFilters);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    
    // États API
    const [apiListings, setApiListings] = useState<ListingCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setFilters = (newFilters: Partial<FilterState>) => {
        setFiltersState((prev) => ({ ...prev, ...newFilters }));
    };

    const resetFilters = () => {
        setFiltersState(defaultFilters);
    };

    const openFilterModal = () => setIsFilterModalOpen(true);
    const closeFilterModal = () => setIsFilterModalOpen(false);

    // Compter les filtres actifs
    const activeFiltersCount = [
        filters.checkIn !== null,
        filters.listingTypes.length > 0,
        filters.priceMin !== null || filters.priceMax !== null,
        filters.city !== null,
        filters.antiCatOnly,
        filters.minRating !== null,
        filters.dogsCount > 1,
    ].filter(Boolean).length;

    /**
     * Fetch listings depuis l'API
     */
    const fetchFromApi = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const apiFilters: ListingsFilters = {
            location: filters.city || undefined,
            startDate: filters.checkIn || undefined,
            endDate: filters.checkOut || undefined,
            guests: filters.dogsCount,
            type: filters.listingTypes.length > 0 ? filters.listingTypes : undefined,
            priceMin: filters.priceMin || undefined,
            priceMax: filters.priceMax || undefined,
            antiCat: filters.antiCatOnly || undefined,
        };

        const response = await api.listings.getAll(apiFilters);

        if (response.success) {
            setApiListings(response.data.listings);
        } else {
            setError(response.error.message);
            console.error('API Error:', response.error);
        }

        setIsLoading(false);
    }, [filters]);

    // Refetch quand USE_API est actif et les filtres changent
    useEffect(() => {
        if (USE_API) {
            fetchFromApi();
        }
    }, [fetchFromApi]);

    /**
     * Filtrage local des listings (fallback quand API désactivée)
     */
    const localFilteredListings = useMemo(() => {
        if (USE_API) return []; // Ne pas calculer si on utilise l'API
        
        // Récupère les mocks + les annonces créées par les hôtes (localStorage)
        let result = [...getListings()];

        // Filtre par type de logement
        if (filters.listingTypes.length > 0) {
            result = result.filter((listing) => filters.listingTypes.includes(listing.type));
        }

        // Filtre par prix minimum
        if (filters.priceMin !== null) {
            result = result.filter((listing) => listing.price >= filters.priceMin!);
        }

        // Filtre par prix maximum
        if (filters.priceMax !== null) {
            result = result.filter((listing) => listing.price <= filters.priceMax!);
        }

        // Filtre par rating minimum
        if (filters.minRating !== null) {
            result = result.filter((listing) => listing.rating >= filters.minRating!);
        }

        // Filtre anti-chat : uniquement les annonces avec option anti-chat disponible
        if (filters.antiCatOnly) {
            result = result.filter((listing) => listing.antiCat?.available === true);
        }

        // Filtre par nombre de chiens
        if (filters.dogsCount > 0) {
            result = result.filter((listing) => listing.maxDogs >= filters.dogsCount);
        }

        // Filtre par dates disponibles
        if (filters.checkIn && filters.checkOut) {
            const checkInDate = new Date(filters.checkIn);
            const checkOutDate = new Date(filters.checkOut);
            
            result = result.filter((listing) => {
                // Vérifier si au moins une plage de dates contient les dates demandées
                return listing.availableDateRanges.some((range) => {
                    const rangeStart = new Date(range.start);
                    const rangeEnd = new Date(range.end);
                    return checkInDate >= rangeStart && checkOutDate <= rangeEnd;
                });
            });
        }

        return result;
    }, [filters]);

    // Choix entre API et local
    const filteredListings = USE_API ? apiListings as unknown as ListingCardData[] : localFilteredListings;

    return (
        <FilterContext.Provider
            value={{
                filters,
                setFilters,
                resetFilters,
                isFilterModalOpen,
                openFilterModal,
                closeFilterModal,
                activeFiltersCount,
                filteredListings,
                isLoading,
                error,
                refetch: fetchFromApi,
            }}
        >
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = (): FilterContextType => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};

/**
 * ==================== API HELPERS ====================
 * Fonctions pour construire les query params pour l'API
 */

export const buildFilterQueryParams = (filters: FilterState): URLSearchParams => {
    const params = new URLSearchParams();

    if (filters.checkIn) params.append('checkIn', filters.checkIn);
    if (filters.checkOut) params.append('checkOut', filters.checkOut);
    if (filters.listingTypes.length > 0) {
        params.append('types', filters.listingTypes.join(','));
    }
    if (filters.priceMin !== null) params.append('priceMin', filters.priceMin.toString());
    if (filters.priceMax !== null) params.append('priceMax', filters.priceMax.toString());
    if (filters.city) params.append('city', filters.city);
    if (filters.antiCatOnly) params.append('antiCat', 'true');
    if (filters.minRating !== null) params.append('minRating', filters.minRating.toString());
    if (filters.dogsCount > 1) params.append('dogsCount', filters.dogsCount.toString());

    return params;
};

/**
 * Fonction pour appeler l'API avec les filtres
 * TODO: Connecter à l'API réelle
 */
export const fetchFilteredListings = async (filters: FilterState) => {
    const params = buildFilterQueryParams(filters);
    const url = `/api/listings?${params.toString()}`;

    // TODO: Remplacer par l'appel API réel
    console.log('API Call:', url);

    // Pour le moment, retourner les données mockées
    // const response = await fetch(url);
    // return response.json();

    return null;
};
