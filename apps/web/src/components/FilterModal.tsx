import { useState, useEffect, useRef } from 'react';
import {
    X,
    Calendar,
    Home,
    Cat,
    Star,
    Dog,
    Minus,
    Plus,
    MapPin,
    Search,
    Loader2,
} from 'lucide-react';
import { useFilters, FilterState } from '../contexts/FilterContext';
import { DatePicker } from './DatePicker';
import type { ListingType } from '../data/listings';

// Interface pour les suggestions Nominatim
interface AddressSuggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
    };
}

/**
 * ==================== FILTER MODAL ====================
 * Modal de filtres style Airbnb
 * - Dates (check-in / check-out)
 * - Type de logement
 * - Fourchette de prix
 * - Option anti-chat
 * - Rating minimum
 */

// Types de logement disponibles
const LISTING_TYPES: { value: ListingType; label: string; description: string }[] = [
    {
        value: 'niche',
        label: 'Niche entière',
        description: 'Un palace rien que pour toi, boule de poils',
    },
    {
        value: 'nicholoc',
        label: 'Nicholoc',
        description: "Une chambre en coloc avec d'autres toutous cool",
    },
    {
        value: 'nichortoir',
        label: 'Nichortoir',
        description: 'Un lit dans un dortoir... ambiance meute !',
    },
];

// Fourchettes de prix prédéfinies
const PRICE_RANGES = [
    { min: 0, max: 25, label: '0 - 25€' },
    { min: 25, max: 50, label: '25 - 50€' },
    { min: 50, max: 100, label: '50 - 100€' },
    { min: 100, max: null, label: '100€+' },
];

// Villes populaires pour le filtre
const POPULAR_CITIES = [
    'Paris',
    'Lyon',
    'Marseille',
    'Bordeaux',
    'Toulouse',
    'Nice',
    'Nantes',
    'Strasbourg',
    'Montpellier',
    'Lille',
];

