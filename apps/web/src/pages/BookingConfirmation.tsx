import { useState, useEffect } from 'react';
import {
    Check,
    MessageCircle,
    Key,
    Calendar,
    Dog,
    MapPin,
    Home,
    Copy,
    CheckCircle,
} from 'lucide-react';
import type { ListingCardData } from '../data/listings';
import { MOCK_LISTINGS_FULL } from '../data/listings';
import { api } from '../services/api';

/**
 * ==================== PAGE BOOKING CONFIRMATION ====================
 * Page de confirmation apres paiement reussi
 * - Animation de confirmation
 * - Numero de reservation unique
 * - Recap de la reservation
 * - Contact proprietaire
 * - Instructions d'acces au logement
 *
 * TODO API:
 * - GET /api/bookings/:id → recuperer les details de la reservation
 * - GET /api/listings/:id/access → instructions d'acces (code, wifi, parking)
 * - POST /api/bookings/:id/contact-host → envoyer un message a l'hote
 */

interface ListingInstructions {
    checkInTime?: string;
    checkOutTime?: string;
    accessCode?: string;
    wifiName?: string;
    wifiPassword?: string;
    parkingInfo?: string;
    specialNotes?: string;
}

interface BookingConfirmationProps {
    listing: ListingCardData;
    bookingNumber: string;
    checkIn: string;
    checkOut: string;
    dogsCount: number;
    totalPrice: number;
    onGoToTrips: () => void;
    onGoHome: () => void;
}

