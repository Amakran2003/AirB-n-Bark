/**
 * ==================== SERVER ENTRY POINT ====================
 * Point d'entrée principal du serveur Express
 */

import app from './app.js';
import { config, validateConfig } from './config/env.js';
import { prisma } from './lib/prisma.js';

// ==================== STARTUP ====================

async function bootstrap() {
    try {
        // Valider la configuration
        validateConfig();
        console.log('✅ Configuration validated');

        // Tester la connexion à la base de données
        await prisma.$connect();
        console.log('✅ Database connected');

        // Démarrer le serveur
        const server = app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🐕 AirB-n-Bark API Server                               ║
║                                                            ║
║   Environment: ${config.nodeEnv.padEnd(40)}║
║   Port: ${config.port.toString().padEnd(47)}║
║   URL: http://localhost:${config.port.toString().padEnd(33)}║
║                                                            ║
║   Endpoints:                                               ║
║   • Health: /health                                        ║
║   • API: /api                                              ║
║   • Listings: /api/listings                                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
            `);
        });

        // ==================== GRACEFUL SHUTDOWN ====================

        const shutdown = async (signal: string) => {
            console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

            // Arrêter d'accepter de nouvelles connexions
            server.close(async () => {
                console.log('✅ HTTP server closed');

                // Fermer la connexion à la base de données
                await prisma.$disconnect();
                console.log('✅ Database disconnected');

                console.log('👋 Goodbye!');
                process.exit(0);
            });

            // Force exit après 30 secondes
            setTimeout(() => {
                console.error('⚠️  Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };

        // Écouter les signaux de shutdown
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // ==================== ERROR HANDLING ====================

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        });

        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Démarrer l'application
bootstrap();
