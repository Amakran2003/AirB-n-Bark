import { useState, useEffect, useRef } from 'react';
import { 
    ChevronRight,
    X,
    Plus,
    Minus,
    Check,
    MapPin,
    Camera,
    Trash2,
    Flame,
    Droplets,
    ScrollText,
    Home,
    Cat,
    Bone,
    Shield,
    Leaf,
    Moon,
    Sun,
    Search,
    Star,
    PawPrint,
    Loader2,
    Calendar,
    Bed
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DatePicker } from '../../components/DatePicker';
import { createListing, mapFormDataToApiPayload } from '../../services/hostApi';
import type { 
    ListingType, 
    ListingAmenity,
    ListingHighlight,
    ListingRoom,
    ListingLocation,
    ListingRules,
    DateRange
} from '../../data/listings';

/**
 * ==================== HOST ADD LISTING ====================
 * Formulaire multi-étapes style Airbnb pour créer une annonce
 * 
 * Phases:
 * 1. Décris ta niche (type, espace, localisation, capacité)
 * 2. Fais ressortir ta niche (équipements, photos, titre, description)
 * 3. Finalise et publie (prix, règles, disponibilités, récap)
 * 
 * TODO API:
 * - POST /api/listings → créer une annonce
 * - POST /api/listings/:id/images → upload images
 * - GET /api/geocode?q=... → recherche d'adresse
 * - GET /api/listings/:id → récupérer une annonce (pour édition)
 * - PUT /api/listings/:id → modifier une annonce
 */

interface HostAddListingProps {
    onBack: () => void;
    onSuccess: () => void;
    editListingId?: string; // Pour édition future
}

// Étapes du formulaire
type Step = 
    | 'intro1'
    | 'type'
    | 'location'
    | 'capacity'
    | 'intro2'
    | 'amenities'
    | 'photos'
    | 'rooms'
    | 'title'
    | 'highlights'
    | 'description'
    | 'intro3'
    | 'price'
    | 'rules'
    | 'availability'
    | 'instructions'
    | 'anticat'
    | 'review';

const STEPS: Step[] = [
    'intro1',
    'type',
    'location',
    'capacity',
    'intro2',
    'amenities',
    'photos',
    'rooms',
    'title',
    'highlights',
    'description',
    'intro3',
    'price',
    'rules',
    'availability',
    'instructions',
    'anticat',
    'review'
];

// Types de pièces disponibles pour "Where you'll sleep"
const ROOM_TYPES = [
    { id: 'bedroom', name: 'Chambre', icon: '🛏️' },
    { id: 'living', name: 'Salon', icon: '🛋️' },
    { id: 'garden', name: 'Jardin', icon: '🌳' },
    { id: 'terrace', name: 'Terrasse', icon: '☀️' },
    { id: 'kitchen', name: 'Cuisine', icon: '🍽️' },
    { id: 'bathroom', name: 'Salle de bain', icon: '🚿' },
    { id: 'other', name: 'Autre', icon: '📍' },
];

// Types de niche
const LISTING_TYPES: { id: ListingType; title: string; description: string }[] = [
    { id: 'niche', title: 'Niche entière', description: 'Un espace complet rien que pour le toutou' },
    { id: 'nicholoc', title: 'Nicholoc', description: 'Une chambre dans une coloc canine' },
    { id: 'nichortoir', title: 'Nichortoir', description: 'Un lit dans un dortoir de chiens' }
];

// Équipements disponibles avec leurs icônes
const AVAILABLE_AMENITIES: { name: string; icon: ListingAmenity['icon'] }[] = [
    { name: 'Coin couverture chauffante', icon: 'flame' },
    { name: 'Station eau fraîche + gamelle', icon: 'droplets' },
    { name: 'Kit nettoyage pattes', icon: 'scroll' },
    { name: 'Cour sécurisée', icon: 'home' },
    { name: 'Zone sans chat garantie', icon: 'cat' },
    { name: 'Jouets et os à mâcher', icon: 'bone' },
    { name: 'Espace clôturé anti-évasion', icon: 'shield' },
    { name: 'Jardin naturel', icon: 'leaf' },
    { name: 'Veilleuse nuit', icon: 'moon' },
    { name: 'Exposition plein soleil', icon: 'sun' }
];

// Points forts disponibles (sans 'Hôte expérimenté' - sera hardcodé selon l'expérience réelle)
const AVAILABLE_HIGHLIGHTS: { title: string; description: string; icon: ListingHighlight['icon'] }[] = [
    { title: 'Check-in au museau facile', description: 'Sniff QR rapide et fluide', icon: 'search' },
    { title: 'Tout équipé', description: 'Gamelles, jouets, couchage inclus', icon: 'check' },
    { title: 'Ami des chiens', description: 'Espace 100% dog-friendly', icon: 'paw' },
    { title: 'Sécurité maximale', description: 'Clôtures et surveillance', icon: 'shield' }
];