export const FilterModal = () => {
    const { filters, setFilters, resetFilters, isFilterModalOpen, closeFilterModal } = useFilters();

    // État local pour les modifications avant d'appliquer
    const [citySearch, setCitySearch] = useState('');
    const [citySuggestions, setCitySuggestions] = useState<AddressSuggestion[]>([]);
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const citySearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Swipe to close
    const [swipeY, setSwipeY] = useState(0);
    const touchStartRef = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartRef.current === null) return;
        const deltaY = e.touches[0].clientY - touchStartRef.current;
        if (deltaY > 0) {
            setSwipeY(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (swipeY > 100) {
            handleClose();
        }
        setSwipeY(0);
        touchStartRef.current = null;
    };

    // Sync local state when modal opens
    useEffect(() => {
        if (isFilterModalOpen) {
            setLocalFilters(filters);
        }
    }, [isFilterModalOpen, filters]);

    // Recherche de villes avec l'API Nominatim (OpenStreetMap - gratuit)
    useEffect(() => {
        if (citySearch.length < 2) {
            setCitySuggestions([]);
            return;
        }

        if (citySearchTimeoutRef.current) {
            clearTimeout(citySearchTimeoutRef.current);
        }

        citySearchTimeoutRef.current = setTimeout(async () => {
            setIsSearchingCity(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}&countrycodes=fr&limit=5&addressdetails=1&featuretype=city`,
                    {
                        headers: {
                            'Accept-Language': 'fr',
                        },
                    }
                );
                const data = await response.json();
                setCitySuggestions(data);
            } catch (error) {
                console.error('Erreur recherche ville:', error);
                setCitySuggestions([]);
            } finally {
                setIsSearchingCity(false);
            }
        }, 300);

        return () => {
            if (citySearchTimeoutRef.current) {
                clearTimeout(citySearchTimeoutRef.current);
            }
        };
    }, [citySearch]);

    // Sélectionner une ville depuis les suggestions
    const selectCity = (suggestion: AddressSuggestion) => {
        const cityName =
            suggestion.address?.city ||
            suggestion.address?.town ||
            suggestion.address?.village ||
            suggestion.address?.municipality ||
            suggestion.display_name.split(',')[0].trim();

        setLocalFilters({ ...localFilters, city: cityName });
        setCitySearch('');
        setCitySuggestions([]);
    };

    const handleApply = () => {
        setFilters(localFilters);
        closeFilterModal();
        // TODO: Appeler l'API avec les nouveaux filtres
        // fetchFilteredListings(localFilters);
    };

    const handleReset = () => {
        resetFilters();
        setLocalFilters({
            checkIn: null,
            checkOut: null,
            listingTypes: [],
            priceMin: null,
            priceMax: null,
            city: null,
            antiCatOnly: false,
            minRating: null,
            dogsCount: 1,
        });
    };

    const toggleListingType = (type: ListingType) => {
        const current = localFilters.listingTypes;
        const updated = current.includes(type)
            ? current.filter((t) => t !== type)
            : [...current, type];
        setLocalFilters({ ...localFilters, listingTypes: updated });
    };

    const setPriceRange = (min: number | null, max: number | null) => {
        // Toggle si déjà sélectionné
        if (localFilters.priceMin === min && localFilters.priceMax === max) {
            setLocalFilters({ ...localFilters, priceMin: null, priceMax: null });
        } else {
            setLocalFilters({ ...localFilters, priceMin: min, priceMax: max });
        }
    };

    const setRating = (rating: number) => {
        // Toggle si déjà sélectionné
        if (localFilters.minRating === rating) {
            setLocalFilters({ ...localFilters, minRating: null });
        } else {
            setLocalFilters({ ...localFilters, minRating: rating });
        }
    };

    // Fermer et appliquer les filtres
    const handleClose = () => {
        setFilters(localFilters);
        closeFilterModal();
    };

    if (!isFilterModalOpen) return null;

    return (
        <div
            className="fixed inset-0 z-200 flex items-end justify-center bg-black/50 touch-none"
            onClick={handleClose}
        >
            <div
                className="relative w-full max-h-[85vh] bg-white rounded-t-3xl overflow-hidden flex flex-col touch-none"
                onClick={(e) => e.stopPropagation()}
                style={{
                    animation: swipeY === 0 ? 'slideUp 0.3s ease-out' : 'none',
                    transform: `translateY(${swipeY}px)`,
                    transition: swipeY === 0 ? 'transform 0.2s ease-out' : 'none',
                }}
            >
                {/* Swipe indicator + Header - zone de swipe pour fermer */}
                <div
                    className="touch-auto"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 bg-tertiary rounded-full" />
                    </div>
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-(--color-border-light)">
                        <button className="btn-icon" onClick={handleClose}>
                            <X className="w-4 h-4" />
                        </button>
                        <span className="text-body-md">Filtres</span>
                        <button className="text-body-sm underline" onClick={handleReset}>
                            Réinitialiser
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 touch-auto overscroll-contain">
                    {/* ===== DATES ===== */}
                    <section className="mb-8">
                        <h3 className="text-h3 mb-4">Quand ?</h3>
                        <button
                            className="w-full flex items-center gap-3 p-4 rounded-xl border border-(--color-border-light)"
                            onClick={() => setIsDatePickerOpen(true)}
                        >
                            <Calendar className="w-5 h-5 icon-secondary" />
                            <div className="flex-1 flex justify-between">
                                <div className="text-left">
                                    <p className="text-caption text-secondary">Arrivée</p>
                                    <p className="text-body-sm font-medium">
                                        {localFilters.checkIn
                                            ? new Date(
                                                  localFilters.checkIn + 'T00:00:00'
                                              ).toLocaleDateString('fr-FR', {
                                                  day: 'numeric',
                                                  month: 'short',
                                              })
                                            : 'Ajouter'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-caption text-secondary">Départ</p>
                                    <p className="text-body-sm font-medium">
                                        {localFilters.checkOut
                                            ? new Date(
                                                  localFilters.checkOut + 'T00:00:00'
                                              ).toLocaleDateString('fr-FR', {
                                                  day: 'numeric',
                                                  month: 'short',
                                              })
                                            : 'Ajouter'}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </section>

                    <div className="divider" />

                    {/* ===== VILLE ===== */}
                    <section className="mb-8">
                        <h3 className="text-h3 mb-4">Où ?</h3>

                        {/* Champ de recherche */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                            <input
                                type="text"
                                value={citySearch}
                                onChange={(e) => setCitySearch(e.target.value)}
                                placeholder="Rechercher une ville..."
                                className="w-full pl-12 pr-10 py-3 rounded-xl border border-(--color-border-light) text-body focus:border-(--color-text-primary) focus:outline-none"
                            />
                            {isSearchingCity ? (
                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary animate-spin" />
                            ) : citySearch ? (
                                <button
                                    onClick={() => {
                                        setCitySearch('');
                                        setCitySuggestions([]);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2"
                                >
                                    <X className="w-4 h-4 text-tertiary" />
                                </button>
                            ) : null}
                        </div>

                        {/* Ville sélectionnée */}
                        {localFilters.city && !citySearch && (
                            <div className="flex items-center gap-2 mb-4 p-3 bg-primary-light rounded-xl">
                                <MapPin className="w-4 h-4 text-brand" />
                                <span className="text-body-md font-medium text-brand">
                                    {localFilters.city}
                                </span>
                                <button
                                    onClick={() => {
                                        setLocalFilters({ ...localFilters, city: null });
                                        setCitySearch('');
                                    }}
                                    className="ml-auto"
                                >
                                    <X className="w-4 h-4 text-brand" />
                                </button>
                            </div>
                        )}

                        {/* Suggestions de l'API */}
                        {citySuggestions.length > 0 && (
                            <div className="mb-4 rounded-xl border border-(--color-border-light) overflow-hidden">
                                {citySuggestions.map((suggestion, index) => {
                                    const cityName =
                                        suggestion.address?.city ||
                                        suggestion.address?.town ||
                                        suggestion.address?.village ||
                                        suggestion.address?.municipality ||
                                        suggestion.display_name.split(',')[0].trim();
                                    return (
                                        <button
                                            key={suggestion.place_id}
                                            onClick={() => selectCity(suggestion)}
                                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-secondary transition-colors ${
                                                index < citySuggestions.length - 1
                                                    ? 'border-b border-(--color-border-light)'
                                                    : ''
                                            }`}
                                        >
                                            <MapPin className="w-5 h-5 text-tertiary shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-body-md font-medium truncate">
                                                    {cityName}
                                                </p>
                                                <p className="text-caption text-secondary truncate">
                                                    {suggestion.display_name}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Villes populaires (affichées seulement si pas de recherche) */}
                        {!citySearch && (
                            <>
                                <p className="text-caption text-secondary mb-2">
                                    Villes populaires
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {POPULAR_CITIES.slice(0, 8).map((city) => (
                                        <button
                                            key={city}
                                            onClick={() => {
                                                setLocalFilters({ ...localFilters, city });
                                            }}
                                            className={`px-4 py-2 rounded-full text-body-sm transition-colors ${
                                                localFilters.city === city
                                                    ? 'bg-(--color-text-primary) text-white'
                                                    : 'bg-tertiary text-secondary hover:bg-secondary'
                                            }`}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>

                    <div className="divider" />

                    {/* ===== NOMBRE DE VOYAGEURS ===== */}
                    <section className="mb-8">
                        <h3 className="text-h3 mb-4">Voyageurs</h3>
                        <div className="flex items-center justify-between p-4 rounded-xl border border-(--color-border-light)">
                            <div className="flex items-center gap-3">
                                <Dog className="w-5 h-5 icon-secondary" />
                                <div>
                                    <p className="text-body-md">Nombre de chiens</p>
                                    <p className="text-caption text-secondary">
                                        {localFilters.dogsCount}{' '}
                                        {localFilters.dogsCount > 1 ? 'toutous' : 'toutou'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                        localFilters.dogsCount <= 1
                                            ? 'border-tertiary text-tertiary'
                                            : 'border-(--color-text-primary) text-primary'
                                    }`}
                                    onClick={() =>
                                        setLocalFilters({
                                            ...localFilters,
                                            dogsCount: Math.max(1, localFilters.dogsCount - 1),
                                        })
                                    }
                                    disabled={localFilters.dogsCount <= 1}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-6 text-center text-body-md font-medium">
                                    {localFilters.dogsCount}
                                </span>
                                <button
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                        localFilters.dogsCount >= 10
                                            ? 'border-tertiary text-tertiary'
                                            : 'border-(--color-text-primary) text-primary'
                                    }`}
                                    onClick={() =>
                                        setLocalFilters({
                                            ...localFilters,
                                            dogsCount: Math.min(10, localFilters.dogsCount + 1),
                                        })
                                    }
                                    disabled={localFilters.dogsCount >= 10}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </section>

                    <div className="divider" />

                    {/* ===== TYPE DE LOGEMENT ===== */}
                    <section className="mb-8">
                        <h3 className="text-h3 mb-4">Type de logement</h3>
                        <div className="flex flex-col gap-3">
                            {LISTING_TYPES.map((type) => {
                                const isSelected = localFilters.listingTypes.includes(type.value);
                                return (
                                    <button
                                        key={type.value}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                                            isSelected
                                                ? 'border-(--color-text-primary) bg-page'
                                                : 'border-(--color-border-light)'
                                        }`}
                                        onClick={() => toggleListingType(type.value)}
                                    >
                                        <Home className="w-6 h-6 icon" />
                                        <div className="flex-1 text-left">
                                            <p className="text-body-md">{type.label}</p>
                                            <p className="text-caption text-secondary">
                                                {type.description}
                                            </p>
                                        </div>
                                        <div
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                isSelected
                                                    ? 'border-(--color-text-primary) bg-(--color-text-primary)'
                                                    : 'border-(--color-border-light)'
                                            }`}
                                        >
                                            {isSelected && (
                                                <svg
                                                    className="w-3 h-3 text-white"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <div className="divider" />

                    {/* ===== FOURCHETTE DE PRIX ===== */}
                    <section className="mb-8">
                        <h3 className="text-h3 mb-4">Fourchette de prix</h3>
                        <p className="text-caption text-secondary mb-4">Prix par nuit</p>
                        <div className="flex flex-wrap gap-2">
                            {PRICE_RANGES.map((range) => {
                                const isSelected =
                                    localFilters.priceMin === range.min &&
                                    localFilters.priceMax === range.max;
                                return (
                                    <button
                                        key={range.label}
                                        className={`px-4 py-2 rounded-full border transition-colors ${
                                            isSelected
                                                ? 'border-(--color-text-primary) bg-(--color-text-primary) text-white'
                                                : 'border-(--color-border-light) text-primary'
                                        }`}
                                        onClick={() => setPriceRange(range.min, range.max)}
                                    >
                                        {range.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <div className="divider" />

                    {/* ===== OPTION ANTI-CHAT ===== */}
                    <section className="mb-8">
                        <button
                            className="w-full flex items-center justify-between"
                            onClick={() =>
                                setLocalFilters({
                                    ...localFilters,
                                    antiCatOnly: !localFilters.antiCatOnly,
                                })
                            }
                        >
                            <div className="flex items-center gap-4">
                                <Cat className="w-6 h-6 icon" />
                                <div className="text-left">
                                    <p className="text-body-md">Option Anti-Chat</p>
                                    <p className="text-caption text-secondary">
                                        Quartier sans félins
                                    </p>
                                </div>
                            </div>
                            <div
                                className={`w-12 h-7 rounded-full transition-colors ${
                                    localFilters.antiCatOnly
                                        ? 'bg-(--color-text-primary)'
                                        : 'bg-tertiary'
                                }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-white mt-1 transition-transform ${
                                        localFilters.antiCatOnly ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </div>
                        </button>
                    </section>

                    <div className="divider" />

                    {/* ===== NOTE MINIMUM ===== */}
                    <section className="mb-8">
                        <h3 className="text-h3 mb-4">Note minimum</h3>
                        <div className="flex gap-2">
                            {[3, 4, 4.5, 5].map((rating) => {
                                const isSelected = localFilters.minRating === rating;
                                return (
                                    <button
                                        key={rating}
                                        className={`flex items-center gap-1 px-4 py-2 rounded-full border transition-colors ${
                                            isSelected
                                                ? 'border-(--color-text-primary) bg-(--color-text-primary) text-white'
                                                : 'border-(--color-border-light) text-primary'
                                        }`}
                                        onClick={() => setRating(rating)}
                                    >
                                        <Star
                                            className={`w-4 h-4 ${isSelected ? 'fill-white' : 'fill-(--color-text-primary)'}`}
                                        />
                                        <span>{rating}+</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div
                    className="p-4 border-t border-(--color-border-light) bg-white"
                    style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
                >
                    <button className="btn-primary btn-full" onClick={handleApply}>
                        Afficher les résultats
                    </button>
                </div>
            </div>

            {/* Date Picker Modal */}
            <DatePicker
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                checkIn={localFilters.checkIn}
                checkOut={localFilters.checkOut}
                onDateSelect={(checkIn, checkOut) => {
                    setLocalFilters({ ...localFilters, checkIn, checkOut });
                }}
            />

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