export const BookingConfirmation = ({
    listing,
    bookingNumber,
    checkIn,
    checkOut,
    dogsCount,
    totalPrice,
    onGoToTrips,
    onGoHome,
}: BookingConfirmationProps) => {
    // Animation états
    const [showCheck, setShowCheck] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [listingInstructions, setListingInstructions] = useState<ListingInstructions | null>(
        null
    );

    // Récupérer les données complètes de l'annonce
    const fullListing = MOCK_LISTINGS_FULL[listing.id];

    // Récupérer les instructions depuis l'API
    useEffect(() => {
        const fetchInstructions = async () => {
            try {
                const response = await api.listings.getById(listing.id);
                if (response.success && response.data?.instructions) {
                    setListingInstructions(response.data.instructions as ListingInstructions);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des instructions:', error);
            }
        };
        fetchInstructions();
    }, [listing.id]);

    // Animation séquencée
    useEffect(() => {
        // Confetti immédiat
        setShowConfetti(true);

        // Check après 300ms
        const checkTimer = setTimeout(() => setShowCheck(true), 300);

        // Contenu après 800ms
        const contentTimer = setTimeout(() => setShowContent(true), 800);

        // Arrêter les confetti après 3s
        const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);

        return () => {
            clearTimeout(checkTimer);
            clearTimeout(contentTimer);
            clearTimeout(confettiTimer);
        };
    }, []);

    // Formater les dates
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Copier le numéro de réservation
    const copyBookingNumber = async () => {
        try {
            await navigator.clipboard.writeText(bookingNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback pour les navigateurs sans clipboard API
        }
    };

    // Instructions d'accès - priorité aux instructions de l'API, sinon mock
    const accessInstructions = {
        checkInTime: listingInstructions?.checkInTime || '15h00',
        checkOutTime: listingInstructions?.checkOutTime || '11h00',
        accessCode: listingInstructions?.accessCode || '1234#',
        parkingInfo:
            listingInstructions?.parkingInfo || 'Espace pour garer ta laisse devant la niche 🅿️',
        wifiName: listingInstructions?.wifiName || 'NicheWifi',
        wifiPassword: listingInstructions?.wifiPassword || 'woofwoof2024',
        specialNotes:
            listingInstructions?.specialNotes ||
            "Ta gamelle d'eau fraîche t'attend ! Les friandises sont dans le placard de gauche, régale-toi 🦴",
        hasCustomInstructions: !!listingInstructions,
    };

    return (
        <div className="fixed inset-0 z-200 bg-white flex flex-col overflow-hidden">
            {/* Confetti animation */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                backgroundColor: [
                                    '#FF6B6B',
                                    '#4ECDC4',
                                    '#FFE66D',
                                    '#95E1D3',
                                    '#F38181',
                                ][i % 5],
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Content */}
            <div
                className="flex-1 overflow-y-auto"
                style={{
                    paddingTop: 'env(safe-area-inset-top)',
                    paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
                }}
            >
                {/* Success animation */}
                <div className="flex flex-col items-center justify-center py-12 px-6">
                    {/* Animated check circle */}
                    <div
                        className={`w-24 h-24 rounded-full bg-(--color-success) flex items-center justify-center mb-6 transition-all duration-500 ${
                            showCheck ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                        }`}
                    >
                        <Check className="w-12 h-12 text-white" strokeWidth={3} />
                    </div>

                    {/* Thank you message */}
                    <h1
                        className={`text-2xl font-semibold text-center mb-2 transition-all duration-500 delay-200 ${
                            showCheck ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                    >
                        Woof ! Ta résa est confirmée ! 🐕
                    </h1>
                    <p
                        className={`text-secondary text-center transition-all duration-500 delay-300 ${
                            showCheck ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                    >
                        Tu vas kiffer cet endroit, promis !
                    </p>
                </div>

                {/* Booking details */}
                <div
                    className={`px-6 transition-all duration-700 ${
                        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                >
                    {/* Booking number */}
                    <div className="bg-secondary rounded-2xl p-4 mb-6">
                        <p className="text-caption text-secondary mb-1">Numéro de réservation</p>
                        <div className="flex items-center justify-between">
                            <span className="text-h3 font-mono font-semibold tracking-wider">
                                {bookingNumber}
                            </span>
                            <button
                                onClick={copyBookingNumber}
                                className="p-2 rounded-full hover:bg-tertiary transition-colors"
                            >
                                {copied ? (
                                    <CheckCircle className="w-5 h-5 text-success" />
                                ) : (
                                    <Copy className="w-5 h-5 text-secondary" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Listing preview */}
                    <div className="flex gap-4 p-4 bg-secondary rounded-2xl mb-6">
                        <img
                            src={listing.image}
                            alt={listing.title}
                            className="w-20 h-20 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-caption text-secondary">{listing.subtitle}</p>
                            <h3 className="text-body-md font-medium truncate">{listing.title}</h3>
                            <div className="flex items-center gap-1 mt-1 text-secondary">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="text-caption">{listing.location}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reservation details */}
                    <div className="space-y-4 mb-6">
                        <h2 className="text-h3">Ton séjour</h2>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                                <p className="text-body-sm font-medium">Tes dates de vacances</p>
                                <p className="text-caption text-secondary">
                                    {formatDate(checkIn)} → {formatDate(checkOut)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center">
                                <Dog className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                                <p className="text-body-sm font-medium">Toi + tes potes</p>
                                <p className="text-caption text-secondary">
                                    {dogsCount} {dogsCount > 1 ? 'toutous' : 'toutou'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center">
                                <span className="text-secondary font-medium">🦴</span>
                            </div>
                            <div>
                                <p className="text-body-sm font-medium">Total (en croquettes)</p>
                                <p className="text-caption text-secondary">
                                    {totalPrice.toLocaleString('fr-FR')} €
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Host contact */}
                    {fullListing?.host && (
                        <div className="border border-(--color-border-light) rounded-2xl p-4 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <img
                                    src={fullListing.host.avatar}
                                    alt={fullListing.host.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <p className="text-body-md font-medium">
                                        {fullListing.host.name}
                                    </p>
                                    <p className="text-caption text-secondary">
                                        Ton hôte (super sympa 🐾)
                                    </p>
                                </div>
                            </div>
                            <button className="w-full btn-secondary flex items-center justify-center gap-2 py-3">
                                <MessageCircle className="w-5 h-5" />
                                <span>Envoyer un woof à {fullListing.host.name.split(' ')[0]}</span>
                            </button>
                        </div>
                    )}

                    {/* Access instructions */}
                    {accessInstructions && (
                        <div className="border border-(--color-border-light) rounded-2xl overflow-hidden mb-6">
                            <button
                                onClick={() => setShowInstructions(!showInstructions)}
                                className="w-full flex items-center justify-between p-4 hover:bg-secondary transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-warning-light flex items-center justify-center">
                                        <Key className="w-5 h-5 text-warning" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-body-md font-medium">
                                            Instructions d'accès
                                        </p>
                                        <p className="text-caption text-secondary">
                                            Arrivée à {accessInstructions.checkInTime}
                                        </p>
                                    </div>
                                </div>
                                <svg
                                    className={`w-5 h-5 text-secondary transition-transform ${
                                        showInstructions ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {showInstructions && (
                                <div className="px-4 pb-4 space-y-4 border-t border-(--color-border-light) pt-4">
                                    <div>
                                        <p className="text-caption text-secondary mb-1">Horaires</p>
                                        <p className="text-body-sm">
                                            Arrivée : {accessInstructions.checkInTime} • Départ :{' '}
                                            {accessInstructions.checkOutTime}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-caption text-secondary mb-1">
                                            Code d'accès
                                        </p>
                                        <p className="text-body-sm font-mono bg-tertiary px-3 py-2 rounded-lg">
                                            {accessInstructions.accessCode}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-caption text-secondary mb-1">WiFi</p>
                                        <p className="text-body-sm">
                                            <span className="text-secondary">Réseau :</span>{' '}
                                            {accessInstructions.wifiName}
                                            <br />
                                            <span className="text-secondary">
                                                Mot de passe :
                                            </span>{' '}
                                            {accessInstructions.wifiPassword}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-caption text-secondary mb-1">Parking</p>
                                        <p className="text-body-sm">
                                            {accessInstructions.parkingInfo}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-caption text-secondary mb-1">
                                            Note de l'hôte
                                        </p>
                                        <p className="text-body-sm italic">
                                            {accessInstructions.specialNotes}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom buttons */}
            <div
                className="shrink-0 bg-white border-t border-(--color-border-light) px-4 sm:px-6 py-4"
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
            >
                <div className="flex gap-2 sm:gap-3">
                    <button
                        onClick={onGoHome}
                        className="flex-1 min-w-0 btn-secondary py-3 sm:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                        <Home className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span className="truncate">Accueil</span>
                    </button>
                    <button
                        onClick={onGoToTrips}
                        className="flex-1 min-w-0 btn-primary py-3 sm:py-3.5 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        <span className="truncate">Mes voyages</span>
                    </button>
                </div>
            </div>

            {/* Confetti CSS */}
            <style>{`
                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    top: -20px;
                    animation: fall 3s linear forwards;
                }

                @keyframes fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

/**
 * Générer un numéro de réservation unique
 * Format: BARK-XXXXXX (6 caractères alphanumériques)
 */
export const generateBookingNumber = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BARK-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
