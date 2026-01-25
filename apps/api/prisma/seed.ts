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
    await prisma.language.deleteMany();

    // ==================== CREATE USERS ====================
    console.log('👤 Creating users...');

    await prisma.language.createMany({
        data: [
            { code: 'english', label: 'English' },
            { code: 'french', label: 'Français' },
            { code: 'german', label: 'Deutsch' },
            { code: 'icelandic', label: 'Íslenska' },
        ],
        skipDuplicates: true,
    });

    const englishLanguage = await prisma.language.findUnique({
        where: { code: 'english' },
    });

    const hashedPassword = await hash('password123', 12);

    const host1 = await prisma.user.create({
        data: {
            email: 'marie@example.com',
            password: hashedPassword,
            name: 'Marie Dupont',
            avatar: 'https://picsum.photos/id/237/200',
            phone: '+33612345678',
            isHost: true,
            isVerified: true,
            languageId: englishLanguage?.id,
        },
    });

    const host2 = await prisma.user.create({
        data: {
            email: 'jean@example.com',
            password: hashedPassword,
            name: 'Jean Martin',
            avatar: 'https://picsum.photos/id/200/200',
            phone: '+33687654321',
            isHost: true,
            isVerified: true,
            languageId: englishLanguage?.id,
        },
    });

    const guest1 = await prisma.user.create({
        data: {
            email: 'guest@example.com',
            password: hashedPassword,
            name: 'Sophie Bernard',
            avatar: 'https://picsum.photos/id/169/200',
            isHost: false,
            languageId: englishLanguage?.id,
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
            description: `Salut toi, le chien ! Ici, tout est fait pour que tu passes un séjour de rêve dans une niche de luxe.

Dans un jardin arboré de 500m², ta niche spacieuse est pensée pour que tu te sentes roi.

Équipements inclus pour toi :
- Coussin orthopédique haut de gamme
- Gamelles en inox
- Jouets variés
- Accès au jardin 24h/24

Je suis présente à la maison et je propose des promenades 3 fois par jour minimum pour que tu restes actif et serein.`,
            address: '15 Rue de la Paix',
            city: 'Paris',
            country: 'France',
            lat: 48.8698,
            lng: 2.3311,
            pricePerNight: 35,
            currency: 'EUR',
            maxDogs: 2,
            capacity: '2 chiens max',
            mainImage: 'https://picsum.photos/id/98/500/300',
            images: [
                'https://picsum.photos/id/28/500/300',
                'https://picsum.photos/id/89/500/300',
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
            description: `Bienvenue à toi, le toutou ! Mon appartement est spécialement aménagé pour que tu sois à l'aise.

Situé en plein cœur de Lyon, à deux pas du Parc de la Tête d'Or, c'est l'endroit idéal pour tes balades quotidiennes.

Tu auras ton propre espace avec :
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
            mainImage: 'https://picsum.photos/id/107/500/300',
            images: [
                'https://picsum.photos/id/112/500/300',
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
            description: `Notre pension familiale t'accueille, toi le chien, dans un cadre exceptionnel !

Sur un terrain de 2 hectares, nous te proposons :
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
            mainImage: 'https://picsum.photos/id/120/4928/3264',
            images: [
                'https://picsum.photos/id/121/500/300',
                'https://picsum.photos/id/118/500/300',
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
