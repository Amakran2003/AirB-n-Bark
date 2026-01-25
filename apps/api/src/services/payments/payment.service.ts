/**
 * ==================== PAYMENT SERVICE ====================
 * Intégration Stripe pour les paiements
 */

import Stripe from 'stripe';
import { config } from '../../config/env.js';

// Initialiser Stripe avec la clé secrète
const stripe = new Stripe(config.stripeSecretKey);

/**
 * Créer un PaymentIntent pour un montant donné
 */
export async function createPaymentIntent(amount: number, currency: string = 'eur') {
    // Stripe attend le montant en centimes
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        automatic_payment_methods: {
            enabled: true,
        },
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
}

/**
 * Récupérer le statut d'un PaymentIntent
 */
export async function getPaymentStatus(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convertir en euros
        currency: paymentIntent.currency,
    };
}
