import { useState, useCallback, useEffect } from 'react';
import { Bot, SlidersHorizontal } from 'lucide-react';
import { BottomNavbar } from '../components/BottomNavbar';
import { SwipeCard } from '../components/SwipeCard';
import { BookingRecap } from '../components/BookingRecap';
import { ChatBot } from '../components/ChatBot';
import { ListingDetails } from './ListingDetails';
import { getListingById, ListingCardData, ListingFullData } from '../data/listings';
import { useFilters } from '../contexts/FilterContext';
import { api } from '../services/api';
import type { TutorialStepId } from '../components/TutorialOverlay';

// Toggle API
const USE_API = import.meta.env.VITE_USE_API === 'true';

/**
 * ==================== PAGE HOME ====================
 * Page principale avec cartes swipables style Tinder
 * - Header avec bouton Filtre et icone Bot
 * - Pile de cartes swipables pour parcourir les annonces
 * - Swipe gauche = passer, Swipe droite = reservation (ouvre recap)
 * - Swipe haut / clic = ouvrir la page description
 * - Bottom navigation
 *
 * TODO API:
 * - GET /api/listings → recuperer les annonces (avec pagination)
 * - GET /api/listings?filters=... → filtrage cote serveur
 * - POST /api/listings/:id/skip → enregistrer un swipe gauche (analytics)
 */

interface HomeProps {
    tutorialStep?: TutorialStepId | null;
    onTabChange?: (tab: 'home' | 'trips' | 'messages' | 'profile') => void;
}

