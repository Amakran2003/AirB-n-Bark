import { useState } from 'react';
import { Calendar, MapPin, MoreHorizontal, X, AlertTriangle, Check } from 'lucide-react';
import { BottomNavbar } from '../components/BottomNavbar';
import { EmptyState } from '../components/EmptyState';
import { useBookings, Booking } from '../contexts/BookingContext';
import { getListingById } from '../data/listings';
import { CANCELLATION_FEE_PERCENT } from './Payment';
import { formatDateRange, calculateNights } from '../utils/dateFormatters';

/**
 * ==================== PAGE TRIPS (MES RESERVATIONS) ====================
 * Affiche toutes les reservations de l'utilisateur
 * - Reservations a venir / passees
 * - Possibilite d'annuler ou modifier
 *
 * API Status:
 * - GET /api/bookings ✓ (réservations utilisateur)
 * - GET /api/bookings/:id ✓ (détails réservation)
 * - PUT /api/bookings/:id → non implémenté (modifier dates)
 * - DELETE /api/bookings/:id → utiliser cancel à la place
 * - POST /api/bookings/:id/cancel ✓ (annulation)
 */

interface TripsProps {
    onTabChange?: (tab: 'home' | 'trips' | 'messages' | 'profile') => void;
}

type BookingTab = 'upcoming' | 'past';

