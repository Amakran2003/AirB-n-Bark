import { useState, useEffect, useRef } from 'react';
import { X, Calendar, Home, Cat, Star, Dog, Minus, Plus } from 'lucide-react';
import { useFilters, FilterState } from '../contexts/FilterContext';
import { DatePicker } from './DatePicker';
import type { ListingType } from '../data/listings';

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
    { value: 'niche', label: 'Niche entière', description: 'Un logement rien que pour ton chien' },
    { value: 'nicholoc', label: 'Nicholoc', description: 'Une chambre dans une coloc canine' },
    { value: 'nichortoir', label: 'Nichortoir', description: 'Un lit dans un dortoir de chiens' },
];

// Fourchettes de prix prédéfinies
const PRICE_RANGES = [
    { min: 0, max: 25, label: '0 - 25€' },
    { min: 25, max: 50, label: '25 - 50€' },
    { min: 50, max: 100, label: '50 - 100€' },
    { min: 100, max: null, label: '100€+' },
];

export const FilterModal = () => {
    const { filters, setFilters, resetFilters, isFilterModalOpen, closeFilterModal } = useFilters();

    // État local pour les modifications avant d'appliquer
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
                        <div className="w-10 h-1 bg-gray-300 rounded-full" />
                    </div>
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-[#ebebeb]">
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
                            className="w-full flex items-center gap-3 p-4 rounded-xl border border-[#dddddd]"
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

                    {/* ===== NOMBRE DE VOYAGEURS ===== */}
                    <section className="mb-8">
                        <h3 className="text-h3 mb-4">Voyageurs</h3>
                        <div className="flex items-center justify-between p-4 rounded-xl border border-[#dddddd]">
                            <div className="flex items-center gap-3">
                                <Dog className="w-5 h-5 icon-secondary" />
                                <div>
                                    <p className="text-body-md">Nombre de chiens</p>
                                    <p className="text-caption text-secondary">
                                        {localFilters.dogsCount} {localFilters.dogsCount > 1 ? 'toutous' : 'toutou'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                        localFilters.dogsCount <= 1
                                            ? 'border-gray-200 text-gray-300'
                                            : 'border-[#222222] text-[#222222]'
                                    }`}
                                    onClick={() => setLocalFilters({ ...localFilters, dogsCount: Math.max(1, localFilters.dogsCount - 1) })}
                                    disabled={localFilters.dogsCount <= 1}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-6 text-center text-body-md font-medium">{localFilters.dogsCount}</span>
                                <button
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                        localFilters.dogsCount >= 10
                                            ? 'border-gray-200 text-gray-300'
                                            : 'border-[#222222] text-[#222222]'
                                    }`}
                                    onClick={() => setLocalFilters({ ...localFilters, dogsCount: Math.min(10, localFilters.dogsCount + 1) })}
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
                                                ? 'border-[#222222] bg-[#f7f7f7]'
                                                : 'border-[#dddddd]'
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
                                                    ? 'border-[#222222] bg-[#222222]'
                                                    : 'border-[#dddddd]'
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
                                                ? 'border-[#222222] bg-[#222222] text-white'
                                                : 'border-[#dddddd] text-[#222222]'
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
                                    localFilters.antiCatOnly ? 'bg-[#222222]' : 'bg-[#e5e5e5]'
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
                                                ? 'border-[#222222] bg-[#222222] text-white'
                                                : 'border-[#dddddd] text-[#222222]'
                                        }`}
                                        onClick={() => setRating(rating)}
                                    >
                                        <Star
                                            className={`w-4 h-4 ${isSelected ? 'fill-white' : 'fill-[#222222]'}`}
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
                    className="p-4 border-t border-[#ebebeb] bg-white"
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
