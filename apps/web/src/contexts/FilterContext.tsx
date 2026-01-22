import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import type { ListingType, ListingCardData } from '../data/listings';
import { MOCK_LISTINGS } from '../data/listings';

/**
 * ==================== FILTER CONTEXT ====================
 * Gestion globale des filtres de recherche
 * Prêt pour connexion API
 */

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
    // Nouveau: listings filtrés
    filteredListings: ListingCardData[];
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
     * Filtrage local des listings
     * TODO: Remplacer par appel API quand le backend sera prêt
     */
    const filteredListings = useMemo(() => {
        let result = [...MOCK_LISTINGS];

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