export const Home = ({ tutorialStep, onTabChange }: HomeProps) => {
    // Filtres et listings filtrés
    const { openFilterModal, activeFiltersCount, filteredListings } = useFilters();

    // Index de la carte actuelle (celle du dessus)
    const [currentIndex, setCurrentIndex] = useState(0);

    // Annonce sélectionnée pour afficher les détails
    const [selectedListing, setSelectedListing] = useState<string | null>(null);

    // Annonce sélectionnée pour le récap de réservation
    const [bookingListing, setBookingListing] = useState<ListingCardData | null>(null);

    // Animation d'ouverture de la page détails
    const [isDetailTransitioning, setIsDetailTransitioning] = useState(false);

    // ChatBot ouvert
    const [isChatBotOpen, setIsChatBotOpen] = useState(false);

    // Données complètes du listing sélectionné (chargées via API)
    const [selectedListingData, setSelectedListingData] = useState<ListingFullData | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    /**
     * Gestion du swipe gauche (passer)
     */
    const handleSwipeLeft = useCallback(() => {
        console.log('Passé:', filteredListings[currentIndex]?.title);
        setCurrentIndex((prev) => prev + 1);
    }, [currentIndex, filteredListings]);

    /**
     * Gestion du swipe droite (réservation)
     * Ouvre le récap de réservation
     */
    const handleSwipeRight = useCallback(() => {
        const listing = filteredListings[currentIndex];
        if (listing) {
            console.log('Réservation:', listing.title);
            setBookingListing(listing);
        }
    }, [currentIndex, filteredListings]);

    /**
     * Gestion du retour (undo)
     */
    const handleUndo = useCallback(() => {
        if (currentIndex > 0) {
            const prevListing = filteredListings[currentIndex - 1];
            console.log('Retour:', prevListing?.title);
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex, filteredListings]);

    /**
     * Gestion du swipe haut / clic (ouvrir détails)
     */
    const handleSwipeUp = useCallback((listing: ListingCardData) => {
        console.log('Ouvrir détails:', listing.title);
        setIsDetailTransitioning(true);
        // Petit délai pour l'animation
        setTimeout(() => {
            setSelectedListing(listing.id);
        }, 300);
    }, []);

    /**
     * Fermer la page détails
     */
    const handleCloseDetails = useCallback(() => {
        setIsDetailTransitioning(false);
        setSelectedListing(null);
        // Reset scroll position
        window.scrollTo(0, 0);
    }, []);

    /**
     * Confirmer la réservation (après auth)
     */
    const handleConfirmBooking = useCallback(() => {
        console.log('Réservation confirmée:', bookingListing?.title);
        setBookingListing(null);
        setCurrentIndex((prev) => prev + 1);
    }, [bookingListing]);

    // Reset index quand les filtres changent
    useEffect(() => {
        setCurrentIndex(0);
    }, [filteredListings]);

    // Cartes restantes à afficher
    const remainingCards = (filteredListings || []).slice(currentIndex);

    // Charger les détails du listing quand sélectionné
    useEffect(() => {
        if (!selectedListing) {
            setSelectedListingData(null);
            return;
        }

        const loadDetails = async () => {
            if (USE_API) {
                setIsLoadingDetails(true);
                const response = await api.listings.getById(selectedListing);
                if (response.success && response.data) {
                    // Mapper la réponse API vers le format frontend
                    setSelectedListingData(response.data as unknown as ListingFullData);
                }
                setIsLoadingDetails(false);
            } else {
                // Fallback mock data
                setSelectedListingData(getListingById(selectedListing));
            }
        };
        loadDetails();
    }, [selectedListing]);

    // Chargement des détails
    if (selectedListing && isLoadingDetails) {
        return (
            <div className="h-screen flex items-center justify-center bg-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
            </div>
        );
    }

    // Si le récap de réservation est ouvert
    if (bookingListing) {
        return (
            <BookingRecap
                listing={bookingListing}
                onBack={() => {
                    // Fermer le récap - si on venait de ListingDetails, on y retourne
                    setBookingListing(null);
                }}
                onConfirm={handleConfirmBooking}
                onGoToTrips={() => onTabChange?.('trips')}
            />
        );
    }

    // Si une annonce est sélectionnée, afficher la page détails
    if (selectedListingData) {
        return (
            <ListingDetails
                listing={selectedListingData}
                onBack={handleCloseDetails}
                onReserve={() => {
                    // Ouvrir le récap SANS fermer les détails
                    // Quand on ferme le récap, on reviendra sur ListingDetails
                    const listingForBooking = {
                        id: selectedListingData.id,
                        type: selectedListingData.type,
                        title: selectedListingData.title,
                        subtitle: selectedListingData.subtitle,
                        location: selectedListingData.location,
                        image: selectedListingData.image,
                        price: selectedListingData.price,
                        rating: selectedListingData.rating,
                        hostName: selectedListingData.hostName,
                        hostAvatar: selectedListingData.hostAvatar,
                        antiCat: selectedListingData.antiCat,
                        maxDogs: selectedListingData.maxDogs,
                        availableDateRanges: selectedListingData.availableDateRanges,
                    };
                    // On garde selectedListing pour pouvoir revenir à ListingDetails
                    setBookingListing(listingForBooking);
                }}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col bg-primary">
            {/* ==================== HEADER ==================== */}
            {/* Cacher le header pendant la transition */}
            {!isDetailTransitioning && (
                <header className="header-home">
                    {/* Bouton Filtre */}
                    <button className="btn-secondary" onClick={openFilterModal}>
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtre
                        {activeFiltersCount > 0 && (
                            <span className="w-5 h-5 flex items-center justify-center bg-(--color-text-primary) text-white text-xs rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Icône Bot - sans bordure, taille augmentée */}
                    <button className="btn-icon" onClick={() => setIsChatBotOpen(true)} aria-label="Ouvrir l'assistant">
                        <Bot className="w-8 h-8 text-black" strokeWidth={1.5} />
                    </button>
                </header>
            )}

            {/* ==================== ZONE DE SWIPE ==================== */}
            <div
                className={`swipe-container ${isDetailTransitioning ? 'swipe-transitioning' : ''}`}
            >
                {remainingCards.length > 0 ? (
                    // Afficher les 2 premières cartes (pour l'effet de pile)
                    remainingCards
                        .slice(0, 2)
                        .reverse()
                        .map((listing, index) => (
                            <SwipeCard
                                key={listing.id}
                                listing={listing}
                                isTop={index === remainingCards.slice(0, 2).length - 1}
                                onSwipeLeft={handleSwipeLeft}
                                onSwipeRight={handleSwipeRight}
                                onSwipeUp={() => handleSwipeUp(listing)}
                                onUndo={handleUndo}
                                canUndo={currentIndex > 0}
                                tutorialStep={index === remainingCards.slice(0, 2).length - 1 ? tutorialStep : null}
                            />
                        ))
                ) : (
                    // Plus de cartes disponibles
                    <div className="swipe-empty">
                        <div className="swipe-empty-icon">🐕</div>
                        <h3 className="text-h2">Plus d'annonces !</h3>
                        <p className="text-body text-secondary mt-2">
                            Tu as parcouru toutes les annonces disponibles.
                        </p>
                        <button className="btn-primary mt-6" onClick={() => setCurrentIndex(0)}>
                            Recommencer
                        </button>
                    </div>
                )}
            </div>

            {/* ==================== BOTTOM NAVBAR ==================== */}
            {/* Cacher la navbar pendant la transition */}
            {!isDetailTransitioning && (
                <BottomNavbar activeTab="home" onTabChange={onTabChange} />
            )}

            {/* ==================== CHATBOT ==================== */}
            <ChatBot isOpen={isChatBotOpen} onClose={() => setIsChatBotOpen(false)} />
        </div>
    );
};
