import { useState, useMemo } from 'react';
import {
    ChevronLeft,
    Calendar,
    Dog,
    Users,
    Clock,
    Check,
    Minus,
    Plus,
    AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFilters } from '../contexts/FilterContext';
import { useBookings, type Booking } from '../contexts/BookingContext';
import { DatePicker } from './DatePicker';
import { Payment } from '../pages/Payment';
import { BookingConfirmation } from '../pages/BookingConfirmation';
import type { ListingCardData } from '../data/listings';
import { MOCK_LISTINGS_FULL } from '../data/listings';
import { useSwipeBack } from '../hooks/useSwipeBack';

/**
 * ==================== BOOKING RECAP ====================
 * Page de recap de reservation avant authentification
 * - Affiche les infos de l'annonce
 * - Selection des dates (modifiables)
 * - Bouton Next → Auth si pas connecte
 * - Swipe retour comme sur ListingDetails
 *
 * TODO API:
 * - GET /api/listings/:id/availability → verifier la disponibilite
 * - GET /api/listings/:id/price → calculer le prix (avec promos)
 * - POST /api/bookings/quote → obtenir un devis
 */

interface BookingRecapProps {
    listing: ListingCardData;
    onBack: () => void;
    onConfirm: () => void;
    onGoToTrips?: () => void;
}

