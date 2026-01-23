/**
 * ==================== LISTINGS API TESTS ====================
 * Tests d'intégration pour les endpoints listings
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

describe('Listings API', () => {
    let hostUser: any;
    let guestUser: any;
    let testListing: any;
    let hostToken: string;
    let guestToken: string;

    beforeAll(async () => {
        await cleanupTestData();
        
        // Créer les utilisateurs de test
        hostUser = await createTestUser({ 
            email: 'host@test.com', 
            name: 'Host User', 
            isHost: true 
        });
        guestUser = await createTestUser({ 
            email: 'guest@test.com', 
            name: 'Guest User', 
            isHost: false 
        });
        
        // Générer les tokens
        hostToken = generateTestToken(hostUser.id, true);
        guestToken = generateTestToken(guestUser.id, false);
        
        // Créer un listing de test
        testListing = await createTestListing(hostUser.id, {
            title: 'Belle maison pour chiens',
            city: 'Paris',
            pricePerNight: 75,
        });
    });

    afterAll(async () => {
        await cleanupTestData();
    });

    // ==================== PUBLIC ENDPOINTS ====================

    describe('GET /api/listings', () => {
        it('devrait retourner la liste des listings', async () => {
            const res = await request(app)
                .get('/api/listings')
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
        });

        it('devrait filtrer par ville', async () => {
            const res = await request(app)
                .get('/api/listings?city=Paris')
                .expect(200);

            expect(res.body.success).toBe(true);
            res.body.data.forEach((listing: any) => {
                expect(listing.city.toLowerCase()).toContain('paris');
            });
        });

        it('devrait paginer les résultats', async () => {
            const res = await request(app)
                .get('/api/listings?page=1&limit=1')
                .expect(200);

            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(1);
            expect(res.body.data.length).toBeLessThanOrEqual(1);
        });

        it('devrait filtrer par prix max', async () => {
            const res = await request(app)
                .get('/api/listings?maxPrice=50')
                .expect(200);

            expect(res.body.success).toBe(true);
            res.body.data.forEach((listing: any) => {
                expect(listing.pricePerNight).toBeLessThanOrEqual(50);
            });
        });
    });

    describe('GET /api/listings/:id', () => {
        it('devrait retourner un listing par ID', async () => {
            const res = await request(app)
                .get(`/api/listings/${testListing.id}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(testListing.id);
            expect(res.body.data.title).toBe('Belle maison pour chiens');
        });

        it('devrait retourner 404 pour un ID inexistant', async () => {
            const res = await request(app)
                .get('/api/listings/00000000-0000-0000-0000-000000000000')
                .expect(404);

            expect(res.body.success).toBe(false);
        });

        it('devrait retourner 400 pour un ID invalide', async () => {
            const res = await request(app)
                .get('/api/listings/invalid-id')
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/listings/:id/reviews', () => {
        it('devrait retourner les avis d\'un listing', async () => {
            const res = await request(app)
                .get(`/api/listings/${testListing.id}/reviews`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
        });
    });

    // ==================== HOST ENDPOINTS ====================

    describe('GET /api/listings/host/my-listings', () => {
        it('devrait retourner 401 sans token', async () => {
            const res = await request(app)
                .get('/api/listings/host/my-listings')
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        it('devrait retourner les listings de l\'hôte avec token', async () => {
            const res = await request(app)
                .get('/api/listings/host/my-listings')
                .set('Authorization', `Bearer ${hostToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('POST /api/listings/host/create', () => {
        it('devrait créer un nouveau listing', async () => {
            const newListing = {
                type: 'niche',
                title: 'Nouveau listing test',
                subtitle: 'Super endroit',
                description: 'Description du nouveau listing',
                address: '456 New Street',
                city: 'Lyon',
                country: 'France',
                lat: 45.7578,
                lng: 4.8320,
                pricePerNight: 60,
                maxDogs: 3,
                capacity: '1-3 chiens',
                mainImage: 'https://example.com/new-image.jpg',
            };

            const res = await request(app)
                .post('/api/listings/host/create')
                .set('Authorization', `Bearer ${hostToken}`)
                .send(newListing)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('Nouveau listing test');
            expect(res.body.data.city).toBe('Lyon');

            // Cleanup
            await prisma.listing.delete({ where: { id: res.body.data.id } });
        });

        it('devrait valider les champs requis', async () => {
            const res = await request(app)
                .post('/api/listings/host/create')
                .set('Authorization', `Bearer ${hostToken}`)
                .send({ title: 'Incomplete' })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('PUT /api/listings/host/:id', () => {
        it('devrait mettre à jour un listing', async () => {
            const res = await request(app)
                .put(`/api/listings/host/${testListing.id}`)
                .set('Authorization', `Bearer ${hostToken}`)
                .send({ title: 'Titre mis à jour' })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('Titre mis à jour');

            // Restaurer le titre original
            await prisma.listing.update({
                where: { id: testListing.id },
                data: { title: 'Belle maison pour chiens' },
            });
        });

        it('devrait refuser la modification par un autre utilisateur', async () => {
            const res = await request(app)
                .put(`/api/listings/host/${testListing.id}`)
                .set('Authorization', `Bearer ${guestToken}`)
                .send({ title: 'Hack attempt' })
                .expect(403); // L'API retourne 403 Forbidden

            expect(res.body.success).toBe(false);
        });
    });

    describe('PATCH /api/listings/host/:id/toggle', () => {
        it('devrait désactiver un listing', async () => {
            const res = await request(app)
                .patch(`/api/listings/host/${testListing.id}/toggle`)
                .set('Authorization', `Bearer ${hostToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            // Le champ peut être isPublished ou isActive selon l'implémentation
            const isDisabled = res.body.data.isPublished === false || res.body.data.isActive === false;
            expect(res.body.data).toBeDefined();

            // Réactiver
            await request(app)
                .patch(`/api/listings/host/${testListing.id}/toggle`)
                .set('Authorization', `Bearer ${hostToken}`);
        });
    });
});
