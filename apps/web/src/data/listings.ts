/**
 * ==================== DONNÉES DES ANNONCES ====================
 * Fichier centralisé pour toutes les données des listings AirB'n'Bark
 * Concept: "Airbnb pour chiens" + Tinder swipe
 * 
 * Types de logement:
 * - "Niche entière" = logement complet pour chien
 * - "Nicholoc" = chambre dans une coloc canine
 * - "Nichortoir" = lit dans un dortoir de chiens
 */

/**
 * ==================== INTERFACES ====================
 */

// Types de logement disponibles
export type ListingType = 'niche' | 'nicholoc' | 'nichortoir';


// Informations de l'hôte
export interface ListingHost {
    name: string;
    avatar: string;
    isNewHost: boolean;
    isSuperHost: boolean;
    rating: number;
    reviewCount: number;
    responseRate: number;
    yearsHosting: number;
}

// Localisation détaillée
export interface ListingLocation {
    lat: number;
    lng: number;
    address: string;
    city: string;
    country: string;
}

// Chambre/espace de couchage
export interface ListingRoom {
    name: string;
    description: string;
    image: string;
}

// Équipement avec icône
export interface ListingAmenity {
    name: string;
    icon: 'flame' | 'droplets' | 'scroll' | 'home' | 'cat' | 'bone' | 'shield' | 'leaf' | 'moon' | 'sun';
}

// Point fort de l'annonce
export interface ListingHighlight {
    title: string;
    description: string;
    icon: 'search' | 'star' | 'check' | 'paw' | 'shield';
}

// Avis d'un utilisateur (woufview)
export interface ListingReview {
    id: string;
    authorName: string;
    authorAvatar: string;
    rating: number;
    date: string;
    content: string;
    platformDate: string;
}

// Tarification
export interface ListingPricing {
    amount: number;
    currency: string;
    nights: number;
    dateRange: string;
    hasFreeCancellation: boolean;
}

// Option Anti-Chat
export interface AntiCatOption {
    available: boolean;
    riskScore: number; // 0-100 (0 = aucun chat dans le quartier, 100 = invasion féline)
    extraPrice: number; // Prix supplémentaire pour l'option
}

// Règles de la niche
export interface ListingRules {
    maxBarkHour: string; // "22h00"
    mustBeVaccinated: boolean;
    mustBeNeutered: boolean;
    allowsPuppies: boolean;
    minAge: number; // en mois
}

// Données de base pour la carte swipable
export interface ListingCardData {
    id: string;
    type: ListingType;
    title: string;
    subtitle: string;
    location: string;
    image: string;
    price: number;
    rating: number;
    hostName: string;
    hostAvatar: string;
    maxDogs: number;
    antiCat: AntiCatOption;
}

// Données complètes pour la page détail
export interface ListingFullData extends ListingCardData {
    capacity: string;
    images: string[];
    description: string;
    host: ListingHost;
    locationDetails: ListingLocation;
    rooms: ListingRoom[];
    amenities: ListingAmenity[];
    highlights: ListingHighlight[];
    reviews: ListingReview[];
    pricing: ListingPricing;
    rules: ListingRules;
    reviewsCount: number;
    cancellationPolicy: 'flexible' | 'moderate' | 'strict';
}

/**
 * ==================== DONNÉES MOCKÉES - CARTES ====================
 * 10 annonces pour l'interface de swipe
 */
