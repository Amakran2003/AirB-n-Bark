/**
 * ==================== LISTINGS ROUTES ====================
 * Routes API pour le microservice Listings
 */

import { Router } from 'express';
import { requireAuth, requireHost, optionalAuth } from '../../middlewares/auth.js';
import { globalRateLimiter, createRateLimiter, sanitizeBody } from '../../middlewares/security.js';
import * as listingsController from './listings.controller.js';

const router = Router();

// ==================== GUEST ROUTES (PUBLIC) ====================

/**
 * @route   GET /api/listings
 * @desc    Récupère tous les listings avec filtres et pagination
 * @access  Public
 */
router.get(
    '/',
    globalRateLimiter,
    optionalAuth,
    listingsController.getListings
);

/**
 * @route   GET /api/listings/:id
 * @desc    Récupère un listing par son ID
 * @access  Public
 */
router.get(
    '/:id',
    globalRateLimiter,
    optionalAuth,
    listingsController.getListingById
);

/**
 * @route   GET /api/listings/:id/reviews
 * @desc    Récupère les avis d'un listing
 * @access  Public
 */
router.get(
    '/:id/reviews',
    globalRateLimiter,
    listingsController.getListingReviews
);

/**
 * @route   GET /api/listings/:id/availability
 * @desc    Récupère la disponibilité d'un listing
 * @access  Public
 */
router.get(
    '/:id/availability',
    globalRateLimiter,
    listingsController.getListingAvailability
);

/**
 * @route   GET /api/listings/:id/similar
 * @desc    Récupère les listings similaires
 * @access  Public
 */
router.get(
    '/:id/similar',
    globalRateLimiter,
    listingsController.getSimilarListings
);

/**
 * @route   POST /api/listings/:id/share
 * @desc    Enregistre un partage de listing
 * @access  Public (optionnel: auth pour tracking)
 */
router.post(
    '/:id/share',
    globalRateLimiter,
    optionalAuth,
    sanitizeBody,
    listingsController.shareListing
);

// ==================== HOST ROUTES (PROTECTED) ====================

/**
 * @route   GET /api/listings/host/my-listings
 * @desc    Récupère les listings de l'hôte connecté
 * @access  Private (Host only)
 */
router.get(
    '/host/my-listings',
    globalRateLimiter,
    requireAuth,
    requireHost,
    listingsController.getHostListings
);

/**
 * @route   POST /api/listings/host/create
 * @desc    Crée un nouveau listing
 * @access  Private (Host only)
 */
router.post(
    '/host/create',
    createRateLimiter,
    requireAuth,
    requireHost,
    sanitizeBody,
    listingsController.createListing
);

/**
 * @route   PUT /api/listings/host/:id
 * @desc    Met à jour un listing
 * @access  Private (Host only)
 */
router.put(
    '/host/:id',
    globalRateLimiter,
    requireAuth,
    requireHost,
    sanitizeBody,
    listingsController.updateListing
);

/**
 * @route   DELETE /api/listings/host/:id
 * @desc    Supprime un listing (soft delete)
 * @access  Private (Host only)
 */
router.delete(
    '/host/:id',
    globalRateLimiter,
    requireAuth,
    requireHost,
    listingsController.deleteListing
);

/**
 * @route   PATCH /api/listings/host/:id/toggle
 * @desc    Active/Désactive un listing
 * @access  Private (Host only)
 */
router.patch(
    '/host/:id/toggle',
    globalRateLimiter,
    requireAuth,
    requireHost,
    listingsController.toggleListingStatus
);

/**
 * @route   PATCH /api/listings/host/:id/publish
 * @desc    Publie/Dépublie un listing
 * @access  Private (Host only)
 */
router.patch(
    '/host/:id/publish',
    globalRateLimiter,
    requireAuth,
    requireHost,
    listingsController.toggleListingPublished
);

/**
 * @route   PUT /api/listings/host/:id/availability
 * @desc    Met à jour les disponibilités d'un listing
 * @access  Private (Host only)
 */
router.put(
    '/host/:id/availability',
    globalRateLimiter,
    requireAuth,
    requireHost,
    sanitizeBody,
    listingsController.updateListingAvailability
);

/**
 * @route   POST /api/listings/host/:id/amenities
 * @desc    Ajoute des aménités à un listing
 * @access  Private (Host only)
 */
router.post(
    '/host/:id/amenities',
    globalRateLimiter,
    requireAuth,
    requireHost,
    sanitizeBody,
    listingsController.addListingAmenities
);

/**
 * @route   GET /api/listings/host/:id/stats
 * @desc    Récupère les statistiques d'un listing
 * @access  Private (Host only)
 */
router.get(
    '/host/:id/stats',
    globalRateLimiter,
    requireAuth,
    requireHost,
    listingsController.getListingStats
);

export default router;