export const BookingRecap = ({
    listing,
    onBack,
    onConfirm,
    onGoToTrips: onGoToTripsExternal,
}: BookingRecapProps) => {
    const { isAuthenticated, openAuthModal } = useAuth();
    const { filters } = useFilters();
    const { createBooking } = useBookings();

    // Récupérer les données complètes pour hasFreeCancellation
    const fullListing = MOCK_LISTINGS_FULL[listing.id];
    const hasFreeCancellation = fullListing?.pricing?.hasFreeCancellation ?? false;

    // Dates de réservation - initialisées depuis les filtres ou null
    const [checkIn, setCheckIn] = useState<string | null>(filters.checkIn);
    const [checkOut, setCheckOut] = useState<string | null>(filters.checkOut);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Nombre de voyageurs (chiens) - initialisé depuis les filtres
    const [dogsCount, setDogsCount] = useState(filters.dogsCount || 1);
    const maxDogs = listing.maxDogs || 1;

    // Afficher la page de paiement
    const [showPayment, setShowPayment] = useState(false);

    // Afficher la page de confirmation
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

    // Validation des dates - vérifier si elles sont dans les plages disponibles
    const datesValidation = useMemo(() => {
        if (!checkIn || !checkOut) {
            return { isValid: false, error: null };
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        // Chercher une plage qui contient les dates
        const validRange = listing.availableDateRanges?.find((range) => {
            const rangeStart = new Date(range.start);
            const rangeEnd = new Date(range.end);
            return checkInDate >= rangeStart && checkOutDate <= rangeEnd;
        });

        if (validRange) {
            return { isValid: true, error: null };
        }

        // Pas de plage valide - formater les plages disponibles pour l'affichage
        const availableRangesText = listing.availableDateRanges
            ?.map((range) => {
                const start = new Date(range.start + 'T00:00:00').toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                });
                const end = new Date(range.end + 'T00:00:00').toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
                return `${start} - ${end}`;
            })
            .join(', ');

        return {
            isValid: false,
            error: `Ces dates ne sont pas disponibles. Plages disponibles : ${availableRangesText || 'Aucune'}`,
        };
    }, [checkIn, checkOut, listing.availableDateRanges]);

    // Validation du nombre de chiens
    const dogsValidation = useMemo(() => {
        if (dogsCount > maxDogs) {
            return {
                isValid: false,
                error: `Woof ! Cette niche accepte max ${maxDogs} ${maxDogs > 1 ? 'toutous' : 'toutou'} 🐕`,
            };
        }
        return { isValid: true, error: null };
    }, [dogsCount, maxDogs]);

    // Est-ce que la réservation est valide ?
    const isBookingValid = checkIn && checkOut && datesValidation.isValid && dogsValidation.isValid;

    // Swipe retour avec le hook
    const { containerStyle } = useSwipeBack(onBack);

    // Calculer le nombre de nuits
    const nights = useMemo(() => {
        if (!checkIn || !checkOut) return 1;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    }, [checkIn, checkOut]);

    // Formater les dates pour l'affichage
    const formatDisplayDate = (dateStr: string | null): string => {
        if (!dateStr) return 'À définir';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleNext = async () => {
        if (!isAuthenticated) {
            openAuthModal();
        } else {
            // Ouvrir la page de paiement
            setShowPayment(true);
        }
    };

    // Callback après paiement réussi
    const handlePaymentSuccess = async () => {
        // Créer la réservation
        if (checkIn && checkOut) {
            try {
                const booking = await createBooking({
                    listingId: listing.id,
                    startDate: checkIn,
                    endDate: checkOut,
                    dogsCount,
                    totalPrice: total,
                    hasFreeCancellation,
                });
                setConfirmedBooking(booking);
                setShowPayment(false);
                setShowConfirmation(true);
            } catch (error) {
                console.error('Erreur lors de la création de la réservation:', error);
                alert(
                    error instanceof Error
                        ? error.message
                        : 'Erreur lors de la réservation. Veuillez réessayer.'
                );
                setShowPayment(false);
            }
        }
    };

    // Callback pour aller aux voyages depuis la confirmation
    const handleGoToTrips = () => {
        setShowConfirmation(false);
        onConfirm();
        // Naviguer vers les voyages
        if (onGoToTripsExternal) {
            onGoToTripsExternal();
        }
    };

    // Callback pour retourner à l'accueil depuis la confirmation
    const handleGoHome = () => {
        setShowConfirmation(false);
        onBack();
    };

    const handleDateSelect = (newCheckIn: string | null, newCheckOut: string | null) => {
        setCheckIn(newCheckIn);
        setCheckOut(newCheckOut);
    };

    const totalPrice = listing.price * nights;
    const serviceFee = Math.round(totalPrice * 0.12);
    const total = totalPrice + serviceFee;

    return (
        <>
            {/* Main container - captures all touch events */}
            <div className="fixed inset-0 z-150 bg-white flex flex-col" style={containerStyle}>
                {/* Header */}
                <div
                    className="shrink-0 flex items-center justify-between p-4 border-b border-(--color-border-light) bg-white"
                    style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
                >
                    <button className="btn-icon" onClick={onBack}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-body-md">Confirmer ton séjour</span>
                    <div className="w-10" />
                </div>

                {/* Content - scrollable area */}
                <div
                    className="flex-1 overflow-y-auto touch-auto overscroll-contain"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="p-6">
                        {/* Listing preview */}
                        <div className="flex gap-4 pb-6 border-b border-(--color-border-light)">
                            <img
                                src={listing.image}
                                alt={listing.title}
                                className="w-24 h-24 rounded-xl object-cover"
                                decoding="async"
                            />
                            <div className="flex-1">
                                <p className="text-caption text-secondary">{listing.subtitle}</p>
                                <h3 className="text-body-md mt-1">{listing.title}</h3>
                                <div className="flex items-center gap-1 mt-2">
                                    <span className="text-body-sm">★ {listing.rating}</span>
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="py-6 border-b border-(--color-border-light)">
                            <h2 className="text-h3 mb-4">Ton séjour 🐕</h2>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 icon-secondary" />
                                        <div>
                                            <p className="text-body-md">Dates</p>
                                            <p className="text-caption text-secondary">
                                                {formatDisplayDate(checkIn)} →{' '}
                                                {formatDisplayDate(checkOut)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="text-body-sm underline"
                                        onClick={() => setIsDatePickerOpen(true)}
                                    >
                                        Modifier
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Dog className="w-5 h-5 icon-secondary" />
                                        <div>
                                            <p className="text-body-md">Toi + tes potes</p>
                                            <p className="text-caption text-secondary">
                                                {dogsCount} {dogsCount > 1 ? 'toutous' : 'toutou'}{' '}
                                                (max {maxDogs})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                                dogsCount <= 1
                                                    ? 'border-tertiary text-tertiary'
                                                    : 'border-(--color-text-primary) text-primary'
                                            }`}
                                            onClick={() => setDogsCount(Math.max(1, dogsCount - 1))}
                                            disabled={dogsCount <= 1}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-6 text-center text-body-md font-medium">
                                            {dogsCount}
                                        </span>
                                        <button
                                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                                                dogsCount >= maxDogs
                                                    ? 'border-tertiary text-tertiary'
                                                    : 'border-(--color-text-primary) text-primary'
                                            }`}
                                            onClick={() =>
                                                setDogsCount(Math.min(maxDogs, dogsCount + 1))
                                            }
                                            disabled={dogsCount >= maxDogs}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages d'erreur */}
                        {(!datesValidation.isValid && datesValidation.error) ||
                        (!dogsValidation.isValid && dogsValidation.error) ? (
                            <div className="py-4">
                                {!datesValidation.isValid && datesValidation.error && (
                                    <div className="flex items-start gap-3 p-4 bg-error-light border border-error-light rounded-xl mb-3">
                                        <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                                        <p className="text-sm text-error">
                                            {datesValidation.error}
                                        </p>
                                    </div>
                                )}
                                {!dogsValidation.isValid && dogsValidation.error && (
                                    <div className="flex items-start gap-3 p-4 bg-error-light border border-error-light rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                                        <p className="text-sm text-error">{dogsValidation.error}</p>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Price details */}
                        <div className="py-6 border-b border-(--color-border-light)">
                            <h2 className="text-h3 mb-4">Détails du prix</h2>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-body">
                                        €{listing.price} x {nights} nuit{nights > 1 ? 's' : ''}
                                    </span>
                                    <span className="text-body">€{totalPrice}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-body">Frais de service</span>
                                    <span className="text-body">€{serviceFee}</span>
                                </div>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="py-6">
                            <div className="flex items-center justify-between">
                                <span className="text-h3">Total</span>
                                <span className="text-h3">€{total}</span>
                            </div>
                        </div>

                        {/* Infos */}
                        <div className="card flex flex-col gap-3">
                            {hasFreeCancellation && (
                                <div className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                                    <p className="text-body-sm">Annulation gratuite sous 24h</p>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 icon-secondary shrink-0 mt-0.5" />
                                <p className="text-body-sm">Check-in à partir de 14h00</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="w-5 h-5 icon-secondary shrink-0 mt-0.5" />
                                <p className="text-body-sm">Hébergé par {listing.hostName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Inside the main container */}
                <div
                    className="shrink-0 bg-white shadow-md px-6 pt-4 border-t border-(--color-border-light)"
                    style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
                >
                    <button
                        className={'btn-primary btn-full'}
                        onClick={
                            !checkIn || !checkOut
                                ? () => setIsDatePickerOpen(true)
                                : isBookingValid
                                  ? handleNext
                                  : undefined
                        }
                        disabled={!!(checkIn && checkOut && !isBookingValid)}
                    >
                        {!checkIn || !checkOut
                            ? 'Choisir les dates'
                            : !isBookingValid
                              ? 'Réservation impossible'
                              : 'Continuer'}
                    </button>
                </div>
            </div>

            {/* Date Picker Modal */}
            <DatePicker
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                checkIn={checkIn}
                checkOut={checkOut}
                onDateSelect={handleDateSelect}
                availableDateRanges={listing.availableDateRanges}
            />

            {/* Page Payment */}
            {showPayment && checkIn && checkOut && (
                <Payment
                    listing={listing}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    dogsCount={dogsCount}
                    totalPrice={totalPrice}
                    serviceFee={serviceFee}
                    onBack={() => setShowPayment(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {/* Page Confirmation */}
            {showConfirmation && confirmedBooking && checkIn && checkOut && (
                <BookingConfirmation
                    listing={listing}
                    bookingNumber={confirmedBooking.bookingNumber}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    dogsCount={dogsCount}
                    totalPrice={total}
                    onGoToTrips={handleGoToTrips}
                    onGoHome={handleGoHome}
                />
            )}
        </>
    );
};