export const Trips = ({ onTabChange }: TripsProps) => {
    const { bookings, cancelBooking } = useBookings();
    const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showModifyModal, setShowModifyModal] = useState(false);

    // Séparer les réservations à venir et passées
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingBookings = bookings.filter((b) => {
        const endDate = new Date(b.endDate);
        return endDate >= today && b.status !== 'cancelled' && b.status !== 'rejected';
    });

    const pastBookings = bookings.filter((b) => {
        const endDate = new Date(b.endDate);
        return endDate < today || b.status === 'cancelled' || b.status === 'rejected';
    });

    const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

    // Gérer l'annulation
    const handleCancel = () => {
        if (selectedBooking) {
            cancelBooking(selectedBooking.id);
            setShowCancelModal(false);
            setSelectedBooking(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-white flex flex-col">
            {/* Header */}
            <header
                className="shrink-0 flex items-center justify-center px-4 py-4 border-b border-(--color-border-light)"
                style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
            >
                <h1 className="text-h2">Mes voyages</h1>
            </header>

            {/* Tabs */}
            <div className="shrink-0 flex border-b border-(--color-border-light)">
                <button
                    className={`flex-1 py-4 text-center text-body-md transition-colors ${
                        activeTab === 'upcoming'
                            ? 'text-(--color-text-primary) border-b-2 border-(--color-secondary) font-medium'
                            : 'text-secondary'
                    }`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    À venir ({upcomingBookings.length})
                </button>
                <button
                    className={`flex-1 py-4 text-center text-body-md transition-colors ${
                        activeTab === 'past'
                            ? 'text-(--color-text-primary) border-b-2 border-(--color-secondary) font-medium'
                            : 'text-secondary'
                    }`}
                    onClick={() => setActiveTab('past')}
                >
                    Passées ({pastBookings.length})
                </button>
            </div>

            {/* Content */}
            <div
                className="flex-1 overflow-y-auto"
                style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
            >
                {displayedBookings.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title={
                            activeTab === 'upcoming' ? 'Aucun voyage prévu' : 'Aucun voyage passé'
                        }
                        description={
                            activeTab === 'upcoming'
                                ? 'Swipe sur les annonces pour trouver ta prochaine niche de reve'
                                : "Tes anciens voyages s'afficheront ici"
                        }
                    />
                ) : (
                    <div className="p-4 space-y-4">
                        {displayedBookings.map((booking) => {
                            // Utiliser les données dénormalisées du booking, sinon fallback sur getListingById
                            const listing = booking.listingTitle
                                ? {
                                      id: booking.listingId,
                                      title: booking.listingTitle,
                                      subtitle: booking.listingLocation || '',
                                      image: booking.listingImage || '/placeholder-dog.svg',
                                      location: booking.listingLocation || '',
                                      price:
                                          booking.listingPrice ||
                                          booking.totalPrice /
                                              calculateNights(booking.startDate, booking.endDate),
                                  }
                                : getListingById(booking.listingId);

                            if (!listing) return null;

                            const nights = calculateNights(booking.startDate, booking.endDate);
                            const isCancelled = booking.status === 'cancelled';
                            const isRejected = booking.status === 'rejected';
                            const isInactive = isCancelled || isRejected;

                            return (
                                <div
                                    key={booking.id}
                                    className={`card p-4 ${isInactive ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex gap-4">
                                        <img
                                            src={listing.image}
                                            alt={listing.title}
                                            className="w-24 h-24 rounded-xl object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-caption text-secondary truncate">
                                                        {listing.subtitle}
                                                    </p>
                                                    <h3 className="text-body-md font-medium truncate">
                                                        {listing.title}
                                                    </h3>
                                                </div>
                                                {!isInactive && activeTab === 'upcoming' && (
                                                    <button
                                                        className="btn-icon shrink-0"
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setShowModifyModal(true);
                                                        }}
                                                    >
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 mt-2 text-caption text-secondary">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {formatDateRange(
                                                        booking.startDate,
                                                        booking.endDate
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 mt-1 text-caption text-secondary">
                                                <MapPin className="w-4 h-4" />
                                                <span className="truncate">{listing.location}</span>
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                <span className="text-body-md font-medium">
                                                    €{listing.price * nights}
                                                </span>
                                                {isRejected && (
                                                    <span className="px-2 py-1 status-rejected text-caption rounded-full">
                                                        Refusée
                                                    </span>
                                                )}
                                                {isCancelled && (
                                                    <span className="px-2 py-1 status-cancelled text-caption rounded-full">
                                                        Annulée
                                                    </span>
                                                )}
                                                {booking.status === 'confirmed' && !isInactive && (
                                                    <span className="px-2 py-1 status-confirmed text-caption rounded-full">
                                                        Confirmée
                                                    </span>
                                                )}
                                                {booking.status === 'pending' && (
                                                    <span className="px-2 py-1 status-pending text-caption rounded-full">
                                                        En attente
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Navbar */}
            <BottomNavbar activeTab="trips" onTabChange={onTabChange} />

            {/* Modal Options (Modifier/Annuler) */}
            {showModifyModal && selectedBooking && (
                <div className="fixed inset-0 z-200 bg-black/50 flex items-end">
                    <div
                        className="w-full bg-white rounded-t-3xl animate-slide-up"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-h2">Gérer ton séjour</h2>
                                <button
                                    className="btn-icon"
                                    onClick={() => {
                                        setShowModifyModal(false);
                                        setSelectedBooking(null);
                                    }}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <button
                                    className="w-full py-4 px-4 text-left text-body-md border border-(--color-border-light) rounded-xl hover:bg-secondary transition-colors"
                                    onClick={() => {
                                        // Fonctionnalité non implémentée
                                        setShowModifyModal(false);
                                        alert('Fonctionnalité à venir : Modifier les dates');
                                    }}
                                >
                                    Modifier les dates
                                </button>

                                <button
                                    className="w-full py-4 px-4 text-left text-error text-body-md border border-(--color-error-light) rounded-xl hover:bg-error-lighter transition-colors"
                                    onClick={() => {
                                        setShowModifyModal(false);
                                        setShowCancelModal(true);
                                    }}
                                >
                                    Annuler le sejour
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmation Annulation */}
            {showCancelModal &&
                selectedBooking &&
                (() => {
                    const hasFreeCancellation = selectedBooking.hasFreeCancellation;
                    const cancellationFee = hasFreeCancellation
                        ? 0
                        : Math.round(selectedBooking.totalPrice * CANCELLATION_FEE_PERCENT);
                    const refundAmount = selectedBooking.totalPrice - cancellationFee;

                    return (
                        <div className="fixed inset-0 z-200 bg-black/50 flex items-center justify-center p-6">
                            <div className="w-full max-w-sm bg-white rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            hasFreeCancellation
                                                ? 'bg-success-light'
                                                : 'bg-error-light'
                                        }`}
                                    >
                                        {hasFreeCancellation ? (
                                            <Check className="w-6 h-6 text-success" />
                                        ) : (
                                            <AlertTriangle className="w-6 h-6 text-error" />
                                        )}
                                    </div>
                                    <h2 className="text-h2">Annuler ton séjour ?</h2>
                                </div>

                                {hasFreeCancellation ? (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 p-3 bg-success-lighter border border-(--color-success-light) rounded-xl mb-3">
                                            <Check className="w-5 h-5 text-success shrink-0" />
                                            <p className="text-sm text-(--color-success-dark)">
                                                Annulation gratuite ! Tu seras rembourse
                                                integralement
                                            </p>
                                        </div>
                                        <p className="text-body text-secondary">
                                            Montant remboursé :{' '}
                                            <span className="font-semibold text-success">
                                                €{refundAmount}
                                            </span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mb-6">
                                        <div className="flex items-start gap-2 p-3 bg-warning-lighter border border-(--color-warning-light) rounded-xl mb-3">
                                            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-(--color-warning-dark) font-medium">
                                                    Aie, des frais s'appliquent
                                                </p>
                                                <p className="text-sm text-warning mt-1">
                                                    Cette niche n'offre pas l'annulation gratuite.
                                                    {Math.round(CANCELLATION_FEE_PERCENT * 100)}% de
                                                    frais seront prélevés sur tes croquettes.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-body">
                                            <div className="flex justify-between">
                                                <span className="text-secondary">Montant payé</span>
                                                <span>€{selectedBooking.totalPrice}</span>
                                            </div>
                                            <div className="flex justify-between text-error">
                                                <span>Frais d'annulation</span>
                                                <span>-€{cancellationFee}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold pt-2 border-t border-(--color-border-light)">
                                                <span>Montant remboursé</span>
                                                <span className="text-success">
                                                    €{refundAmount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 btn-secondary"
                                        onClick={() => {
                                            setShowCancelModal(false);
                                            setSelectedBooking(null);
                                        }}
                                    >
                                        Retour
                                    </button>
                                    <button
                                        className="flex-1 py-3 px-4 bg-(--color-error) text-white rounded-xl font-medium hover:bg-(--color-error-dark) transition-colors"
                                        onClick={handleCancel}
                                    >
                                        {hasFreeCancellation
                                            ? 'Annuler'
                                            : `Annuler (-€${cancellationFee})`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
        </div>
    );
};
