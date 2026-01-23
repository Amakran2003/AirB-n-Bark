/**
 * ==================== BOOKINGS API TESTS ====================
 * Tests d'intégration pour les endpoints bookings
 */

import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { 
    cleanupTestData, 
    createTestUser, 
    createTestListing,
    generateTestToken,
} from '../setup.js';

describe('Bookings API', () => {
    let hostUser: any;
    let guestUser: any;
    let testListing: any;
    let testBooking: any;
    let hostToken: string;
    let guestToken: string;

    beforeAll(async () => {
        await cleanupTestData();
        
        // Créer les utilisateurs de test
        hostUser = await createTestUser({ 
            email: 'host-booking@test.com', 
            name: 'Host Booking', 
            isHost: true 
        });
        guestUser = await createTestUser({ 
            email: 'guest-booking@test.com', 
            name: 'Guest Booking', 
            isHost: false 
        });
        
        // Générer les tokens
        hostToken = generateTestToken(hostUser.id, true);
        guestToken = generateTestToken(guestUser.id, false);
        
        // Créer un listing de test
        testListing = await createTestListing(hostUser.id, {
            title: 'Listing pour bookings',
            city: 'Marseille',
            pricePerNight: 80,
        });
    });

    afterAll(async () => {
        await cleanupTestData();
    });

    // ==================== PUBLIC ENDPOINTS ====================

    describe('POST /api/bookings/quote', () => {
        it('devrait calculer un devis', async () => {
            const res = await request(app)
                .post('/api/bookings/quote')
                .send({
                    listingId: testListing.id,
                    startDate: '2026-03-01',
                    endDate: '2026-03-05',
                    guestsCount: 1,
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.nights).toBe(4);
            expect(res.body.data.pricePerNight).toBe(80);
            expect(res.body.data.subtotal).toBe(320); // 80 * 4
            expect(res.body.data.serviceFee).toBeCloseTo(38.4, 1); // 12%
            expect(res.body.data.totalPrice).toBeCloseTo(358.4, 1);
        });

        it('devrait retourner 404 pour un listing inexistant', async () => {
            const res = await request(app)
                .post('/api/bookings/quote')
                .send({
                    listingId: '00000000-0000-0000-0000-000000000000',
                    startDate: '2026-03-01',
                    endDate: '2026-03-05',
                    guestsCount: 1,
                })
                .expect(404);

            expect(res.body.success).toBe(false);
        });

        it('devrait valider les dates', async () => {
            const res = await request(app)
                .post('/api/bookings/quote')
                .send({
                    listingId: testListing.id,
                    startDate: '2026-03-05',
                    endDate: '2026-03-01', // Date fin avant début
                    guestsCount: 1,
                })
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/bookings/availability', () => {
        it('devrait vérifier la disponibilité', async () => {
            const res = await request(app)
                .get('/api/bookings/availability')
                .query({
                    listingId: testListing.id,
                    startDate: '2026-04-01',
                    endDate: '2026-04-05',
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.available).toBe(true);
        });
    });

    // ==================== GUEST ENDPOINTS ====================

    describe('POST /api/bookings', () => {
        it('devrait retourner 401 sans token', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .send({
                    listingId: testListing.id,
                    startDate: '2026-05-01',
                    endDate: '2026-05-05',
                    guestsCount: 1,
                })
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        it('devrait créer une réservation', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${guestToken}`)
                .send({
                    listingId: testListing.id,
                    startDate: '2026-05-01',
                    endDate: '2026-05-05',
                    guestsCount: 1,
                })
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.listingId).toBe(testListing.id);
            expect(res.body.data.status).toBe('pending');
            expect(res.body.data.nights).toBe(4);
            expect(res.body.data.bookingNumber).toMatch(/^BARK-/);

            testBooking = res.body.data;
        });

        it('devrait empêcher une réservation sur des dates déjà prises', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${guestToken}`)
                .send({
                    listingId: testListing.id,
                    startDate: '2026-05-02', // Chevauche la réservation précédente
                    endDate: '2026-05-06',
                    guestsCount: 1,
                })
                .expect(409);

            expect(res.body.success).toBe(false);
        });

        it('devrait empêcher de réserver son propre listing', async () => {
            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${hostToken}`)
                .send({
                    listingId: testListing.id,
                    startDate: '2026-06-01',
                    endDate: '2026-06-05',
                    guestsCount: 1,
                })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.error.message).toContain('propre listing');
        });
    });

    describe('GET /api/bookings', () => {
        it('devrait retourner les réservations du guest', async () => {
            const res = await request(app)
                .get('/api/bookings')
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });

        it('devrait paginer les résultats', async () => {
            const res = await request(app)
                .get('/api/bookings?page=1&limit=10')
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(200);

            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
        });
    });

    describe('GET /api/bookings/:id', () => {
        it('devrait retourner une réservation par ID', async () => {
            const res = await request(app)
                .get(`/api/bookings/${testBooking.id}`)
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(testBooking.id);
        });

        it('devrait retourner 404 pour une réservation inexistante', async () => {
            const res = await request(app)
                .get('/api/bookings/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(404);

            expect(res.body.success).toBe(false);
        });
    });

    // ==================== HOST ENDPOINTS ====================

    describe('GET /api/bookings/host', () => {
        it('devrait retourner les réservations reçues par l\'hôte', async () => {
            const res = await request(app)
                .get('/api/bookings/host')
                .set('Authorization', `Bearer ${hostToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('POST /api/bookings/host/:id/confirm', () => {
        it('devrait confirmer une réservation', async () => {
            const res = await request(app)
                .post(`/api/bookings/host/${testBooking.id}/confirm`)
                .set('Authorization', `Bearer ${hostToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('confirmed');
        });

        it('devrait échouer si déjà confirmée', async () => {
            const res = await request(app)
                .post(`/api/bookings/host/${testBooking.id}/confirm`)
                .set('Authorization', `Bearer ${hostToken}`)
                .expect(404);

            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/bookings/:id/cancel', () => {
        it('devrait annuler une réservation', async () => {
            // D'abord créer une nouvelle réservation
            const createRes = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${guestToken}`)
                .send({
                    listingId: testListing.id,
                    startDate: '2026-07-01',
                    endDate: '2026-07-05',
                    guestsCount: 1,
                });

            const newBooking = createRes.body.data;

            // Puis l'annuler
            const res = await request(app)
                .post(`/api/bookings/${newBooking.id}/cancel`)
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('cancelled');
        });
    });

    describe('POST /api/bookings/host/:id/reject', () => {
        it('devrait rejeter une réservation avec motif', async () => {
            // Créer une nouvelle réservation à rejeter
            const createRes = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${guestToken}`)
                .send({
                    listingId: testListing.id,
                    startDate: '2026-08-01',
                    endDate: '2026-08-05',
                    guestsCount: 1,
                });

            const newBooking = createRes.body.data;

            const res = await request(app)
                .post(`/api/bookings/host/${newBooking.id}/reject`)
                .set('Authorization', `Bearer ${hostToken}`)
                .send({ reason: 'Dates non disponibles' })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('cancelled');
        });
    });

    describe('GET /api/bookings/host/stats', () => {
        it('devrait retourner les statistiques de l\'hôte', async () => {
            const res = await request(app)
                .get('/api/bookings/host/stats')
                .set('Authorization', `Bearer ${hostToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('pending');
            expect(res.body.data).toHaveProperty('confirmed');
            expect(res.body.data).toHaveProperty('cancelled');
            expect(res.body.data).toHaveProperty('totalBookings');
        });
    });
});
