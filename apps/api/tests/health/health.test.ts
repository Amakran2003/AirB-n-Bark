/**
 * ==================== HEALTH API TESTS ====================
 * Tests pour les endpoints de santé
 */

import request from 'supertest';
import app from '../../src/app.js';

describe('Health API', () => {
    describe('GET /health', () => {
        it('devrait retourner le status ok', async () => {
            const res = await request(app)
                .get('/health')
                .expect(200);

            expect(res.body.status).toBe('ok');
            expect(res.body.timestamp).toBeDefined();
            expect(res.body.uptime).toBeDefined();
            expect(['development', 'test']).toContain(res.body.environment);
        });
    });

    describe('GET /api/health', () => {
        it('devrait retourner les infos du service', async () => {
            const res = await request(app)
                .get('/api/health')
                .expect(200);

            expect(res.body.status).toBe('ok');
            expect(res.body.version).toBe('1.0.0');
            expect(res.body.service).toBe('airbonbark-api');
        });
    });

    describe('GET /api', () => {
        it('devrait retourner la documentation API', async () => {
            const res = await request(app)
                .get('/api')
                .expect(200);

            expect(res.body.name).toBe('AirB-n-Bark API');
            expect(res.body.version).toBe('1.0.0');
            expect(res.body.endpoints).toBeDefined();
            expect(res.body.endpoints.listings).toBeDefined();
            expect(res.body.endpoints.bookings).toBeDefined();
        });
    });

    describe('GET /unknown-route', () => {
        it('devrait retourner 404', async () => {
            const res = await request(app)
                .get('/unknown-route')
                .expect(404);

            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('NOT_FOUND');
        });
    });
});
