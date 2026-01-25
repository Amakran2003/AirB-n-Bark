import { useState, useEffect } from 'react';
import { ChevronLeft, CreditCard, Lock, AlertCircle, Shield, CheckCircle2, Smartphone, Info, X } from 'lucide-react';
import { loadStripe, PaymentRequest } from '@stripe/stripe-js';
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    PaymentRequestButtonElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import type { ListingCardData } from '../data/listings';
import { useSwipeBack } from '../hooks/useSwipeBack';

/**
 * ==================== PAGE PAYMENT ====================
 * Page de paiement avec integration Stripe
 * Supporte: Carte, Apple Pay, Google Pay
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
    const [showTestCards, setShowTestCards] = useState(false);

    // Apple Pay / Google Pay
    const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
    const [canMakePayment, setCanMakePayment] = useState(false);

    const cardComplete = cardNumberComplete && cardExpiryComplete && cardCvcComplete;
    const grandTotal = totalPrice + serviceFee;

    // Swipe retour avec le hook
    const { containerStyle } = useSwipeBack(onBack);

    // Initialiser Payment Request pour Apple Pay / Google Pay
    useEffect(() => {
        if (!stripe) return;

        const pr = stripe.paymentRequest({
            country: 'FR',
            currency: 'eur',
            total: {
                label: `AirB-n-Bark - ${listing.title}`,
                amount: Math.round(grandTotal * 100), // En centimes
            },
            requestPayerName: true,
            requestPayerEmail: true,
        });

        // Verifier si Apple Pay / Google Pay est disponible
        pr.canMakePayment().then((result) => {
            if (result) {
                setPaymentRequest(pr);
                setCanMakePayment(true);
            }
        });

        // Gerer le paiement
        pr.on('paymentmethod', async (event) => {
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
                    event.complete('fail');
                    throw new Error(result.error?.message || 'Erreur');
                }

                const { clientSecret } = result.data;
                const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                    clientSecret,
                    { payment_method: event.paymentMethod.id },
                    { handleActions: false }
                );

                if (confirmError) {
                    event.complete('fail');
                    throw new Error(confirmError.message || 'Erreur');
                }

                event.complete('success');

                if (paymentIntent?.status === 'succeeded') {
                    onSuccess();
                } else if (paymentIntent?.status === 'requires_action') {
                    const { error } = await stripe.confirmCardPayment(clientSecret);
                    if (error) {
                        throw new Error(error.message || 'Erreur');
                    }
                    onSuccess();
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            } finally {
                setIsProcessing(false);
            }
        });
    }, [stripe, grandTotal, listing.title, onSuccess]);

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

    // Traiter le paiement par carte
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

                    {/* Apple Pay / Google Pay Section */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Smartphone className="w-5 h-5 text-gray-700" />
                            <span className="font-medium text-gray-900 text-sm">Paiement express</span>
                        </div>

                        {canMakePayment && paymentRequest ? (
                            <PaymentRequestButtonElement
                                options={{
                                    paymentRequest,
                                    style: {
                                        paymentRequestButton: {
                                            type: 'default',
                                            theme: 'dark',
                                            height: '48px',
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <div className="space-y-2">
                                {/* Apple Pay button placeholder */}
                                <button
                                    className="w-full py-3 bg-black text-white rounded-lg font-medium flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                                    disabled
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                                    </svg>
                                    Apple Pay
                                </button>
                                {/* Google Pay button placeholder */}
                                <button
                                    className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                                    disabled
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Google Pay
                                </button>
                                <p className="text-[10px] text-gray-400 text-center mt-1">
                                    Disponible sur Safari (iOS/Mac) et Chrome (Android)
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400">ou payer par carte</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Card brands header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-gray-700 text-xs">Carte bancaire</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Visa */}
                                <div className="w-8 h-5 bg-white border border-gray-200 rounded flex items-center justify-center">
                                    <svg viewBox="0 0 48 32" className="h-3">
                                        <path fill="#1434CB" d="M19.5 24.3l1.8-11h2.9l-1.8 11h-2.9zm12-11l-2.8 7.5-.3-1.6-1-5.1s-.1-.8-1.2-.8h-4.5l-.1.3s1.3.3 2.8 1.2l2.3 9h3l4.6-11.5h-2.8zm5.8 7.5c0-.7.6-1.1 1.8-1.2.6 0 1.2.1 1.8.4l.3-2s-.7-.3-1.8-.3c-2 0-3.4 1.1-3.4 2.6 0 1.2 1 1.8 1.8 2.2.8.4 1.1.7 1.1 1.1 0 .6-.7.9-1.3.9-.9 0-1.7-.2-2.3-.5l-.3 2c.5.2 1.4.4 2.4.4 2.2 0 3.6-1.1 3.6-2.7 0-2.1-2.9-2.2-2.9-3.2l.2.3zm-26.5-7.5L7.6 24.3h3l.5-2.3h3.6l.3 2.3h2.7l-2.4-11h-3.6zm.5 6.8l1.5-4.1.8 4.1h-2.3z"/>
                                    </svg>
                                </div>
                                {/* Mastercard */}
                                <div className="w-8 h-5 bg-white border border-gray-200 rounded flex items-center justify-center">
                                    <svg viewBox="0 0 48 32" className="h-3">
                                        <circle cx="18" cy="16" r="10" fill="#EB001B"/>
                                        <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
                                        <path d="M24 8.5a10 10 0 000 15 10 10 0 000-15z" fill="#FF5F00"/>
                                    </svg>
                                </div>
                                {/* Amex */}
                                <div className="w-8 h-5 bg-[#006FCF] border border-gray-200 rounded flex items-center justify-center">
                                    <span className="text-white text-[6px] font-bold">AMEX</span>
                                </div>
                            </div>
                        </div>

                        {/* Card fields */}
                        <div className="space-y-2">
                            <div>
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
                                <div className={`p-3 border border-gray-200 rounded-lg bg-gray-50 ${getFieldClass('expiry', cardExpiryComplete)}`}>
                                    <CardExpiryElement
                                        options={cardExpiryOptions}
                                        onChange={(e) => setCardExpiryComplete(e.complete)}
                                        onFocus={() => setFocusedField('expiry')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </div>
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

                        {/* Error message */}
                        {error && (
                            <div className="mt-3 p-2.5 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-600">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Test cards tooltip */}
                    <div className="relative flex justify-center">
                        <button
                            onClick={() => setShowTestCards(!showTestCards)}
                            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 transition-colors py-1"
                        >
                            <Info className="w-3.5 h-3.5" />
                            <span className="underline underline-offset-2">Cliquez ici pour les cartes de test</span>
                        </button>

                        {/* Tooltip popup */}
                        {showTestCards && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-50"
                                    onClick={() => setShowTestCards(false)}
                                />
                                {/* Tooltip content */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 animate-in fade-in zoom-in-95 duration-200">
                                    {/* Arrow */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />

                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-gray-800">Cartes de test Stripe</p>
                                        <button
                                            onClick={() => setShowTestCards(false)}
                                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100"
                                        >
                                            <X className="w-3 h-3 text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Cards list */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                            <div className="flex-1">
                                                <p className="text-[11px] font-medium text-green-800">Visa (succes)</p>
                                                <p className="text-[11px] text-green-600 font-mono">4242 4242 4242 4242</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                            <div className="flex-1">
                                                <p className="text-[11px] font-medium text-green-800">Mastercard (succes)</p>
                                                <p className="text-[11px] text-green-600 font-mono">5555 5555 5555 4444</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                            <div className="flex-1">
                                                <p className="text-[11px] font-medium text-red-700">Carte refusee</p>
                                                <p className="text-[11px] text-red-500 font-mono">4000 0000 0000 0002</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 text-center">Date: futur · CVC: 3 chiffres</p>
                                </div>
                            </>
                        )}
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
                            <span>Payer {grandTotal} € par carte</span>
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
