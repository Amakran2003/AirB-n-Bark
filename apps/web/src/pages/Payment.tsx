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

// Style pour les elements Stripe
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
                amount: Math.round(grandTotal * 100),
            },
            requestPayerName: true,
            requestPayerEmail: true,
        });

        pr.canMakePayment().then((result) => {
            if (result) {
                setPaymentRequest(pr);
                setCanMakePayment(true);
            }
        });

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
        let className = 'payment-card-field';
        if (focusedField === fieldName) {
            className += ' payment-card-field-focused';
        } else if (isComplete) {
            className += ' payment-card-field-complete';
        }
        return className;
    };

    return (
        <div className="payment-container" style={containerStyle}>
            {/* Header */}
            <header className="payment-header">
                <button className="payment-back-btn" onClick={onBack}>
                    <ChevronLeft size={20} />
                </button>
                <span className="payment-header-title">Paiement securise</span>
                <div style={{ width: 36 }} />
            </header>

            {/* Content */}
            <div className="payment-content">
                <div className="payment-content-inner">

                    {/* Stripe Security Banner */}
                    <div className="payment-security-banner">
                        <div className="payment-security-icon">
                            <Shield />
                        </div>
                        <div className="payment-security-text">
                            <p className="payment-security-title">Paiement 100% securise</p>
                            <p className="payment-security-subtitle">Protege par Stripe, leader mondial du paiement</p>
                        </div>
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                            alt="Stripe"
                            className="payment-stripe-logo"
                        />
                    </div>

                    {/* Recap reservation */}
                    <div className="payment-recap">
                        <div className="payment-recap-inner">
                            <img
                                src={listing.image}
                                alt={listing.title}
                                className="payment-recap-image"
                            />
                            <div className="payment-recap-info">
                                <h3 className="payment-recap-title">{listing.title}</h3>
                                <p className="payment-recap-dates">
                                    {formatDate(checkIn)} - {formatDate(checkOut)} · {nights} nuit{nights > 1 ? 's' : ''}
                                </p>
                                <p className="payment-recap-dogs">
                                    {dogsCount} {dogsCount > 1 ? 'toutous' : 'toutou'}
                                </p>
                            </div>
                            <div className="payment-recap-price">
                                <p className="payment-recap-amount">{grandTotal} €</p>
                                <p className="payment-recap-label">Total</p>
                            </div>
                        </div>
                    </div>

                    {/* Apple Pay / Google Pay Section */}
                    <div className="payment-card-section">
                        <div className="payment-section-header">
                            <Smartphone />
                            <span className="payment-section-title">Paiement express</span>
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
                            <div>
                                {/* Apple Pay button placeholder */}
                                <button className="payment-wallet-btn payment-wallet-btn-apple" disabled>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                                    </svg>
                                    Apple Pay
                                </button>
                                {/* Google Pay button placeholder */}
                                <button className="payment-wallet-btn payment-wallet-btn-google" disabled style={{ marginTop: 8 }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Google Pay
                                </button>
                                <p className="payment-wallet-hint">
                                    Disponible sur Safari (iOS/Mac) et Chrome (Android)
                                </p>
                            </div>
                        )}

                        <div className="payment-divider">
                            <div className="payment-divider-line" />
                            <span className="payment-divider-text">ou payer par carte</span>
                            <div className="payment-divider-line" />
                        </div>

                        {/* Card brands header */}
                        <div className="payment-card-brands">
                            <div className="payment-card-brands-label">
                                <CreditCard />
                                <span>Carte bancaire</span>
                            </div>
                            <div className="payment-card-brands-icons">
                                {/* Visa */}
                                <div className="payment-card-brand">
                                    <svg viewBox="0 0 48 32" style={{ height: 12 }}>
                                        <path fill="#1434CB" d="M19.5 24.3l1.8-11h2.9l-1.8 11h-2.9zm12-11l-2.8 7.5-.3-1.6-1-5.1s-.1-.8-1.2-.8h-4.5l-.1.3s1.3.3 2.8 1.2l2.3 9h3l4.6-11.5h-2.8zm5.8 7.5c0-.7.6-1.1 1.8-1.2.6 0 1.2.1 1.8.4l.3-2s-.7-.3-1.8-.3c-2 0-3.4 1.1-3.4 2.6 0 1.2 1 1.8 1.8 2.2.8.4 1.1.7 1.1 1.1 0 .6-.7.9-1.3.9-.9 0-1.7-.2-2.3-.5l-.3 2c.5.2 1.4.4 2.4.4 2.2 0 3.6-1.1 3.6-2.7 0-2.1-2.9-2.2-2.9-3.2l.2.3zm-26.5-7.5L7.6 24.3h3l.5-2.3h3.6l.3 2.3h2.7l-2.4-11h-3.6zm.5 6.8l1.5-4.1.8 4.1h-2.3z"/>
                                    </svg>
                                </div>
                                {/* Mastercard */}
                                <div className="payment-card-brand">
                                    <svg viewBox="0 0 48 32" style={{ height: 12 }}>
                                        <circle cx="18" cy="16" r="10" fill="#EB001B"/>
                                        <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
                                        <path d="M24 8.5a10 10 0 000 15 10 10 0 000-15z" fill="#FF5F00"/>
                                    </svg>
                                </div>
                                {/* Amex */}
                                <div className="payment-card-brand payment-card-brand-amex">
                                    <span>AMEX</span>
                                </div>
                            </div>
                        </div>

                        {/* Card fields */}
                        <div className="payment-card-fields">
                            <div className={getFieldClass('number', cardNumberComplete)}>
                                <CardNumberElement
                                    options={cardNumberOptions}
                                    onChange={(e) => setCardNumberComplete(e.complete)}
                                    onFocus={() => setFocusedField('number')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>

                            <div className="payment-card-row">
                                <div className={getFieldClass('expiry', cardExpiryComplete)}>
                                    <CardExpiryElement
                                        options={cardExpiryOptions}
                                        onChange={(e) => setCardExpiryComplete(e.complete)}
                                        onFocus={() => setFocusedField('expiry')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </div>
                                <div className={getFieldClass('cvc', cardCvcComplete)}>
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
                            <div className="payment-error">
                                <AlertCircle />
                                <p className="payment-error-text">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Test cards tooltip */}
                    <div className="payment-test-cards">
                        <button
                            className="payment-test-cards-btn"
                            onClick={() => setShowTestCards(!showTestCards)}
                        >
                            <Info />
                            <span>Cliquez ici pour les cartes de test</span>
                        </button>

                        {showTestCards && (
                            <>
                                <div
                                    className="payment-tooltip-backdrop"
                                    onClick={() => setShowTestCards(false)}
                                />
                                <div className="payment-tooltip">
                                    <div className="payment-tooltip-arrow" />

                                    <div className="payment-tooltip-header">
                                        <p className="payment-tooltip-title">Cartes de test Stripe</p>
                                        <button
                                            className="payment-tooltip-close"
                                            onClick={() => setShowTestCards(false)}
                                        >
                                            <X />
                                        </button>
                                    </div>

                                    <div className="payment-tooltip-cards">
                                        <div className="payment-test-card payment-test-card-success">
                                            <CheckCircle2 />
                                            <div>
                                                <p className="payment-test-card-name">Visa (succes)</p>
                                                <p className="payment-test-card-number">4242 4242 4242 4242</p>
                                            </div>
                                        </div>
                                        <div className="payment-test-card payment-test-card-success">
                                            <CheckCircle2 />
                                            <div>
                                                <p className="payment-test-card-name">Mastercard (succes)</p>
                                                <p className="payment-test-card-number">5555 5555 5555 4444</p>
                                            </div>
                                        </div>
                                        <div className="payment-test-card payment-test-card-error">
                                            <AlertCircle />
                                            <div>
                                                <p className="payment-test-card-name">Carte refusee</p>
                                                <p className="payment-test-card-number">4000 0000 0000 0002</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="payment-tooltip-hint">Date: futur · CVC: 3 chiffres</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Security footer */}
                    <div className="payment-security-footer">
                        <div className="payment-security-badge">
                            <Lock />
                            <span>SSL 256-bit</span>
                        </div>
                        <div className="payment-security-divider" />
                        <div className="payment-security-badge">
                            <Shield />
                            <span>PCI DSS</span>
                        </div>
                        <div className="payment-security-divider" />
                        <div className="payment-security-badge">
                            <CheckCircle2 />
                            <span>3D Secure</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Bouton payer */}
            <div className="payment-footer">
                <button
                    className={`payment-btn ${cardComplete && !isProcessing && stripe ? 'payment-btn-active' : 'payment-btn-disabled'}`}
                    onClick={handlePayment}
                    disabled={!cardComplete || isProcessing || !stripe}
                >
                    {isProcessing ? (
                        <>
                            <span className="payment-btn-spinner" />
                            <span>Paiement en cours...</span>
                        </>
                    ) : (
                        <>
                            <Lock />
                            <span>Payer {grandTotal} € par carte</span>
                        </>
                    )}
                </button>
                <p className="payment-terms">
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
