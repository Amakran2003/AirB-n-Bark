/**
 * ==================== EXPRESS APP ====================
 * Configuration principale de l'application Express
 * Sécurité, middlewares, routes
 */

import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/env.js';
import { 
    globalRateLimiter, 
    requestLogger, 
    errorHandler, 
    notFoundHandler,
    sanitizeBody,
} from './middlewares/security.js';
import { listingsRoutes } from './services/listings/index.js';
import { bookingRoutes } from './services/booking/index.js';
import { authRoutes } from './services/auth/index.js';
import { metaRoutes } from './services/meta/index.js';

// ==================== APP INITIALIZATION ====================

const app: Application = express();

// ==================== SECURITY MIDDLEWARES ====================

// Helmet - sécurité des headers HTTP
app.use(helmet({
    contentSecurityPolicy: config.isProd ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));

// CORS - Cross-Origin Resource Sharing
app.use(cors({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // En développement, autoriser toutes les origines
        if (!config.isProd) {
            return callback(null, true);
        }
        
        // En production, vérifier la whitelist
        if (config.corsOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
}));

// Rate limiting global
app.use(globalRateLimiter);

// ==================== PARSING MIDDLEWARES ====================

// Body parsers avec limites de taille (50mb pour supporter images base64)
app.use(express.json({ 
    limit: '50mb',
    strict: true,
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb',
}));

// Sanitization globale du body
app.use(sanitizeBody);

// ==================== LOGGING ====================

app.use(requestLogger);

// ==================== HEALTH CHECK ====================

app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
    });
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        service: 'airbonbark-api',
    });
});

// ==================== API ROUTES ====================

// Auth microservice
app.use('/api/auth', authRoutes);

// Meta endpoints
app.use('/api/meta', metaRoutes);

// Listings microservice
app.use('/api/listings', listingsRoutes);

// Bookings microservice
app.use('/api/bookings', bookingRoutes);

// ==================== API DOCUMENTATION ====================

app.get('/api', (_req: Request, res: Response) => {
    res.json({
        name: 'AirB-n-Bark API',
        version: '1.0.0',
        description: 'API pour la plateforme de réservation de niches pour chiens',
        endpoints: {
            health: '/health',
            listings: {
                public: {
                    'GET /api/listings': 'Liste des listings avec filtres',
                    'GET /api/listings/:id': 'Détails d\'un listing',
                    'GET /api/listings/:id/reviews': 'Avis d\'un listing',
                    'GET /api/listings/:id/availability': 'Disponibilité',
                    'GET /api/listings/:id/similar': 'Listings similaires',
                    'POST /api/listings/:id/share': 'Partager un listing',
                },
                host: {
                    'GET /api/listings/host/my-listings': 'Mes listings (auth)',
                    'POST /api/listings/host/create': 'Créer un listing (auth)',
                    'PUT /api/listings/host/:id': 'Modifier un listing (auth)',
                    'DELETE /api/listings/host/:id': 'Supprimer un listing (auth)',
                    'PATCH /api/listings/host/:id/toggle': 'Activer/Désactiver (auth)',
                    'PUT /api/listings/host/:id/availability': 'Gérer disponibilité (auth)',
                    'GET /api/listings/host/:id/stats': 'Statistiques (auth)',
                },
            },
            bookings: {
                guest: {
                    'GET /api/bookings': 'Mes réservations (auth)',
                    'POST /api/bookings': 'Créer une réservation (auth)',
                    'GET /api/bookings/:id': 'Détails réservation (auth)',
                    'POST /api/bookings/:id/cancel': 'Annuler réservation (auth)',
                    'POST /api/bookings/quote': 'Calculer un devis',
                    'GET /api/bookings/availability': 'Vérifier disponibilité',
                },
                host: {
                    'GET /api/bookings/host': 'Réservations reçues (auth)',
                    'GET /api/bookings/host/stats': 'Statistiques (auth)',
                    'POST /api/bookings/host/:id/confirm': 'Confirmer (auth)',
                    'POST /api/bookings/host/:id/reject': 'Rejeter (auth)',
                },
            },
            meta: {
                public: {
                    'GET /api/meta/languages': 'Liste des langues disponibles',
                },
            },
        },
    });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler (doit être le dernier middleware)
app.use(errorHandler);

// ==================== EXPORT ====================

export default app;