export const MOCK_LISTINGS: ListingCardData[] = [
    {
        id: '1',
        type: 'niche',
        title: 'Luxury Niche 10min du Parc · Plaid chauffant',
        subtitle: 'Niche entière à Paris, France',
        location: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=1200&fit=crop',
        price: 45,
        rating: 5.0,
        hostName: 'Melissa',
        hostAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        maxDogs: 1,
        antiCat: { available: true, riskScore: 15, extraPrice: 5 },
    },
    {
        id: '2',
        type: 'nicholoc',
        title: 'Nicholoc cosy · Coloc 3 toutous max',
        subtitle: 'Chambre en coloc canine à Lyon, France',
        location: 'Lyon, France',
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=1200&fit=crop',
        price: 28,
        rating: 4.8,
        hostName: 'Pierre',
        hostAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        maxDogs: 1,
             antiCat: { available: false, riskScore: 45, extraPrice: 0 },
    },
    {
        id: '3',
        type: 'nichortoir',
        title: 'Nichortoir Budget · Dortoir 6 chiens',
        subtitle: 'Lit en dortoir canin à Marseille, France',
        location: 'Marseille, France',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=1200&fit=crop',
        price: 15,
        rating: 4.5,
        hostName: 'Sophie',
        hostAvatar: 'https://randomuser.me/api/portraits/women/65.jpg',
        maxDogs: 1,
        antiCat: { available: true, riskScore: 80, extraPrice: 8 },
    },
    {
        id: '4',
        type: 'niche',
        title: 'Dog Villa · Jardin clôturé 200m²',
        subtitle: 'Niche entière à Bordeaux, France',
        location: 'Bordeaux, France',
        image: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=800&h=1200&fit=crop',
        price: 65,
        rating: 4.9,
        hostName: 'Marie',
        hostAvatar: 'https://randomuser.me/api/portraits/women/28.jpg',
        maxDogs: 3,
        antiCat: { available: true, riskScore: 5, extraPrice: 3 },
    },
    {
        id: '5',
        type: 'niche',
        title: 'Beach Niche · Plage dog-friendly à 50m',
        subtitle: 'Niche entière à Biarritz, France',
        location: 'Biarritz, France',
        image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&h=1200&fit=crop',
        price: 55,
        rating: 4.7,
        hostName: 'Lucas',
        hostAvatar: 'https://randomuser.me/api/portraits/men/75.jpg',
        maxDogs: 2,
              antiCat: { available: false, riskScore: 20, extraPrice: 0 },
    },
    {
        id: '6',
        type: 'nicholoc',
        title: 'Nicholoc Montagne · Rando incluse',
        subtitle: 'Chambre en coloc canine à Chamonix, France',
        location: 'Chamonix, France',
        image: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&h=1200&fit=crop',
        price: 35,
        rating: 4.9,
        hostName: 'Emma',
        hostAvatar: 'https://randomuser.me/api/portraits/women/12.jpg',
        maxDogs: 1,
              antiCat: { available: true, riskScore: 0, extraPrice: 2 },
    },
    {
        id: '7',
        type: 'niche',
        title: 'Penthouse Niche · Rooftop privé',
        subtitle: 'Niche entière à Nice, France',
        location: 'Nice, France',
        image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=1200&fit=crop',
        price: 85,
        rating: 5.0,
        hostName: 'Antoine',
        hostAvatar: 'https://randomuser.me/api/portraits/men/18.jpg',
        maxDogs: 2,
        antiCat: { available: true, riskScore: 10, extraPrice: 5 },
    },
    {
        id: '8',
        type: 'nichortoir',
        title: 'Nichortoir Social · Coin jeux collectif',
        subtitle: 'Lit en dortoir canin à Toulouse, France',
        location: 'Toulouse, France',
        image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=1200&fit=crop',
        price: 12,
        rating: 4.3,
        hostName: 'Claire',
        hostAvatar: 'https://randomuser.me/api/portraits/women/33.jpg',
        maxDogs: 1,
        antiCat: { available: false, riskScore: 60, extraPrice: 0 },
    },
    {
        id: '9',
        type: 'niche',
        title: 'Eco-Niche · 100% nature & bio',
        subtitle: 'Niche entière à Annecy, France',
        location: 'Annecy, France',
        image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=1200&fit=crop',
        price: 50,
        rating: 4.8,
        hostName: 'Thomas',
        hostAvatar: 'https://randomuser.me/api/portraits/men/22.jpg',
        maxDogs: 2,
             antiCat: { available: true, riskScore: 5, extraPrice: 4 },
    },
    {
        id: '10',
        type: 'nicholoc',
        title: 'Nicholoc Urbaine · Parc à 2 min',
        subtitle: 'Chambre en coloc canine à Nantes, France',
        location: 'Nantes, France',
        image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&h=1200&fit=crop',
        price: 30,
        rating: 4.6,
        hostName: 'Julie',
        hostAvatar: 'https://randomuser.me/api/portraits/women/45.jpg',
        maxDogs: 1,
             antiCat: { available: true, riskScore: 35, extraPrice: 6 },
    },
];

