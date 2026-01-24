import { useState } from 'react';
import { ChevronLeft, CreditCard, Lock, Check, AlertCircle } from 'lucide-react';
import type { ListingCardData } from '../data/listings';
import { useSwipeBack } from '../hooks/useSwipeBack';

/**
 * ==================== PAGE PAYMENT ====================
 * Page de paiement pour confirmer une reservation
 * - Recap de la reservation
 * - Formulaire de carte bancaire
 * 
 * TODO API:
 * - POST /api/payments/intent → creer un payment intent Stripe
 * - POST /api/payments/confirm → confirmer le paiement
 * - GET /api/payments/:id/status → verifier le statut
 * - POST /api/bookings → creer la reservation apres paiement
 * - Integration Stripe Elements pour Apple Pay / Google Pay
 */

interface PaymentProps {
    listing: ListingCardData;
    checkIn: string;
    checkOut: string;
    dogsCount: number;
    totalPrice: number;
    serviceFee: number;
    onBack: () => void;
    onSuccess: () => void;
}

// Frais d'annulation (20% du total si pas d'annulation gratuite)
export const CANCELLATION_FEE_PERCENT = 0.20;

export const Payment = ({
    listing,
    checkIn,
    checkOut,
    dogsCount,
    totalPrice,
    serviceFee,
    onBack,
    onSuccess,
}: PaymentProps) => {
    // État du formulaire
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Swipe retour avec le hook
    const { containerStyle } = useSwipeBack(onBack);

    // Formater le numéro de carte (4 chiffres par groupe)
    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 16);
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ') : cleaned;
    };

    // Formater la date d'expiration (MM/YY)
    const formatExpiryDate = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 4);
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        }
        return cleaned;
    };

    // Calculer le nombre de nuits
    const nights = Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Formater les dates
    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Valider le formulaire
    const isFormValid =
        cardNumber.replace(/\s/g, '').length === 16 &&
        expiryDate.length === 5 &&
        cvv.length >= 3 &&
        cardHolder.trim().length >= 3;

    // Traiter le paiement
    const handlePayment = async () => {
        if (!isFormValid) return;

        setIsProcessing(true);
        setError(null);

        // TODO: Intégrer Stripe pour le vrai paiement
        // Pour l'instant, on simule un délai de traitement
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Simuler un succès (dans 95% des cas)
        if (Math.random() > 0.05) {
            setIsProcessing(false);
            onSuccess();
        } else {
            setIsProcessing(false);
            setError('Le paiement a échoué. Veuillez vérifier vos informations.');
        }
    };

    const grandTotal = totalPrice + serviceFee;

    return (
        <div className="fixed inset-0 z-150 bg-white flex flex-col" style={containerStyle}>
            {/* Header */}
            <header
                className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-[#ebebeb]"
                style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
            >
                <button className="btn-icon" onClick={onBack}>
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-h3 font-semibold">Paiement</span>
                <div className="w-10" />
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                    {/* Récap réservation */}
                    <div className="flex gap-4 pb-6 border-b border-[#ebebeb]">
                        <img
                            src={listing.image}
                            alt={listing.title}
                            className="w-20 h-20 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                            <p className="text-caption text-secondary">{listing.subtitle}</p>
                            <h3 className="text-body-md font-medium">{listing.title}</h3>
                            <p className="text-caption text-secondary mt-1">
                                {formatDate(checkIn)} → {formatDate(checkOut)}
                            </p>
                            <p className="text-caption text-secondary">
                                {dogsCount} {dogsCount > 1 ? 'toutous' : 'toutou'} · {nights} nuit{nights > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Détail prix */}
                    <div className="py-6 border-b border-[#ebebeb]">
                        <h2 className="text-h3 mb-4">Détails du prix</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between text-body">
                                <span>€{listing.price} x {nights} nuit{nights > 1 ? 's' : ''}</span>
                                <span>€{totalPrice}</span>
                            </div>
                            <div className="flex justify-between text-body">
                                <span>Frais de service</span>
                                <span>€{serviceFee}</span>
                            </div>
                            <div className="flex justify-between text-body-md font-semibold pt-3 border-t border-[#ebebeb]">
                                <span>Total</span>
                                <span>€{grandTotal}</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulaire de paiement */}
                    <div className="py-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="w-5 h-5" />
                            <h2 className="text-h3">Carte bancaire</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Numéro de carte */}
                            <div>
                                <label className="text-caption text-secondary block mb-1">
                                    Numéro de carte
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="1234 5678 9012 3456"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    className="w-full px-4 py-3 border border-[#ebebeb] rounded-xl text-body focus:outline-none focus:border-[#3B82F6]"
                                />
                            </div>

                            {/* Date d'expiration et CVV */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-caption text-secondary block mb-1">
                                        Date d'expiration
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="MM/YY"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                                        className="w-full px-4 py-3 border border-[#ebebeb] rounded-xl text-body focus:outline-none focus:border-[#3B82F6]"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-caption text-secondary block mb-1">
                                        CVV
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="123"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="w-full px-4 py-3 border border-[#ebebeb] rounded-xl text-body focus:outline-none focus:border-[#3B82F6]"
                                    />
                                </div>
                            </div>

                            {/* Titulaire de la carte */}
                            <div>
                                <label className="text-caption text-secondary block mb-1">
                                    Titulaire de la carte
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nom sur la carte"
                                    value={cardHolder}
                                    onChange={(e) => setCardHolder(e.target.value)}
                                    className="w-full px-4 py-3 border border-[#ebebeb] rounded-xl text-body focus:outline-none focus:border-[#3B82F6]"
                                />
                            </div>
                        </div>

                        {/* Message d'erreur */}
                        {error && (
                            <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Sécurité */}
                        <div className="flex items-center gap-2 mt-6 text-caption text-secondary">
                            <Lock className="w-4 h-4" />
                            <span>Paiement sécurisé. Vos données sont chiffrées.</span>
                        </div>

                        {/* TODO: Apple Pay / Google Pay */}
                        {/* 
                        <div className="mt-6">
                            <p className="text-caption text-secondary text-center mb-3">ou payer avec</p>
                            <div className="flex gap-3">
                                <button className="flex-1 py-3 border border-[#ebebeb] rounded-xl flex items-center justify-center gap-2">
                                    Apple Pay
                                </button>
                                <button className="flex-1 py-3 border border-[#ebebeb] rounded-xl flex items-center justify-center gap-2">
                                    Google Pay
                                </button>
                            </div>
                        </div>
                        */}
                    </div>
                </div>
            </div>

            {/* Footer - Bouton payer */}
            <div
                className="shrink-0 bg-white shadow-md px-6 pt-4 border-t border-gray-200"
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
            >
                <button
                    className={`btn-primary btn-full ${!isFormValid || isProcessing ? 'btn-disabled' : ''}`}
                    onClick={handlePayment}
                    disabled={!isFormValid || isProcessing}
                >
                    {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Traitement en cours...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Check className="w-5 h-5" />
                            Payer €{grandTotal}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};
