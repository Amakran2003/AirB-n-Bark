/**
 * ==================== DATABASE SEED ====================
 * Données de test pour le développement
 * Correspond au schéma Prisma
 */

import { PrismaClient, ListingType, CancellationPolicy } from '@prisma/client';
import bcrypt from 'bcryptjs';

const hash = (password: string, rounds: number) => bcrypt.hash(password, rounds);

const prisma = new PrismaClient();

function generateBookingNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BARK-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function main() {
    console.log('🌱 Starting database seed...');

    // ==================== CLEAN DATABASE ====================
    console.log('🧹 Cleaning existing data...');
    await prisma.listingShare.deleteMany();
    await prisma.listingView.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.listingAvailability.deleteMany();
    await prisma.listingRules.deleteMany();
    await prisma.listingRoom.deleteMany();
    await prisma.listingHighlight.deleteMany();
    await prisma.listingAmenity.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();

    // ==================== CREATE USERS ====================
    console.log('👤 Creating users...');
    
    const hashedPassword = await hash('password123', 12);

    const host1 = await prisma.user.create({
        data: {
            email: 'marie@example.com',
            password: hashedPassword,
            name: 'Marie Dupont',
            avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
            phone: '+33612345678',
            isHost: true,
            isVerified: true,
        },
    });

    const host2 = await prisma.user.create({
        data: {
            email: 'jean@example.com',
            password: hashedPassword,
            name: 'Jean Martin',
            avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
            phone: '+33687654321',
            isHost: true,
            isVerified: true,
        },
    });

    const guest1 = await prisma.user.create({
        data: {
            email: 'guest@example.com',
            password: hashedPassword,
            name: 'Sophie Bernard',
            avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
            isHost: false,
        },
    });

    // ==================== CREATE LISTINGS ====================
    console.log('🏠 Creating listings...');

    const listing1 = await prisma.listing.create({
        data: {
            hostId: host1.id,
            type: ListingType.niche,
            title: 'Niche de luxe avec jardin privatif',
            subtitle: 'Paradis canin au cœur de Paris',
            description: `Offrez à votre toutou un séjour de rêve dans notre magnifique niche de luxe ! 
                
Située dans un jardin arboré de 500m², cette niche spacieuse offre tout le confort nécessaire pour que votre compagnon se sente comme chez lui.

Équipements inclus :
- Coussin orthopédique haut de gamme
- Gamelles en inox
- Jouets variés
- Accès au jardin 24h/24

Je suis présente à la maison et je promène les chiens 3 fois par jour minimum.`,
            address: '15 Rue de la Paix',
            city: 'Paris',
            country: 'France',
            lat: 48.8698,
            lng: 2.3311,
            pricePerNight: 35,
            currency: 'EUR',
            maxDogs: 2,
            capacity: '2 chiens max',
            mainImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
            images: [
                'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
                'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
            ],
            rating: 4.9,
            reviewsCount: 47,
            antiCatAvailable: true,
            antiCatRiskScore: 15,
            antiCatExtraPrice: 5,
            cancellationPolicy: CancellationPolicy.flexible,
            hasFreeCancellation: true,
            isActive: true,
            isPublished: true,
            amenities: {
                create: [
                    { name: 'Jardin', icon: 'leaf' },
                    { name: 'Climatisation', icon: 'snowflake' },
                    { name: 'Gamelles premium', icon: 'bone' },
                    { name: 'Jouets', icon: 'gamepad' },
                    { name: 'Promenades', icon: 'paw' },
                    { name: 'Webcam', icon: 'video' },
                ],
            },
            highlights: {
                create: [
                    { title: 'Super hôte', description: 'Marie a une excellente réputation', icon: 'star' },
                    { title: 'Annulation gratuite', description: 'Jusqu\'à 24h avant', icon: 'check' },
                    { title: 'Jardin clôturé', description: '500m² sécurisé', icon: 'shield' },
                ],
            },
            rooms: {
                create: [
                    { name: 'Niche principale', description: 'Spacieuse et confortable', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400' },
                    { name: 'Coin repas', description: 'Avec gamelles en inox', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400' },
                ],
            },
            rules: {
                create: {
                    maxBarkHour: '22h00',
                    mustBeVaccinated: true,
                    mustBeNeutered: false,
                    allowsPuppies: true,
                    minAge: 3,
                },
            },
            availability: {
                create: [
                    {
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                        isBlocked: false,
                    },
                ],
            },
        },
    });

    const listing2 = await prisma.listing.create({
        data: {
            hostId: host2.id,
            type: ListingType.nicholoc,
            title: 'Appartement dog-friendly avec balcon',
            subtitle: 'Proche du Parc de la Tête d\'Or',
            description: `Bienvenue dans mon appartement spécialement aménagé pour accueillir votre toutou !

Situé en plein cœur de Lyon, à deux pas du Parc de la Tête d'Or, c'est l'endroit idéal pour des balades quotidiennes.

Votre chien aura son propre espace avec :
- Un panier confortable
- Des gamelles personnalisées
- Un accès au balcon sécurisé
- Des jouets à disposition`,
            address: '45 Rue de la République',
            city: 'Lyon',
            country: 'France',
            lat: 45.7640,
            lng: 4.8357,
            pricePerNight: 28,
            currency: 'EUR',
            maxDogs: 1,
            capacity: '1 chien',
            mainImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            images: [
                'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
            ],
            rating: 4.7,
            reviewsCount: 23,
            antiCatAvailable: false,
            antiCatRiskScore: 45,
            antiCatExtraPrice: 0,
            cancellationPolicy: CancellationPolicy.moderate,
            hasFreeCancellation: true,
            isActive: true,
            isPublished: true,
            amenities: {
                create: [
                    { name: 'Balcon', icon: 'sun' },
                    { name: 'Chauffage', icon: 'flame' },
                    { name: 'WiFi', icon: 'wifi' },
                    { name: 'Proche parc', icon: 'tree' },
                ],
            },
            highlights: {
                create: [
                    { title: 'Proche Parc Tête d\'Or', description: 'À 5 min à pied', icon: 'tree' },
                    { title: 'Télétravail', description: 'Présence constante', icon: 'laptop' },
                ],
            },
        },
    });

    const listing3 = await prisma.listing.create({
        data: {
            hostId: host1.id,
            type: ListingType.nichortoir,
            title: 'Pension canine familiale avec piscine',
            subtitle: 'Le paradis des chiens à Bordeaux',
            description: `Notre pension familiale accueille votre compagnon dans un cadre exceptionnel !

Sur un terrain de 2 hectares, nous proposons :
- Chambres individuelles climatisées
- Piscine canine chauffée
- Parcours d'agility
- Promenades en forêt quotidiennes
- Repas bio sur demande`,
            address: '234 Route des Vignobles',
            city: 'Bordeaux',
            country: 'France',
            lat: 44.8378,
            lng: -0.5792,
            pricePerNight: 55,
            currency: 'EUR',
            maxDogs: 5,
            capacity: '5 chiens max',
            mainImage: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800',
            images: [
                'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800',
                'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800',
            ],
            rating: 5.0,
            reviewsCount: 89,
            antiCatAvailable: true,
            antiCatRiskScore: 5,
            antiCatExtraPrice: 10,
            cancellationPolicy: CancellationPolicy.strict,
            hasFreeCancellation: false,
            isActive: true,
            isPublished: true,
            amenities: {
                create: [
                    { name: 'Piscine', icon: 'droplets' },
                    { name: 'Agility', icon: 'activity' },
                    { name: 'Chambres individuelles', icon: 'bed' },
                    { name: 'Repas bio', icon: 'leaf' },
                    { name: 'Vétérinaire', icon: 'heart' },
                    { name: 'Caméras 24/7', icon: 'video' },
                    { name: 'Forêt', icon: 'tree' },
                ],
            },
            highlights: {
                create: [
                    { title: 'Piscine chauffée', description: 'Ouverte toute l\'année', icon: 'droplets' },
                    { title: '5 étoiles', description: 'Note parfaite', icon: 'star' },
                    { title: '2 hectares', description: 'Espace immense', icon: 'map' },
                ],
            },
            rooms: {
                create: [
                    { name: 'Chambre VIP', description: 'Climatisée avec lit orthopédique', image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400' },
                    { name: 'Espace piscine', description: 'Piscine chauffée', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400' },
                    { name: 'Parcours agility', description: 'Obstacles variés', image: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400' },
                ],
            },
            rules: {
                create: {
                    maxBarkHour: '21h00',
                    mustBeVaccinated: true,
                    mustBeNeutered: true,
                    allowsPuppies: true,
                    minAge: 6,
                },
            },
            availability: {
                create: [
                    {
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                        isBlocked: false,
                    },
                ],
            },
        },
    });

    // ==================== CREATE REVIEWS ====================
    console.log('⭐ Creating reviews...');
    
    await prisma.review.createMany({
        data: [
            {
                listingId: listing1.id,
                authorId: guest1.id,
                rating: 5,
                content: 'Expérience incroyable ! Mon chien Max a adoré son séjour. Marie est aux petits soins et envoie des photos régulièrement. Je recommande à 100% !',
            },
            {
                listingId: listing1.id,
                authorId: guest1.id,
                rating: 5,
                content: 'Deuxième séjour pour Rex et toujours aussi parfait. Le jardin est un vrai paradis pour les chiens.',
            },
            {
                listingId: listing3.id,
                authorId: guest1.id,
                rating: 5,
                content: 'La meilleure pension que j\'ai trouvée ! Mon golden retriever ne voulait plus partir. La piscine est un gros plus.',
            },
        ],
    });

    // ==================== CREATE BOOKINGS ====================
    console.log('📅 Creating bookings...');

    const booking = await prisma.booking.create({
        data: {
            bookingNumber: generateBookingNumber(),
            listingId: listing1.id,
            guestId: guest1.id,
            hostId: host1.id,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            nights: 3,
            guestsCount: 1,
            pricePerNight: 35,
            totalPrice: 120,
            serviceFee: 15,
            antiCatFee: 0,
            status: 'confirmed',
        },
    });

    // ==================== CREATE CONVERSATIONS ====================
    console.log('💬 Creating conversations...');

    await prisma.conversation.create({
        data: {
            listingId: listing1.id,
            guestId: guest1.id,
            hostId: host1.id,
            bookingId: booking.id,
            lastMessage: 'Super ! Je vais réserver pour la semaine prochaine alors. Merci !',
            lastMessageAt: new Date(),
            messages: {
                create: [
                    {
                        senderId: guest1.id,
                        content: 'Bonjour ! Est-ce que vous acceptez les gros chiens ? Mon golden fait 32kg.',
                    },
                    {
                        senderId: host1.id,
                        content: 'Bonjour Sophie ! Oui bien sûr, j\'accueille les chiens jusqu\'à 40kg. Votre golden sera le bienvenu ! 🐕',
                    },
                    {
                        senderId: guest1.id,
                        content: 'Super ! Je vais réserver pour la semaine prochaine alors. Merci !',
                    },
                ],
            },
        },
    });

    console.log('✅ Database seeded successfully!');
    console.log(`
📊 Summary:
   - Users: 3 (2 hosts, 1 guest)
   - Listings: 3
   - Reviews: 3
   - Bookings: 1
   - Conversations: 1

🔑 Test accounts:
   - Host: marie@example.com / password123
   - Host: jean@example.com / password123  
   - Guest: guest@example.com / password123
    `);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
