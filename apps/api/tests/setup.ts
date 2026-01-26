/**
 * ==================== TEST SETUP ====================
 * Configuration globale pour les tests Jest
 */

import { prisma } from '../src/lib/prisma.js';
import { ListingType } from '@prisma/client';
import { jest, afterAll } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Augmente le timeout pour les opérations DB
jest.setTimeout(30000);

// Cleanup après tous les tests
afterAll(async () => {
    await prisma.$disconnect();
});

// Helper pour générer un JWT de test
export function generateTestToken(userId: string, isHost: boolean = false): string {
    return jwt.sign(
        {
            userId,
            email: 'test@test.com',
            role: 'user',
            isHost,
        },
        process.env.JWT_SECRET || 'test-secret-key-for-testing',
        { expiresIn: '1h' }
    );
}

// Helper pour nettoyer la DB de test
export async function cleanupTestData() {
    // Supprime dans l'ordre pour respecter les foreign keys
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.listingAvailability.deleteMany({});
    await prisma.listingAmenity.deleteMany({});
    await prisma.listing.deleteMany({});
    await prisma.user.deleteMany({});
}

// Helper pour créer un utilisateur de test
export async function createTestUser(data: {
    email?: string;
    name?: string;
    isHost?: boolean;
} = {}) {
    return prisma.user.create({
        data: {
            email: data.email || `test-${Date.now()}@test.com`,
            name: data.name || 'Test User',
            password: await bcrypt.hash('password123', 10),
            isHost: data.isHost ?? false,
            isVerified: true,
        },
    });
}

// Helper pour créer un listing de test
export async function createTestListing(hostId: string, data: Partial<{
    title: string;
    city: string;
    pricePerNight: number;
    isPublished: boolean;
}> = {}) {
    return prisma.listing.create({
        data: {
            hostId,
            type: ListingType.niche,
            title: data.title || 'Test Listing',
            subtitle: 'A nice place for dogs',
            description: 'A wonderful place for your furry friend',
            address: '123 Test Street',
            city: data.city || 'Paris',
            country: 'France',
            lat: 48.8566,
            lng: 2.3522,
            pricePerNight: data.pricePerNight || 50,
            currency: 'EUR',
            maxDogs: 2,
            capacity: '2-4 chiens',
            mainImage: 'https://example.com/image.jpg',
            images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
            isActive: true,
            isPublished: data.isPublished ?? true,
        },
    });
}
