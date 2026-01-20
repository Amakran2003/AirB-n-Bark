import { useState, useCallback } from 'react';
import { Bot, ChevronUp } from 'lucide-react';
import { BottomNavbar } from '../components/BottomNavbar';
import { SwipeCard } from '../components/SwipeCard';
import { BookingRecap } from '../components/BookingRecap';
import { ListingDetails } from './ListingDetails';
import { MOCK_LISTINGS, getListingById, ListingCardData } from '../data/listings';

/**
 * ==================== PAGE HOME ====================
 * Page principale avec cartes swipables style Tinder
 * - Header avec bouton Filtre et icône Bot
 * - Pile de cartes swipables pour parcourir les annonces
 * - Swipe gauche = passer, Swipe droite = réservation (ouvre récap)
 * - Swipe haut / clic = ouvrir la page description
 * - Bottom navigation
 */

export const Home = () => {
    // Onglet actif de la navbar
    const [activeTab, setActiveTab] = useState<
        'home' | 'messages' | 'profile'
    >('home');

    // Index de la carte actuelle (celle du dessus)
    const [currentIndex, setCurrentIndex] = useState(0);

    // Annonce sélectionnée pour afficher les détails
    const [selectedListing, setSelectedListing] = useState<string | null>(null);

    // Annonce sélectionnée pour le récap de réservation
    const [bookingListing, setBookingListing] = useState<ListingCardData | null>(null);

    // Animation d'ouverture de la page détails
    const [isDetailTransitioning, setIsDetailTransitioning] = useState(false);

    /**
     * Gestion du swipe gauche (passer)
     */
    const handleSwipeLeft = useCallback(() => {
        console.log('Passé:', MOCK_LISTINGS[currentIndex]?.title);
        setCurrentIndex((prev) => prev + 1);
    }, [currentIndex]);

    /**
     * Gestion du swipe droite (réservation)
     * Ouvre le récap de réservation
     */
    const handleSwipeRight = useCallback(() => {
        const listing = MOCK_LISTINGS[currentIndex];
        if (listing) {
            console.log('Réservation:', listing.title);
            setBookingListing(listing);
        }
    }, [currentIndex]);

    /**
     * Gestion du retour (undo)
     */
    const handleUndo = useCallback(() => {
        if (currentIndex > 0) {
            const prevListing = MOCK_LISTINGS[currentIndex - 1];
            console.log('Retour:', prevListing?.title);
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex]);

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
     * Fermer le récap et passer à la carte suivante
     */
    const handleCloseBooking = useCallback(() => {
        setBookingListing(null);
    }, []);

    /**
     * Confirmer la réservation (après auth)
     */
    const handleConfirmBooking = useCallback(() => {
        console.log('Réservation confirmée:', bookingListing?.title);
        setBookingListing(null);
        setCurrentIndex((prev) => prev + 1);
    }, [bookingListing]);

    // Cartes restantes à afficher
    const remainingCards = MOCK_LISTINGS.slice(currentIndex);

    // Récupérer les données complètes de l'annonce sélectionnée
    const selectedListingData = selectedListing
        ? getListingById(selectedListing)
        : null;

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
                    {/* Bouton Filtre - utilise btn-secondary existant */}
                    <button className="btn-secondary">Filtre</button>

                    {/* Icône Bot - sans bordure, taille augmentée */}
                    <button className="btn-icon">
                        <Bot className="w-8 h-8 text-black" strokeWidth={1.5} />
                    </button>
                </header>
            )}

            {/* ==================== ZONE DE SWIPE ==================== */}
            <div className={`swipe-container ${isDetailTransitioning ? 'swipe-transitioning' : ''}`}>
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
                        <button
                            className="btn-primary mt-6"
                            onClick={() => setCurrentIndex(0)}
                        >
                            Recommencer
                        </button>
                    </div>
                )}
            </div>

            {/* ==================== GLISSER POUR VOIR ==================== */}
            {remainingCards.length > 0 && !isDetailTransitioning && (
                <div className="swipe-up-hint">
                    <ChevronUp className="w-5 h-5" />
                    <span>Glisser pour voir</span>
                </div>
            )}

            {/* ==================== BOTTOM NAVBAR ==================== */}
            {/* Cacher la navbar pendant la transition */}
            {!isDetailTransitioning && (
                <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />
            )}
        </div>
    );
};