/**
 * ==================== DONNÉES MOCKÉES - DÉTAILS COMPLETS ====================
 * Données détaillées pour la page de description
 */
export const MOCK_LISTINGS_FULL: Record<string, ListingFullData> = {
    '1': {
        ...MOCK_LISTINGS[0],
        capacity: '1 chien · 1 niche · 1 couchage · 1 coin gamelle',
        images: [
            'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=800&h=600&fit=crop',
        ],
        description:
            "Cette niche AirB'n'Bark cosy est située dans un quartier calme, à 10 minutes du parc le plus proche pour des promenades sans stress. L'espace est à l'intérieur d'une résidence sécurisée avec une cour tranquille (parfaite pour une session sniff rapide). Ton toutou profitera d'un coin couverture chauffante, d'une station d'eau fraîche, et d'une zone chill \"sans écureuils\". Option Protection Anti-Chat disponible pour les chiens qui préfèrent une vibe 100% sans félin.",
        host: {
            name: 'Melissa',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            isNewHost: true,
            isSuperHost: false,
            rating: 5.0,
            reviewCount: 4,
            responseRate: 100,
            yearsHosting: 1,
        },
        locationDetails: {
            lat: 48.8566,
            lng: 2.3522,
            address: '15 Rue du Faubourg Saint-Antoine',
            city: 'Paris',
            country: 'France',
        },
        rooms: [
            {
                name: 'Niche Room (Chambre)',
                description: '1 panier premium, 1 coin couverture chauffante',
                image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=300&fit=crop',
            },
            {
                name: 'Chill Zone (Salon)',
                description: '1 tapis moelleux, 1 panier à jouets (écureuil inclus)',
                image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Coin couverture chauffante', icon: 'flame' },
            { name: 'Station eau fraîche + gamelle', icon: 'droplets' },
            { name: 'Kit nettoyage pattes (serviette + lingettes)', icon: 'scroll' },
            { name: 'Cour sécurisée (anti-évasion)', icon: 'home' },
            { name: 'Option Anti-Chat disponible (+5€)', icon: 'cat' },
        ],
        highlights: [
            {
                title: 'Check-in au museau exceptionnel',
                description: 'Les toutous récents ont mis 5 Wouf au check-in (sniff QR fluide).',
                icon: 'search',
            },
            {
                title: 'Melissa est une nouvelle hôte',
                description: 'Nouvelle sur AirB\'n\'Bark mais déjà 4 woufviews 5 étoiles !',
                icon: 'star',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Milo (Golden Retriever)',
                authorAvatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 2 jours',
                content: 'Woof woof wooof ! Le plaid chauffant était incroyable. J\'ai reniflé chaque coin, approuvé à 100%. Le sniff QR au check-in était rapide. Je recommande !',
                platformDate: 'Il y a 4 mois sur AirB\'n\'Bark',
            },
            {
                id: 'rev2',
                authorName: 'Luna (Border Collie)',
                authorAvatar: 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 1 semaine',
                content: 'Enfin une niche où on respecte mon espace ! Pas de chat en vue grâce à l\'option Anti-Chat. Le parc est vraiment à 10 min, j\'ai chronométré (en trottinant).',
                platformDate: 'Il y a 3 mois sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 45,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: true,
        },
        rules: {
            maxBarkHour: '22h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: true,
            minAge: 3,
        },
        reviewsCount: 4,
        cancellationPolicy: 'flexible',
    },
    '2': {
        ...MOCK_LISTINGS[1],
        capacity: '1 chien · 1 chambre en coloc · 1 couchage · gamelle partagée',
        images: [
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&h=600&fit=crop',
        ],
        description:
            "Nicholoc parfaite pour les toutous sociables ! Tu partageras l'espace avec 2 autres chiens max (tous vérifiés et vaccinés). Ambiance détendue, coin sieste individuel, et aire de jeux commune. Idéal pour les chiens qui aiment se faire des potes. Le dog-sitter Pierre est aux petits soins !",
        host: {
            name: 'Pierre',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            isNewHost: false,
            isSuperHost: true,
            rating: 4.8,
            reviewCount: 89,
            responseRate: 95,
            yearsHosting: 3,
        },
        locationDetails: {
            lat: 45.764,
            lng: 4.8357,
            address: 'Rue de la République',
            city: 'Lyon',
            country: 'France',
        },
        rooms: [
            {
                name: 'Chambre privée',
                description: '1 panier individuel, couverture personnelle',
                image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Panier individuel', icon: 'home' },
            { name: 'Gamelle partagée (eau à volonté)', icon: 'droplets' },
            { name: 'Aire de jeux commune', icon: 'bone' },
            { name: 'Promenade matin & soir incluse', icon: 'leaf' },
            { name: 'Surveillance 24h/24', icon: 'shield' },
        ],
        highlights: [
            {
                title: 'Pierre est un Superhost',
                description: '89 woufviews, 3 ans d\'expérience. Les toutous l\'adorent !',
                icon: 'star',
            },
            {
                title: 'Parfait pour chiens sociables',
                description: 'Coloc vérifiée, tous les résidents sont vaccinés et sympas.',
                icon: 'check',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Rex (Berger Allemand)',
                authorAvatar: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 3 jours',
                content: 'J\'ai rencontré mon nouveau best friend ici ! Un Labrador super sympa. Pierre nous a emmenés au parc ensemble. Top coloc !',
                platformDate: 'Il y a 2 mois sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 28,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: true,
        },
        rules: {
            maxBarkHour: '21h00',
            mustBeVaccinated: true,
            mustBeNeutered: true,
            allowsPuppies: false,
            minAge: 12,
        },
        reviewsCount: 89,
        cancellationPolicy: 'moderate',
    },
    '3': {
        ...MOCK_LISTINGS[2],
        capacity: '1 chien · 1 lit en dortoir · gamelle collective',
        images: [
            'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
        ],
        description:
            "Nichortoir économique pour toutous aventuriers ! Dortoir de 6 chiens max, ambiance auberge de jeunesse canine. Parfait pour un séjour court ou les budgets serrés. Attention : zone à risque chat élevé (option Anti-Chat fortement recommandée). Gamelle collective, mais portions généreuses !",
        host: {
            name: 'Sophie',
            avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
            isNewHost: false,
            isSuperHost: false,
            rating: 4.5,
            reviewCount: 156,
            responseRate: 88,
            yearsHosting: 4,
        },
        locationDetails: {
            lat: 43.2965,
            lng: 5.3698,
            address: 'Vieux-Port',
            city: 'Marseille',
            country: 'France',
        },
        rooms: [
            {
                name: 'Dortoir principal',
                description: '6 paniers alignés, ambiance sociale',
                image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Lit en dortoir', icon: 'home' },
            { name: 'Gamelle collective', icon: 'droplets' },
            { name: 'Option Anti-Chat recommandée (+8€)', icon: 'cat' },
            { name: 'Casier à jouets personnel', icon: 'bone' },
        ],
        highlights: [
            {
                title: 'Prix imbattable',
                description: 'Le nichortoir le moins cher de Marseille !',
                icon: 'check',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Buddy (Beagle)',
                authorAvatar: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=100&h=100&fit=crop',
                rating: 4,
                date: 'Il y a 1 semaine',
                content: 'Correct pour le prix ! J\'ai fait des potes, mais j\'ai aperçu un chat par la fenêtre... Prenez l\'option Anti-Chat, sérieux.',
                platformDate: 'Il y a 1 mois sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 15,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: false,
        },
        rules: {
            maxBarkHour: '21h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: false,
            minAge: 6,
        },
        reviewsCount: 156,
        cancellationPolicy: 'strict',
    },
    '4': {
        ...MOCK_LISTINGS[3],
        capacity: '3 chiens · 2 niches · 3 couchages · 2 coins gamelle',
        images: [
            'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&h=600&fit=crop',
        ],
        description:
            "Dog Villa de luxe avec jardin clôturé de 200m² ! Parfait pour les grands gabarits ou les meutes jusqu'à 3 toutous. Courir, creuser, rouler dans l'herbe : tout est permis ! Zone quasi sans chat (score risque 5/100). Marie, la dog-sitter, prépare des repas maison avec des ingrédients bio.",
        host: {
            name: 'Marie',
            avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
            isNewHost: false,
            isSuperHost: true,
            rating: 4.9,
            reviewCount: 127,
            responseRate: 98,
            yearsHosting: 5,
        },
        locationDetails: {
            lat: 44.8378,
            lng: -0.5792,
            address: '15 Rue des Vignes',
            city: 'Bordeaux',
            country: 'France',
        },
        rooms: [
            {
                name: 'Niche principale',
                description: '2 paniers XL, coin couverture',
                image: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&h=300&fit=crop',
            },
            {
                name: 'Niche secondaire',
                description: '1 panier L, vue jardin',
                image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Jardin clôturé 200m²', icon: 'leaf' },
            { name: 'Repas maison bio', icon: 'bone' },
            { name: 'Piscine pour chiens (été)', icon: 'droplets' },
            { name: 'Zone anti-chat (score 5/100)', icon: 'cat' },
            { name: 'Surveillance caméra 24h', icon: 'shield' },
        ],
        highlights: [
            {
                title: 'Marie est une Superhost',
                description: '127 woufviews, 5 ans d\'expérience. Cuisine maison pour toutous !',
                icon: 'star',
            },
            {
                title: 'Jardin immense',
                description: '200m² de terrain clôturé. Liberté totale pour courir !',
                icon: 'check',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Max (Labrador)',
                authorAvatar: 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 5 jours',
                content: 'LE JARDIN !!! J\'ai couru pendant 3h non-stop. Et la bouffe maison de Marie, un régal. Je reviens avec toute ma meute.',
                platformDate: 'Il y a 2 semaines sur AirB\'n\'Bark',
            },
            {
                id: 'rev2',
                authorName: 'Bella (Husky)',
                authorAvatar: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 2 semaines',
                content: 'J\'ai même pu creuser des trous sans me faire gronder ! Marie est la meilleure. Et zéro chat à l\'horizon, nickel.',
                platformDate: 'Il y a 1 mois sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 65,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: true,
        },
        rules: {
            maxBarkHour: '23h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: true,
            minAge: 2,
        },
        reviewsCount: 127,
        cancellationPolicy: 'flexible',
    },
    '5': {
        ...MOCK_LISTINGS[4],
        capacity: '2 chiens · 1 niche · 2 couchages · 1 coin gamelle',
        images: [
            'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&h=600&fit=crop',
        ],
        description:
            "Beach Niche à 50m de la plage dog-friendly de Biarritz ! Ton toutou pourra courir sur le sable, se baigner, et chasser les vagues. Douche extérieure pour rincer les pattes sableuses. Attention : les chats du quartier sont rares mais pas inexistants.",
        host: {
            name: 'Lucas',
            avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
            isNewHost: false,
            isSuperHost: false,
            rating: 4.7,
            reviewCount: 64,
            responseRate: 92,
            yearsHosting: 2,
        },
        locationDetails: {
            lat: 43.4832,
            lng: -1.5586,
            address: 'Avenue de la Plage',
            city: 'Biarritz',
            country: 'France',
        },
        rooms: [
            {
                name: 'Niche plage',
                description: '2 paniers avec vue océan',
                image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Plage dog-friendly à 50m', icon: 'sun' },
            { name: 'Douche extérieure pattes', icon: 'droplets' },
            { name: 'Jouets de plage', icon: 'bone' },
            { name: 'Terrasse ombragée', icon: 'home' },
        ],
        highlights: [
            {
                title: 'Accès plage direct',
                description: 'La plage autorisée aux chiens est à 1 minute à patte !',
                icon: 'check',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Oscar (Boxer)',
                authorAvatar: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 1 semaine',
                content: 'J\'AI CHASSÉ DES VAGUES !!! Meilleure expérience de ma vie de chien. La douche après c\'est pas ouf mais bon...',
                platformDate: 'Il y a 3 semaines sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 55,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: true,
        },
        rules: {
            maxBarkHour: '22h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: true,
            minAge: 4,
        },
        reviewsCount: 64,
        cancellationPolicy: 'moderate',
    },
    '6': {
        ...MOCK_LISTINGS[5],
        capacity: '1 chien · 1 chambre en coloc · 1 couchage · gamelle partagée',
        images: [
            'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop',
        ],
        description:
            "Nicholoc en montagne avec rando incluse ! Emma t'emmène chaque matin pour une balade de 2h dans les sentiers de Chamonix. Parfait pour les chiens sportifs. Zone 100% sans chat (score 0/100). L'air pur des Alpes, rien de mieux pour les poumons canins !",
        host: {
            name: 'Emma',
            avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
            isNewHost: false,
            isSuperHost: true,
            rating: 4.9,
            reviewCount: 83,
            responseRate: 99,
            yearsHosting: 4,
        },
        locationDetails: {
            lat: 45.9237,
            lng: 6.8694,
            address: 'Route des Pèlerins',
            city: 'Chamonix',
            country: 'France',
        },
        rooms: [
            {
                name: 'Chambre alpine',
                description: '1 panier douillet, vue Mont-Blanc',
                image: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Rando 2h incluse chaque matin', icon: 'leaf' },
            { name: 'Zone 100% sans chat', icon: 'cat' },
            { name: 'Coin cheminée', icon: 'flame' },
            { name: 'Gamelle eau de source', icon: 'droplets' },
        ],
        highlights: [
            {
                title: 'Emma est une Superhost',
                description: 'Guide de montagne certifiée, 83 woufviews, adore les randos !',
                icon: 'star',
            },
            {
                title: 'Zone 0% chat garantie',
                description: 'Score Anti-Chat de 0/100. Aucun félin à des km à la ronde.',
                icon: 'shield',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Storm (Husky)',
                authorAvatar: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 4 jours',
                content: 'LA NEIGE !!! J\'ai couru, sauté, roulé... Et Emma marche super vite, j\'adore. Pas un seul chat, le paradis.',
                platformDate: 'Il y a 2 semaines sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 35,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: true,
        },
        rules: {
            maxBarkHour: '21h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: false,
            minAge: 12,
        },
        reviewsCount: 83,
        cancellationPolicy: 'flexible',
    },
    '7': {
        ...MOCK_LISTINGS[6],
        capacity: '2 chiens · 1 niche luxe · 2 couchages · 2 coins gamelle',
        images: [
            'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=600&fit=crop',
        ],
        description:
            "Penthouse Niche avec rooftop privé ! Vue panoramique sur la Côte d'Azur. Espace luxueux pour petits et moyens chiens. Room service gamelle disponible 24h/24. Option Anti-Chat premium avec patrouille anti-félin toutes les heures.",
        host: {
            name: 'Antoine',
            avatar: 'https://randomuser.me/api/portraits/men/18.jpg',
            isNewHost: false,
            isSuperHost: true,
            rating: 5.0,
            reviewCount: 42,
            responseRate: 100,
            yearsHosting: 3,
        },
        locationDetails: {
            lat: 43.7102,
            lng: 7.262,
            address: 'Promenade des Anglais',
            city: 'Nice',
            country: 'France',
        },
        rooms: [
            {
                name: 'Suite Penthouse',
                description: '2 paniers premium, climatisation, vue mer',
                image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=300&fit=crop',
            },
            {
                name: 'Rooftop privé',
                description: 'Terrasse 50m², transats pour chiens',
                image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Rooftop privé avec vue mer', icon: 'sun' },
            { name: 'Room service gamelle 24h/24', icon: 'bone' },
            { name: 'Climatisation', icon: 'home' },
            { name: 'Patrouille anti-chat horaire', icon: 'cat' },
            { name: 'Spa canin sur demande', icon: 'droplets' },
        ],
        highlights: [
            {
                title: 'Expérience 5 étoiles',
                description: 'Note parfaite de 5.0. Le luxe ultime pour toutous.',
                icon: 'star',
            },
            {
                title: 'Rooftop exclusif',
                description: 'Terrasse privée avec vue sur la Méditerranée.',
                icon: 'check',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Coco (Caniche)',
                authorAvatar: 'https://images.unsplash.com/photo-1575425186775-b8de9a427e67?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 2 jours',
                content: 'Je me suis sentie comme une vraie princesse. Le rooftop, le room service... Et la patrouille anti-chat, quelle classe !',
                platformDate: 'Il y a 1 semaine sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 85,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: true,
        },
        rules: {
            maxBarkHour: '23h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: true,
            minAge: 3,
        },
        reviewsCount: 42,
        cancellationPolicy: 'flexible',
    },
    '8': {
        ...MOCK_LISTINGS[7],
        capacity: '1 chien · 1 lit en dortoir · coin jeux collectif',
        images: [
            'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop',
        ],
        description:
            "Nichortoir social avec coin jeux collectif ! Parfait pour les chiens ultra-sociables qui veulent se faire plein de potes. Dortoir de 8 lits, ambiance festive garantie. Attention : risque chat modéré, option Anti-Chat non disponible (Claire a un chat qui passe parfois...).",
        host: {
            name: 'Claire',
            avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
            isNewHost: false,
            isSuperHost: false,
            rating: 4.3,
            reviewCount: 98,
            responseRate: 85,
            yearsHosting: 2,
        },
        locationDetails: {
            lat: 43.6047,
            lng: 1.4442,
            address: 'Place du Capitole',
            city: 'Toulouse',
            country: 'France',
        },
        rooms: [
            {
                name: 'Dortoir social',
                description: '8 paniers, ambiance colonie de vacances',
                image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=300&fit=crop',
            },
            {
                name: 'Aire de jeux',
                description: 'Jouets à volonté, tunnel, balles',
                image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Coin jeux géant', icon: 'bone' },
            { name: 'Gamelle collective XXL', icon: 'droplets' },
            { name: 'Tunnel et obstacles', icon: 'home' },
            { name: 'Ambiance sociale garantie', icon: 'leaf' },
        ],
        highlights: [
            {
                title: 'Prix mini',
                description: 'Le nichortoir le moins cher de Toulouse !',
                icon: 'check',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Rocky (Bulldog)',
                authorAvatar: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop',
                rating: 4,
                date: 'Il y a 5 jours',
                content: 'Beaucoup de bruit, beaucoup de fun ! J\'ai rencontré 7 nouveaux potes. Par contre le chat de Claire est passé, j\'ai pas aimé.',
                platformDate: 'Il y a 3 semaines sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 12,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: false,
        },
        rules: {
            maxBarkHour: '20h00',
            mustBeVaccinated: true,
            mustBeNeutered: true,
            allowsPuppies: false,
            minAge: 12,
        },
        reviewsCount: 98,
        cancellationPolicy: 'strict',
    },
    '9': {
        ...MOCK_LISTINGS[8],
        capacity: '2 chiens · 1 éco-niche · 2 couchages · gamelle bio',
        images: [
            'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&h=600&fit=crop',
        ],
        description:
            "Éco-Niche 100% nature et bio ! Croquettes bio, jouets en matériaux recyclés, jardin sans pesticides. Thomas est un dog-sitter éco-responsable qui prône le bien-être animal ET environnemental. Zone quasiment sans chat (lac = pas d'habitat félin).",
        host: {
            name: 'Thomas',
            avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
            isNewHost: false,
            isSuperHost: true,
            rating: 4.8,
            reviewCount: 56,
            responseRate: 97,
            yearsHosting: 3,
        },
        locationDetails: {
            lat: 45.899,
            lng: 6.1294,
            address: 'Bord du Lac',
            city: 'Annecy',
            country: 'France',
        },
        rooms: [
            {
                name: 'Éco-niche principale',
                description: '2 paniers en fibres naturelles, couvertures bio',
                image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Croquettes 100% bio', icon: 'bone' },
            { name: 'Jouets en matériaux recyclés', icon: 'leaf' },
            { name: 'Jardin sans pesticides', icon: 'home' },
            { name: 'Eau de source filtrée', icon: 'droplets' },
            { name: 'Zone quasi sans chat', icon: 'cat' },
        ],
        highlights: [
            {
                title: 'Thomas est un Superhost éco',
                description: 'Engagement 100% bio et éco-responsable.',
                icon: 'star',
            },
            {
                title: 'Vue lac',
                description: 'Balades au bord du lac d\'Annecy incluses.',
                icon: 'check',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Nala (Golden Retriever)',
                authorAvatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 1 semaine',
                content: 'Les croquettes bio étaient délicieuses ! Et le lac... J\'ai nagé pendant des heures. Thomas est super attentionné.',
                platformDate: 'Il y a 1 mois sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 50,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: true,
        },
        rules: {
            maxBarkHour: '22h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: true,
            minAge: 3,
        },
        reviewsCount: 56,
        cancellationPolicy: 'flexible',
    },
    '10': {
        ...MOCK_LISTINGS[9],
        capacity: '1 chien · 1 chambre en coloc · 1 couchage · gamelle partagée',
        images: [
            'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
        ],
        description:
            "Nicholoc urbaine à 2 minutes du plus grand parc de Nantes ! Parfait pour les chiens citadins. Julie sort les résidents 3 fois par jour. Coloc de 2 chiens max, ambiance chill. Option Anti-Chat disponible car le quartier a quelques félins errants.",
        host: {
            name: 'Julie',
            avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
            isNewHost: false,
            isSuperHost: false,
            rating: 4.6,
            reviewCount: 73,
            responseRate: 90,
            yearsHosting: 2,
        },
        locationDetails: {
            lat: 47.2184,
            lng: -1.5536,
            address: 'Rue de la Paix',
            city: 'Nantes',
            country: 'France',
        },
        rooms: [
            {
                name: 'Chambre urbaine',
                description: '1 panier confort, ambiance city',
                image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop',
            },
        ],
        amenities: [
            { name: 'Parc à 2 min à patte', icon: 'leaf' },
            { name: '3 sorties par jour', icon: 'sun' },
            { name: 'Option Anti-Chat (+6€)', icon: 'cat' },
            { name: 'Gamelle eau fraîche', icon: 'droplets' },
        ],
        highlights: [
            {
                title: 'Emplacement idéal',
                description: 'Le parc est littéralement au coin de la rue !',
                icon: 'check',
            },
        ],
        reviews: [
            {
                id: 'rev1',
                authorName: 'Charlie (Corgi)',
                authorAvatar: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=100&h=100&fit=crop',
                rating: 5,
                date: 'Il y a 3 jours',
                content: 'Avec mes petites pattes, le parc à 2 min c\'est parfait ! Julie est super ponctuelle pour les sorties. J\'ai pris l\'option Anti-Chat, au cas où.',
                platformDate: 'Il y a 2 semaines sur AirB\'n\'Bark',
            },
        ],
        pricing: {
            amount: 30,
            currency: '€',
            nights: 2,
            dateRange: '20-22 Jan',
            hasFreeCancellation: true,
        },
        rules: {
            maxBarkHour: '21h30',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: true,
            minAge: 4,
        },
        reviewsCount: 73,
        cancellationPolicy: 'moderate',
    },
};

/**
 * ==================== FONCTIONS UTILITAIRES ====================
 * Helpers pour récupérer les données (simule une API)
 */

// Récupérer toutes les annonces (cartes)
export const getListings = (): ListingCardData[] => {
    return MOCK_LISTINGS;
};

// Récupérer une annonce complète par ID
export const getListingById = (id: string): ListingFullData | null => {
    return MOCK_LISTINGS_FULL[id] || null;
};

// Récupérer les favoris (pour plus tard)
export const getFavorites = (ids: string[]): ListingCardData[] => {
    return MOCK_LISTINGS.filter((listing) => ids.includes(listing.id));
};

// Filtrer par type de logement
export const getListingsByType = (type: ListingType): ListingCardData[] => {
    return MOCK_LISTINGS.filter((listing) => listing.type === type);
};

// Filtrer les annonces avec option Anti-Chat disponible
export const getAntiCatListings = (): ListingCardData[] => {
    return MOCK_LISTINGS.filter((listing) => listing.antiCat.available);
};