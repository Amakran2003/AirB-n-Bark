import { useState } from 'react';
import { ChevronLeft, CreditCard, Lock, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import type { ListingCardData } from '../data/listings';
import { useSwipeBack } from '../hooks/useSwipeBack';

/**
 * ==================== PAGE PAYMENT ====================
 * Page de paiement avec integration Stripe
 */

// Charger Stripe avec la cle publique
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

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

// Style pour les elements Stripe - taille reduite pour mobile
const elementStyle = {
    base: {
        fontSize: '14px',
        color: '#1a1a1a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
            color: '#a1a1aa',
            fontSize: '14px',
        },
    },
    invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
    },
    complete: {
        color: '#059669',
    },
};

const cardNumberOptions = {
    style: elementStyle,
    placeholder: '0000 0000 0000 0000',
    showIcon: true,
};

const cardExpiryOptions = {
    style: elementStyle,
    placeholder: 'MM/AA',
};

const cardCvcOptions = {
    style: elementStyle,
    placeholder: '123',
};

// Composant interne du formulaire de paiement
const PaymentForm = ({
    listing,
    checkIn,
    checkOut,
    dogsCount,
    totalPrice,
    serviceFee,
    onBack,
    onSuccess,
}: PaymentProps) => {
    const stripe = useStripe();
    const elements = useElements();

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cardNumberComplete, setCardNumberComplete] = useState(false);
    const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
    const [cardCvcComplete, setCardCvcComplete] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const cardComplete = cardNumberComplete && cardExpiryComplete && cardCvcComplete;

    // Swipe retour avec le hook
    const { containerStyle } = useSwipeBack(onBack);

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
        });
    };

    const grandTotal = totalPrice + serviceFee;

    // Traiter le paiement avec Stripe
    const handlePayment = async () => {
        if (!stripe || !elements || !cardComplete) return;

        setIsProcessing(true);
        setError(null);

        try {
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(`${API_URL}/payments/create-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: grandTotal, currency: 'eur' }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error?.message || 'Erreur lors de la creation du paiement');
            }

            const { clientSecret } = result.data;
            const cardElement = elements.getElement(CardNumberElement);

            if (!cardElement) {
                throw new Error('Element de carte non trouve');
            }

            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                { payment_method: { card: cardElement } }
            );

            if (stripeError) {
                throw new Error(stripeError.message || 'Erreur de paiement');
            }

            if (paymentIntent?.status === 'succeeded') {
                onSuccess();
            } else {
                throw new Error('Le paiement n\'a pas abouti');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsProcessing(false);
        }
    };

    const getFieldClass = (fieldName: string, isComplete: boolean) => {
        const baseClass = "transition-all duration-200";
        if (focusedField === fieldName) {
            return `${baseClass} ring-2 ring-indigo-500 border-transparent`;
        }
        if (isComplete) {
            return `${baseClass} border-green-400 bg-green-50/50`;
        }
        return baseClass;
    };

    return (
        <div className="fixed inset-0 z-150 bg-gray-100 flex flex-col" style={containerStyle}>
            {/* Header */}
            <header
                className="shrink-0 flex items-center justify-between px-3 py-3 bg-white border-b border-gray-200"
                style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
            >
                <button
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    onClick={onBack}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-base font-semibold">Paiement securise</span>
                <div className="w-9" />
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-3 space-y-3">

                    {/* Stripe Security Banner */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-medium text-sm">Paiement 100% securise</p>
                            <p className="text-white/80 text-xs">Protege par Stripe, leader mondial du paiement</p>
                        </div>
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                            alt="Stripe"
                            className="h-6 opacity-90 invert"
                        />
                    </div>

                    {/* Recap reservation */}
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex gap-3">
                            <img
                                src={listing.image}
                                alt={listing.title}
                                className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 text-sm truncate">{listing.title}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {formatDate(checkIn)} - {formatDate(checkOut)} · {nights} nuit{nights > 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {dogsCount} {dogsCount > 1 ? 'toutous' : 'toutou'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-900">{grandTotal} €</p>
                                <p className="text-xs text-gray-500">Total</p>
                            </div>
                        </div>
                    </div>

                    {/* Formulaire de paiement */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        {/* Card brands header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-gray-700" />
                                <span className="font-medium text-gray-900 text-sm">Carte bancaire</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {/* Visa */}
                                <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
                                    <svg viewBox="0 0 48 32" className="h-4">
                                        <path fill="#1434CB" d="M19.5 24.3l1.8-11h2.9l-1.8 11h-2.9zm12-11l-2.8 7.5-.3-1.6-1-5.1s-.1-.8-1.2-.8h-4.5l-.1.3s1.3.3 2.8 1.2l2.3 9h3l4.6-11.5h-2.8zm5.8 7.5c0-.7.6-1.1 1.8-1.2.6 0 1.2.1 1.8.4l.3-2s-.7-.3-1.8-.3c-2 0-3.4 1.1-3.4 2.6 0 1.2 1 1.8 1.8 2.2.8.4 1.1.7 1.1 1.1 0 .6-.7.9-1.3.9-.9 0-1.7-.2-2.3-.5l-.3 2c.5.2 1.4.4 2.4.4 2.2 0 3.6-1.1 3.6-2.7 0-2.1-2.9-2.2-2.9-3.2l.2.3zm-26.5-7.5L7.6 24.3h3l.5-2.3h3.6l.3 2.3h2.7l-2.4-11h-3.6zm.5 6.8l1.5-4.1.8 4.1h-2.3z"/>
                                    </svg>
                                </div>
                                {/* Mastercard */}
                                <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
                                    <svg viewBox="0 0 48 32" className="h-4">
                                        <circle cx="18" cy="16" r="10" fill="#EB001B"/>
                                        <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
                                        <path d="M24 8.5a10 10 0 000 15 10 10 0 000-15z" fill="#FF5F00"/>
                                    </svg>
                                </div>
                                {/* Amex */}
                                <div className="w-10 h-6 bg-[#006FCF] border border-gray-200 rounded flex items-center justify-center">
                                    <span className="text-white text-[8px] font-bold">AMEX</span>
                                </div>
                            </div>
                        </div>

                        {/* Card fields */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Numero de carte
                                </label>
                                <div className={`p-3 border border-gray-200 rounded-lg bg-gray-50 ${getFieldClass('number', cardNumberComplete)}`}>
                                    <CardNumberElement
                                        options={cardNumberOptions}
                                        onChange={(e) => setCardNumberComplete(e.complete)}
                                        onFocus={() => setFocusedField('number')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Expiration
                                    </label>
                                    <div className={`p-3 border border-gray-200 rounded-lg bg-gray-50 ${getFieldClass('expiry', cardExpiryComplete)}`}>
                                        <CardExpiryElement
                                            options={cardExpiryOptions}
                                            onChange={(e) => setCardExpiryComplete(e.complete)}
                                            onFocus={() => setFocusedField('expiry')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Code CVC
                                    </label>
                                    <div className={`p-3 border border-gray-200 rounded-lg bg-gray-50 ${getFieldClass('cvc', cardCvcComplete)}`}>
                                        <CardCvcElement
                                            options={cardCvcOptions}
                                            onChange={(e) => setCardCvcComplete(e.complete)}
                                            onFocus={() => setFocusedField('cvc')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="mt-3 p-2.5 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-600">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Test cards info */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-xs font-medium text-gray-700 mb-2">Cartes de test Stripe</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-green-800">Visa (succes)</p>
                                    <p className="text-xs text-green-600 font-mono">4242 4242 4242 4242</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-green-800">Mastercard (succes)</p>
                                    <p className="text-xs text-green-600 font-mono">5555 5555 5555 4444</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-red-700">Carte refusee</p>
                                    <p className="text-xs text-red-500 font-mono">4000 0000 0000 0002</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">Date: futur · CVC: 3 chiffres</p>
                    </div>

                    {/* Security footer */}
                    <div className="flex items-center justify-center gap-3 py-2">
                        <div className="flex items-center gap-1 text-gray-400">
                            <Lock className="w-3 h-3" />
                            <span className="text-[10px]">SSL 256-bit</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-1 text-gray-400">
                            <Shield className="w-3 h-3" />
                            <span className="text-[10px]">PCI DSS</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-1 text-gray-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="text-[10px]">3D Secure</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Bouton payer */}
            <div
                className="shrink-0 bg-white px-3 pt-3 border-t border-gray-200"
                style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
            >
                <button
                    className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 text-sm
                        ${cardComplete && !isProcessing && stripe
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] shadow-lg shadow-indigo-500/30'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                    onClick={handlePayment}
                    disabled={!cardComplete || isProcessing || !stripe}
                >
                    {isProcessing ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Paiement en cours...</span>
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" />
                            <span>Payer {grandTotal} € en securite</span>
                        </>
                    )}
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-2">
                    En cliquant, vous acceptez les conditions generales
                </p>
            </div>
        </div>
    );
};

// Composant principal avec le Provider Stripe
export const Payment = (props: PaymentProps) => {
    return (
        <Elements stripe={stripePromise}>
            <PaymentForm {...props} />
        </Elements>
    );
};
