/**
 * ==================== PAYMENT CONTROLLER ====================
 * Handlers pour les requêtes de paiement
 */

import { Request, Response } from 'express';
import * as paymentService from './payment.service.js';

/**
 * POST /api/payments/create-intent
 * Créer un PaymentIntent
 */
export async function createIntent(req: Request, res: Response) {
    try {
        const { amount, currency = 'eur' } = req.body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_AMOUNT',
                    message: 'Le montant doit être un nombre positif',
                },
            });
        }

        const result = await paymentService.createPaymentIntent(amount, currency);

        return res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[PAYMENT] Erreur création PaymentIntent:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'PAYMENT_ERROR',
                message: 'Erreur lors de la création du paiement',
            },
        });
    }
}

/**
 * GET /api/payments/:id/status
 * Récupérer le statut d'un paiement
 */
export async function getStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_ID',
                    message: 'ID du paiement requis',
                },
            });
        }

        const result = await paymentService.getPaymentStatus(id);

        return res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('[PAYMENT] Erreur récupération statut:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'PAYMENT_ERROR',
                message: 'Erreur lors de la récupération du statut',
            },
        });
    }
}