// Icône mapping
const AmenityIcon = ({ icon, className }: { icon: ListingAmenity['icon']; className?: string }) => {
    const icons = {
        flame: Flame,
        droplets: Droplets,
        scroll: ScrollText,
        home: Home,
        cat: Cat,
        bone: Bone,
        shield: Shield,
        leaf: Leaf,
        moon: Moon,
        sun: Sun
    };
    const IconComponent = icons[icon];
    return <IconComponent className={className} />;
};

const HighlightIcon = ({ icon, className }: { icon: ListingHighlight['icon']; className?: string }) => {
    const icons = {
        search: Search,
        star: Star,
        check: Check,
        paw: PawPrint,
        shield: Shield
    };
    const IconComponent = icons[icon];
    return <IconComponent className={className} />;
};

export const HostAddListing = ({ onBack, onSuccess }: HostAddListingProps) => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>('intro1');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modale de confirmation pour quitter
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    
    // Recherche d'adresse
    const [addressQuery, setAddressQuery] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const addressTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    
    // DatePicker pour les disponibilités
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [tempCheckIn, setTempCheckIn] = useState<string | null>(null);
    const [tempCheckOut, setTempCheckOut] = useState<string | null>(null);
    
    // Ref pour l'input file (upload photos)
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form data qui matche exactement ListingFullData
    const [formData, setFormData] = useState({
        // Base (ListingCardData)
        type: '' as ListingType | '',
        title: '',
        subtitle: '',
        location: '',
        image: '',
        price: 30,
        maxDogs: 1,
        availableDateRanges: [] as DateRange[],
        
        // Anti-Chat
        antiCatAvailable: false,
        antiCatRiskScore: 50,
        antiCatExtraPrice: 5,
        
        // Détails (ListingFullData)
        capacity: {
            dogs: 1,
            niches: 1,
            beds: 1,
            bowls: 1
        },
        images: [] as string[],
        description: '',
        
        // Location
        locationDetails: {
            lat: 0,
            lng: 0,
            address: '',
            city: '',
            country: 'France'
        } as ListingLocation,
        
        // Rooms
        rooms: [] as ListingRoom[],
        
        // Amenities
        amenities: [] as ListingAmenity[],
        
        // Highlights
        highlights: [] as ListingHighlight[],
        
        // Rules
        rules: {
            maxBarkHour: '22h00',
            mustBeVaccinated: true,
            mustBeNeutered: false,
            allowsPuppies: true,
            minAge: 3
        } as ListingRules,
        
        // Instructions d'arrivée (structurées)
        instructions: {
            checkInTime: '15h00',
            checkOutTime: '11h00',
            accessCode: '',
            wifiName: '',
            wifiPassword: '',
            parkingInfo: '',
            specialNotes: '',
        },
        
        // Cancellation
        cancellationPolicy: 'flexible' as 'flexible' | 'moderate' | 'strict'
    });

    // Recherche d'adresse avec l'API Nominatim (OpenStreetMap - gratuit)
    useEffect(() => {
        if (addressQuery.length < 3) {
            setAddressSuggestions([]);
            return;
        }

        if (addressTimeoutRef.current) {
            clearTimeout(addressTimeoutRef.current);
        }

        addressTimeoutRef.current = setTimeout(async () => {
            setIsSearchingAddress(true);
            try {
                // TODO API: Remplacer par GET /api/geocode?q=...
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&countrycodes=fr&limit=5&addressdetails=1`,
                    {
                        headers: {
                            'Accept-Language': 'fr'
                        }
                    }
                );
                const data = await response.json();
                setAddressSuggestions(data);
            } catch (error) {
                console.error('Erreur recherche adresse:', error);
                setAddressSuggestions([]);
            } finally {
                setIsSearchingAddress(false);
            }
        }, 300);

        return () => {
            if (addressTimeoutRef.current) {
                clearTimeout(addressTimeoutRef.current);
            }
        };
    }, [addressQuery]);

    // Sélectionner une adresse
    const selectAddress = (suggestion: any) => {
        const city = suggestion.address?.city || 
                     suggestion.address?.town || 
                     suggestion.address?.village || 
                     suggestion.address?.municipality || 
                     '';
        
        setFormData(prev => ({
            ...prev,
            location: `${city}, France`,
            locationDetails: {
                lat: parseFloat(suggestion.lat),
                lng: parseFloat(suggestion.lon),
                address: suggestion.display_name.split(',').slice(0, 2).join(',').trim(),
                city,
                country: 'France'
            }
        }));
        setAddressQuery(suggestion.display_name);
        setAddressSuggestions([]);
    };

    // Navigation
    const currentStepIndex = STEPS.indexOf(currentStep);
    const isIntroStep = currentStep.startsWith('intro');
    
    const getPhaseProgress = () => {
        // Phase 1: intro1 -> capacity (steps 0-3)
        // Phase 2: intro2 -> description (steps 4-9)
        // Phase 3: intro3 -> review (steps 10-15)
        if (currentStepIndex <= 3) {
            return { phase: 1, progress: ((currentStepIndex) / 3) * 100 };
        } else if (currentStepIndex <= 9) {
            return { phase: 2, progress: ((currentStepIndex - 4) / 5) * 100 };
        } else {
            return { phase: 3, progress: ((currentStepIndex - 10) / 5) * 100 };
        }
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 'intro1':
            case 'intro2':
            case 'intro3':
                return true;
            case 'type':
                return formData.type !== '';
            case 'location':
                return formData.locationDetails.city !== '';
            case 'capacity':
                return formData.capacity.dogs >= 1;
            case 'amenities':
                return formData.amenities.length >= 1;
            case 'photos':
                return formData.images.length >= 1;
            case 'rooms':
                return formData.rooms.length >= 1; // Au moins 1 espace tagué
            case 'title':
                return formData.title.trim().length >= 10;
            case 'highlights':
                return formData.highlights.length >= 1;
            case 'description':
                return formData.description.trim().length >= 50;
            case 'price':
                return formData.price >= 5;
            case 'rules':
                return true;
            case 'availability':
                return formData.availableDateRanges.length >= 1;
            case 'instructions':
                return true; // Optionnel
            case 'anticat':
                return true;
            case 'review':
                return true;
            default:
                return false;
        }
    };

    const goNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < STEPS.length) {
            setCurrentStep(STEPS[nextIndex]);
        }
    };

    const goBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(STEPS[prevIndex]);
        } else {
            onBack();
        }
    };

    // Toggle amenity
    const toggleAmenity = (amenity: { name: string; icon: ListingAmenity['icon'] }) => {
        setFormData(prev => {
            const exists = prev.amenities.find(a => a.name === amenity.name);
            if (exists) {
                return { ...prev, amenities: prev.amenities.filter(a => a.name !== amenity.name) };
            } else {
                return { ...prev, amenities: [...prev.amenities, amenity] };
            }
        });
    };

    // Toggle highlight
    const toggleHighlight = (highlight: ListingHighlight) => {
        setFormData(prev => {
            const exists = prev.highlights.find(h => h.title === highlight.title);
            if (exists) {
                return { ...prev, highlights: prev.highlights.filter(h => h.title !== highlight.title) };
            } else {
                return { ...prev, highlights: [...prev.highlights, highlight] };
            }
        });
    };

    // Ouvrir le sélecteur de fichiers
    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    // Gérer l'upload de photos (convertit en base64 pour localStorage)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, base64],
                    image: prev.images.length === 0 ? base64 : prev.image
                }));
            };
            reader.readAsDataURL(file);
        });
        
        // Reset input pour pouvoir re-sélectionner le même fichier
        e.target.value = '';
    };

    // Supprimer une photo
    const removePhoto = (index: number) => {
        setFormData(prev => {
            const newImages = prev.images.filter((_, i) => i !== index);
            return {
                ...prev,
                images: newImages,
                image: newImages[0] || ''
            };
        });
    };

    // Gérer la sélection de dates depuis le DatePicker
    const handleDateSelect = (checkIn: string | null, checkOut: string | null) => {
        setTempCheckIn(checkIn);
        setTempCheckOut(checkOut);
    };

    // Ajouter une plage de disponibilité depuis le DatePicker
    const addDateRangeFromPicker = () => {
        if (tempCheckIn && tempCheckOut) {
            setFormData(prev => ({
                ...prev,
                availableDateRanges: [...prev.availableDateRanges, { start: tempCheckIn, end: tempCheckOut }]
            }));
            setTempCheckIn(null);
            setTempCheckOut(null);
            setIsDatePickerOpen(false);
        }
    };

    // Supprimer une plage de disponibilité
    const removeDateRange = (index: number) => {
        setFormData(prev => ({
            ...prev,
            availableDateRanges: prev.availableDateRanges.filter((_, i) => i !== index)
        }));
    };

    // Générer le subtitle automatiquement
    const generateSubtitle = (): string => {
        const typeLabels: Record<ListingType, string> = {
            niche: 'Niche entière',
            nicholoc: 'Chambre en coloc canine',
            nichortoir: 'Lit en dortoir canin'
        };
        const typeLabel = formData.type ? typeLabels[formData.type] : '';
        return `${typeLabel} à ${formData.locationDetails.city}, ${formData.locationDetails.country}`;
    };

    // Générer la capacité string
    const generateCapacityString = (): string => {
        const parts = [];
        if (formData.capacity.dogs > 0) parts.push(`${formData.capacity.dogs} chien${formData.capacity.dogs > 1 ? 's' : ''}`);
        if (formData.capacity.niches > 0) parts.push(`${formData.capacity.niches} niche${formData.capacity.niches > 1 ? 's' : ''}`);
        if (formData.capacity.beds > 0) parts.push(`${formData.capacity.beds} couchage${formData.capacity.beds > 1 ? 's' : ''}`);
        if (formData.capacity.bowls > 0) parts.push(`${formData.capacity.bowls} coin${formData.capacity.bowls > 1 ? 's' : ''} gamelle`);
        return parts.join(' · ');
    };

    // Sauvegarder l'annonce
    const handleSubmit = async () => {
        if (!user) return;
        
        setIsSubmitting(true);

        try {
            // Mapper les données du formulaire vers le format API
            const apiPayload = mapFormDataToApiPayload(
                {
                    type: formData.type,
                    title: formData.title,
                    description: formData.description,
                    price: formData.price,
                    capacity: formData.capacity,
                    images: formData.images,
                    locationDetails: formData.locationDetails,
                    amenities: formData.amenities,
                    highlights: formData.highlights,
                    rooms: formData.rooms,
                    rules: formData.rules,
                    availableDateRanges: formData.availableDateRanges,
                    antiCatAvailable: formData.antiCatAvailable,
                    antiCatRiskScore: formData.antiCatRiskScore,
                    antiCatExtraPrice: formData.antiCatExtraPrice,
                    cancellationPolicy: formData.cancellationPolicy,
                },
                user.pseudo || 'Hôte'
            );

            // Appel API
            const result = await createListing(apiPayload);

            if (!result.success) {
                throw new Error(result.error || 'Erreur lors de la création');
            }

            onSuccess();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert(error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Rendu des écrans d'introduction
    const renderIntro = () => {
        const intros = {
            intro1: {
                step: 'Étape 1',
                title: 'Décris ta niche',
                description: 'Dans cette étape, nous allons te demander quel type de niche tu proposes et où elle se trouve.'
            },
            intro2: {
                step: 'Étape 2',
                title: 'Fais ressortir ta niche',
                description: 'Ajoute des photos, un titre accrocheur et une description pour attirer les toutous.'
            },
            intro3: {
                step: 'Étape 3',
                title: 'Finalise et publie',
                description: 'Définis ton prix, tes règles et vérifie que tout est bon avant de publier.'
            }
        };

        const intro = intros[currentStep as keyof typeof intros];

        return (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                    <PawPrint className="w-10 h-10 text-white" />
                </div>
                <p className="text-blue-600 font-semibold mb-2">{intro.step}</p>
                <h1 className="text-3xl font-bold mb-4">{intro.title}</h1>
                <p className="text-secondary text-lg max-w-sm">{intro.description}</p>
            </div>
        );
    };

    // Rendu du contenu selon l'étape
    const renderContent = () => {
        switch (currentStep) {
            case 'intro1':
            case 'intro2':
            case 'intro3':
                return renderIntro();

            case 'type':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Quel type de niche proposes-tu ?</h1>
                        <p className="text-secondary mb-6">Choisis le type qui correspond le mieux à ton espace.</p>
                        <div className="space-y-3">
                            {LISTING_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                                        formData.type === type.id
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <p className="font-semibold text-lg">{type.title}</p>
                                    <p className="text-secondary text-sm mt-1">{type.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'location':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Où se trouve ta niche ?</h1>
                        <p className="text-secondary mb-6">Recherche ton adresse pour que les toutous puissent te trouver.</p>
                        
                        <div className="relative">
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={addressQuery}
                                    onChange={(e) => setAddressQuery(e.target.value)}
                                    placeholder="Rechercher une adresse..."
                                    className="w-full pl-12 pr-10 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-600 focus:outline-none text-lg"
                                />
                                {isSearchingAddress && (
                                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                                )}
                            </div>

                            {addressSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 max-h-60 overflow-y-auto">
                                    {addressSuggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => selectAddress(suggestion)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0"
                                        >
                                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                                            <span className="text-sm">{suggestion.display_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {formData.locationDetails.city && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
                                <div className="flex items-center gap-2 text-green-700 mb-2">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">Adresse sélectionnée</span>
                                </div>
                                <p className="text-sm text-green-800">{formData.locationDetails.address}</p>
                                <p className="text-sm text-green-600 mt-1">
                                    {formData.locationDetails.city}, {formData.locationDetails.country}
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'capacity':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Quelle est la capacité ?</h1>
                        <p className="text-secondary mb-6">Indique combien de toutous peuvent séjourner.</p>
                        
                        <div className="space-y-6">
                            {[
                                { key: 'dogs', label: 'Chiens', sublabel: 'Nombre maximum de chiens' },
                                { key: 'niches', label: 'Niches', sublabel: 'Espaces de couchage séparés' },
                                { key: 'beds', label: 'Couchages', sublabel: 'Paniers, coussins, etc.' },
                                { key: 'bowls', label: 'Coins gamelle', sublabel: 'Points d\'eau et nourriture' }
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-100">
                                    <div>
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-sm text-secondary">{item.sublabel}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                capacity: {
                                                    ...prev.capacity,
                                                    [item.key]: Math.max(0, prev.capacity[item.key as keyof typeof prev.capacity] - 1)
                                                }
                                            }))}
                                            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50"
                                            disabled={formData.capacity[item.key as keyof typeof formData.capacity] <= 0}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-semibold text-lg">
                                            {formData.capacity[item.key as keyof typeof formData.capacity]}
                                        </span>
                                        <button
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                capacity: {
                                                    ...prev.capacity,
                                                    [item.key]: prev.capacity[item.key as keyof typeof prev.capacity] + 1
                                                }
                                            }))}
                                            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'amenities':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Quels équipements proposes-tu ?</h1>
                        <p className="text-secondary mb-6">Sélectionne tout ce qui est disponible pour les toutous.</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {AVAILABLE_AMENITIES.map(amenity => {
                                const isSelected = formData.amenities.some(a => a.name === amenity.name);
                                return (
                                    <button
                                        key={amenity.name}
                                        onClick={() => toggleAmenity(amenity)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                            isSelected
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <AmenityIcon icon={amenity.icon} className={`w-6 h-6 mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                                        <p className="text-sm font-medium">{amenity.name}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'photos':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Ajoute des photos</h1>
                        <p className="text-secondary mb-6">Les toutous adorent voir où ils vont séjourner ! Ajoute au moins 1 photo.</p>
                        
                        {/* Input file caché */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                            {formData.images.map((img, index) => (
                                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
                                    <img src={img} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(index)}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                                    >
                                        <Trash2 className="w-4 h-4 text-white" />
                                    </button>
                                    {index === 0 && (
                                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-white rounded-full text-xs font-medium">
                                            Photo principale
                                        </span>
                                    )}
                                </div>
                            ))}
                            
                            <button
                                onClick={openFilePicker}
                                className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors"
                            >
                                <Camera className="w-8 h-8 text-gray-400" />
                                <span className="text-sm text-secondary">Ajouter</span>
                            </button>
                        </div>
                        
                        <p className="text-xs text-secondary mt-4 text-center">
                            Les annonces avec 5+ photos reçoivent plus de réservations
                        </p>
                    </div>
                );

            case 'rooms':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Where you'll sleep 🛏️</h1>
                        <p className="text-secondary mb-6">
                            Associe tes photos aux différents espaces pour que les toutous sachent où ils dormiront.
                        </p>
                        
                        {/* Liste des rooms créées */}
                        {formData.rooms.length > 0 && (
                            <div className="mb-6">
                                <p className="text-sm font-medium mb-3">Espaces créés :</p>
                                <div className="space-y-3">
                                    {formData.rooms.map((room, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                                <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">{room.name}</p>
                                                <p className="text-sm text-secondary truncate">{room.description}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        rooms: prev.rooms.filter((_, i) => i !== index)
                                                    }));
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Ajouter un nouvel espace */}
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4">
                            <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Bed className="w-4 h-4" />
                                Ajouter un espace
                            </p>
                            
                            {/* Sélectionner une photo */}
                            <div className="mb-4">
                                <p className="text-xs text-secondary mb-2">1. Choisis une photo :</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {formData.images.map((img, index) => {
                                        const isUsed = formData.rooms.some(r => r.image === img);
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => setFormData(prev => ({ ...prev, _tempRoomImage: img }))}
                                                className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                                    (formData as any)._tempRoomImage === img
                                                        ? 'border-blue-600 ring-2 ring-blue-200'
                                                        : isUsed
                                                            ? 'border-green-400'
                                                            : 'border-gray-200'
                                                }`}
                                            >
                                                <img src={img} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                                {isUsed && (
                                                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center pointer-events-none">
                                                        <Check className="w-4 h-4 text-green-600" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Type de pièce */}
                            <div className="mb-4">
                                <p className="text-xs text-secondary mb-2">2. Type d'espace :</p>
                                <div className="flex flex-wrap gap-2">
                                    {ROOM_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setFormData(prev => ({ ...prev, _tempRoomType: type.name }))}
                                            className={`px-3 py-2 rounded-full text-sm flex items-center gap-1 transition-all ${
                                                (formData as any)._tempRoomType === type.name
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        >
                                            <span>{type.icon}</span>
                                            <span>{type.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Description */}
                            <div className="mb-4">
                                <p className="text-xs text-secondary mb-2">3. Description (optionnelle) :</p>
                                <input
                                    type="text"
                                    placeholder="Ex: 1 panier premium, couverture chauffante"
                                    value={(formData as any)._tempRoomDesc || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, _tempRoomDesc: e.target.value }))}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none text-sm"
                                />
                            </div>
                            
                            {/* Bouton ajouter */}
                            <button
                                onClick={() => {
                                    const tempImage = (formData as any)._tempRoomImage;
                                    const tempType = (formData as any)._tempRoomType;
                                    const tempDesc = (formData as any)._tempRoomDesc || '';
                                    
                                    if (tempImage && tempType) {
                                        setFormData(prev => ({
                                            ...prev,
                                            rooms: [...prev.rooms, {
                                                name: tempType,
                                                description: tempDesc || `Espace ${tempType.toLowerCase()}`,
                                                image: tempImage
                                            }],
                                            _tempRoomImage: undefined,
                                            _tempRoomType: undefined,
                                            _tempRoomDesc: undefined
                                        }));
                                    }
                                }}
                                disabled={!(formData as any)._tempRoomImage || !(formData as any)._tempRoomType}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Ajouter cet espace
                            </button>
                        </div>
                        
                        <p className="text-xs text-secondary mt-4 text-center">
                            Les toutous adorent savoir où ils vont dormir !
                        </p>
                    </div>
                );

            case 'title':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Donne un titre à ta niche</h1>
                        <p className="text-secondary mb-6">Un titre court et accrocheur qui donne envie aux toutous.</p>
                        
                        <textarea
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value.slice(0, 50) }))}
                            placeholder="Ex: Luxury Niche 10min du Parc · Plaid chauffant"
                            className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-600 focus:outline-none text-lg resize-none"
                            rows={3}
                        />
                        <p className="text-right text-sm text-secondary mt-2">{formData.title.length}/50</p>
                        
                        <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
                            <p className="text-sm font-medium mb-2">Exemples de bons titres :</p>
                            <ul className="text-sm text-secondary space-y-1">
                                <li>• Luxury Niche 10min du Parc · Plaid chauffant</li>
                                <li>• Nicholoc cosy · Coloc 3 toutous max</li>
                                <li>• Beach Niche · Plage dog-friendly à 50m</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'highlights':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Points forts de ta niche</h1>
                        <p className="text-secondary mb-6">Qu'est-ce qui rend ton espace spécial ?</p>
                        
                        <div className="space-y-3">
                            {AVAILABLE_HIGHLIGHTS.map(highlight => {
                                const isSelected = formData.highlights.some(h => h.title === highlight.title);
                                return (
                                    <button
                                        key={highlight.title}
                                        onClick={() => toggleHighlight(highlight)}
                                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                                            isSelected
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            isSelected ? 'bg-blue-600' : 'bg-gray-100'
                                        }`}>
                                            <HighlightIcon icon={highlight.icon} className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{highlight.title}</p>
                                            <p className="text-sm text-secondary">{highlight.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'description':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Décris ta niche</h1>
                        <p className="text-secondary mb-6">Raconte aux toutous ce qui les attend. Minimum 50 caractères.</p>
                        
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Cette niche cosy est située dans un quartier calme, à 10 minutes du parc le plus proche..."
                            className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-600 focus:outline-none resize-none"
                            rows={8}
                        />
                        <p className={`text-right text-sm mt-2 ${formData.description.length < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                            {formData.description.length}/50 minimum
                        </p>
                    </div>
                );

            case 'price':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Fixe ton prix</h1>
                        <p className="text-secondary mb-6">Prix par nuit. Tu pourras le modifier à tout moment.</p>
                        
                        <div className="flex items-center justify-center gap-4 my-8">
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, price: Math.max(5, prev.price - 5) }))}
                                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <div className="text-center">
                                <span className="text-5xl font-bold">{formData.price}€</span>
                                <p className="text-secondary mt-1">par nuit</p>
                            </div>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, price: prev.price + 5 }))}
                                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-gray-400"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 mt-8">
                            <div>
                                <p className="font-medium mb-2">Politique d'annulation</p>
                                <div className="space-y-2">
                                    {[
                                        { id: 'flexible', label: 'Flexible', desc: 'Remboursement intégral jusqu\'à 24h avant' },
                                        { id: 'moderate', label: 'Modérée', desc: 'Remboursement 50% jusqu\'à 5 jours avant' },
                                        { id: 'strict', label: 'Stricte', desc: 'Remboursement 50% jusqu\'à 7 jours avant' }
                                    ].map(policy => (
                                        <button
                                            key={policy.id}
                                            onClick={() => setFormData(prev => ({ 
                                                ...prev, 
                                                cancellationPolicy: policy.id as typeof prev.cancellationPolicy 
                                            }))}
                                            className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                                                formData.cancellationPolicy === policy.id
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <p className="font-medium">{policy.label}</p>
                                            <p className="text-xs text-secondary">{policy.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'rules':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Règles de ta niche</h1>
                        <p className="text-secondary mb-6">Définis les règles pour les toutous qui séjournent chez toi.</p>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block font-medium mb-2">Heure max pour aboyer</label>
                                <select
                                    value={formData.rules.maxBarkHour}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        rules: { ...prev.rules, maxBarkHour: e.target.value }
                                    }))}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                                >
                                    <option value="20h00">20h00</option>
                                    <option value="21h00">21h00</option>
                                    <option value="22h00">22h00</option>
                                    <option value="23h00">23h00</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium mb-2">Âge minimum (mois)</label>
                                <input
                                    type="number"
                                    value={formData.rules.minAge}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        rules: { ...prev.rules, minAge: parseInt(e.target.value) || 0 }
                                    }))}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                                    min={0}
                                />
                            </div>

                            {[
                                { key: 'mustBeVaccinated', label: 'Vaccination obligatoire' },
                                { key: 'mustBeNeutered', label: 'Stérilisation obligatoire' },
                                { key: 'allowsPuppies', label: 'Chiots acceptés' }
                            ].map(rule => (
                                <div key={rule.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <span className="font-medium">{rule.label}</span>
                                    <button
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            rules: { 
                                                ...prev.rules, 
                                                [rule.key]: !prev.rules[rule.key as keyof typeof prev.rules] 
                                            }
                                        }))}
                                        className={`w-12 h-7 rounded-full transition-colors ${
                                            formData.rules[rule.key as keyof typeof formData.rules]
                                                ? 'bg-blue-600'
                                                : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                            formData.rules[rule.key as keyof typeof formData.rules]
                                                ? 'translate-x-6'
                                                : 'translate-x-1'
                                        }`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'availability':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Disponibilités</h1>
                        <p className="text-secondary mb-6">Ajoute les périodes où ta niche est disponible.</p>
                        
                        {/* Bouton pour ouvrir le DatePicker */}
                        <button
                            onClick={() => setIsDatePickerOpen(true)}
                            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-3 hover:border-gray-400 transition-colors mb-6"
                        >
                            <Calendar className="w-6 h-6 text-gray-400" />
                            <span className="text-secondary font-medium">Sélectionner une période</span>
                        </button>

                        {/* Afficher la sélection temporaire */}
                        {tempCheckIn && tempCheckOut && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Période sélectionnée</p>
                                        <p className="text-blue-800">
                                            {new Date(tempCheckIn).toLocaleDateString('fr-FR')} → {new Date(tempCheckOut).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={addDateRangeFromPicker}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </div>
                        )}

                        {formData.availableDateRanges.length > 0 && (
                            <div className="space-y-2">
                                <p className="font-medium mb-2">Périodes ajoutées ({formData.availableDateRanges.length})</p>
                                {formData.availableDateRanges.map((range, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                                        <span className="text-sm">
                                            {new Date(range.start).toLocaleDateString('fr-FR')} → {new Date(range.end).toLocaleDateString('fr-FR')}
                                        </span>
                                        <button
                                            onClick={() => removeDateRange(index)}
                                            className="text-red-500 p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {formData.availableDateRanges.length === 0 && !tempCheckIn && (
                            <div className="text-center py-8 text-secondary">
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Aucune période ajoutée</p>
                                <p className="text-sm">Clique sur le bouton ci-dessus pour ajouter des disponibilités</p>
                            </div>
                        )}
                    </div>
                );

            case 'instructions':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Instructions d'arrivée</h1>
                        <p className="text-secondary mb-6">
                            Ces infos seront envoyées aux voyageurs après confirmation de leur réservation.
                        </p>
                        
                        <div className="space-y-5">
                            {/* Horaires */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Arrivée</label>
                                    <select
                                        value={formData.instructions.checkInTime}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            instructions: { ...prev.instructions, checkInTime: e.target.value }
                                        }))}
                                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                                    >
                                        {['14h00', '15h00', '16h00', '17h00', '18h00', 'Flexible'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Départ</label>
                                    <select
                                        value={formData.instructions.checkOutTime}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            instructions: { ...prev.instructions, checkOutTime: e.target.value }
                                        }))}
                                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                                    >
                                        {['10h00', '11h00', '12h00', 'Flexible'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Code d'accès */}
                            <div>
                                <label className="block text-sm font-medium mb-2">🔑 Code d'accès / Digicode</label>
                                <input
                                    type="text"
                                    value={formData.instructions.accessCode}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        instructions: { ...prev.instructions, accessCode: e.target.value }
                                    }))}
                                    placeholder="Ex: 1234# ou A123B"
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                                    maxLength={50}
                                />
                            </div>

                            {/* WiFi */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">📶 Nom WiFi</label>
                                    <input
                                        type="text"
                                        value={formData.instructions.wifiName}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            instructions: { ...prev.instructions, wifiName: e.target.value }
                                        }))}
                                        placeholder="NicheWifi"
                                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                                        maxLength={50}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Mot de passe</label>
                                    <input
                                        type="text"
                                        value={formData.instructions.wifiPassword}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            instructions: { ...prev.instructions, wifiPassword: e.target.value }
                                        }))}
                                        placeholder="••••••••"
                                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                                        maxLength={50}
                                    />
                                </div>
                            </div>

                            {/* Parking */}
                            <div>
                                <label className="block text-sm font-medium mb-2">🅿️ Parking / Stationnement</label>
                                <input
                                    type="text"
                                    value={formData.instructions.parkingInfo}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        instructions: { ...prev.instructions, parkingInfo: e.target.value }
                                    }))}
                                    placeholder="Ex: Place réservée devant le portail"
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                                    maxLength={200}
                                />
                            </div>

                            {/* Notes spéciales */}
                            <div>
                                <label className="block text-sm font-medium mb-2">📝 Notes pour les voyageurs</label>
                                <textarea
                                    value={formData.instructions.specialNotes}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        instructions: { ...prev.instructions, specialNotes: e.target.value }
                                    }))}
                                    placeholder="Ex: La gamelle d'eau fraîche t'attend ! Les friandises sont dans le placard de gauche 🦴"
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none resize-none h-24"
                                    maxLength={500}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'anticat':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Option Anti-Chat</h1>
                        <p className="text-secondary mb-6">Certains toutous préfèrent une zone 100% sans félin !</p>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between py-4 border-b border-gray-100">
                                <div>
                                    <p className="font-medium">Option Anti-Chat disponible</p>
                                    <p className="text-sm text-secondary">Propose cette option aux toutous</p>
                                </div>
                                <button
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        antiCatAvailable: !prev.antiCatAvailable
                                    }))}
                                    className={`w-12 h-7 rounded-full transition-colors ${
                                        formData.antiCatAvailable ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                        formData.antiCatAvailable ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {formData.antiCatAvailable && (
                                <>
                                    <div>
                                        <label className="block font-medium mb-2">
                                            Score de risque chat ({formData.antiCatRiskScore}%)
                                        </label>
                                        <p className="text-sm text-secondary mb-3">
                                            0 = aucun chat · 100 = invasion féline
                                        </p>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.antiCatRiskScore}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                antiCatRiskScore: parseInt(e.target.value)
                                            }))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-secondary mt-1">
                                            <span>Zone sûre</span>
                                            <span>Danger chat</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-medium mb-2">Prix supplémentaire</label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    antiCatExtraPrice: Math.max(0, prev.antiCatExtraPrice - 1)
                                                }))}
                                                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="text-2xl font-bold">{formData.antiCatExtraPrice}€</span>
                                            <button
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    antiCatExtraPrice: prev.antiCatExtraPrice + 1
                                                }))}
                                                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );

            case 'review':
                return (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h1 className="text-2xl font-bold mb-2">Récapitulatif</h1>
                        <p className="text-secondary mb-6">Vérifie que tout est correct avant de publier.</p>
                        
                        <div className="space-y-4">
                            {/* Aperçu carte */}
                            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                                <div className="aspect-video bg-gray-100 relative">
                                    <img 
                                        src={formData.images[0] || '/placeholder-dog.svg'} 
                                        alt="Aperçu" 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-white rounded-lg text-xs font-medium">
                                        {LISTING_TYPES.find(t => t.id === formData.type)?.title}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold">{formData.title || 'Titre de l\'annonce'}</h3>
                                    <p className="text-sm text-secondary">{generateSubtitle()}</p>
                                    <p className="font-bold mt-2">{formData.price}€ <span className="font-normal text-secondary">/ nuit</span></p>
                                </div>
                            </div>

                            {/* Détails */}
                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-secondary">Capacité</span>
                                    <span className="font-medium">{generateCapacityString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Équipements</span>
                                    <span className="font-medium">{formData.amenities.length} sélectionnés</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Photos</span>
                                    <span className="font-medium">{formData.images.length} ajoutées</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Disponibilités</span>
                                    <span className="font-medium">{formData.availableDateRanges.length} périodes</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Anti-Chat</span>
                                    <span className="font-medium">
                                        {formData.antiCatAvailable ? `Oui (+${formData.antiCatExtraPrice}€)` : 'Non'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Annulation</span>
                                    <span className="font-medium capitalize">{formData.cancellationPolicy}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Instructions</span>
                                    <span className="font-medium">
                                        {formData.instructions.accessCode || formData.instructions.specialNotes ? '✓ Ajoutées' : 'Aucune'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const { phase, progress } = getPhaseProgress();

    return (
        <div className="fixed inset-0 bg-white flex flex-col">
            {/* Header */}
            <div 
                className="shrink-0 px-4 py-3 border-b border-gray-200 flex items-center gap-4"
                style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
            >
                <button 
                    onClick={() => setShowExitConfirm(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                    <X className="w-6 h-6" />
                </button>
                
                {!isIntroStep && (
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-secondary">Étape {phase}/3</span>
                        </div>
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            {renderContent()}

            {/* Footer */}
            <div 
                className="shrink-0 px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white"
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
            >
                {!isIntroStep && currentStepIndex > 0 ? (
                    <button 
                        onClick={goBack}
                        className="px-6 py-3 font-semibold underline"
                    >
                        Retour
                    </button>
                ) : (
                    <div />
                )}
                
                {currentStep === 'review' ? (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Publication...
                            </>
                        ) : (
                            'Publier l\'annonce'
                        )}
                    </button>
                ) : (
                    <button
                        onClick={goNext}
                        disabled={!canProceed()}
                        className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-xl disabled:opacity-50 disabled:bg-gray-300 flex items-center gap-2"
                    >
                        {isIntroStep ? 'C\'est parti !' : 'Suivant'}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* DatePicker Modal */}
            <DatePicker
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                checkIn={tempCheckIn}
                checkOut={tempCheckOut}
                onDateSelect={handleDateSelect}
            />

            {/* Modal de confirmation pour quitter */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="text-lg font-semibold mb-2">Quitter la création ?</h3>
                        <p className="text-secondary text-sm mb-6">
                            Es-tu sûr de vouloir quitter ? Toutes les informations saisies seront perdues.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="flex-1 py-3 px-4 bg-gray-100 rounded-xl font-medium"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    setShowExitConfirm(false);
                                    onBack();
                                }}
                                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium"
                            >
                                Quitter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
