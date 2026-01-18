import { useState, useCallback } from 'react';
import { Bot, ChevronUp } from 'lucide-react';
import { BottomNavbar } from '../components/BottomNavbar';
import { SwipeCard } from '../components/SwipeCard';
import { ListingDetails } from './ListingDetails';
import { MOCK_LISTINGS, getListingById, ListingCardData } from '../data/listings';

/**
 * ==================== PAGE HOME ====================
 * Page principale avec cartes swipables style Tinder
 * - Header avec bouton Filtre et icône Bot
 * - Pile de cartes swipables pour parcourir les annonces
 * - Swipe gauche = passer, Swipe droite = favori
 * - Swipe haut / clic = ouvrir la page description
 * - Bottom navigation
 */

export const Home = () => {
    // Onglet actif de la navbar
    const [activeTab, setActiveTab] = useState<
        'home' | 'messages' | 'favorites' | 'profile'
    >('home');

    // Index de la carte actuelle (celle du dessus)
    const [currentIndex, setCurrentIndex] = useState(0);

    // Liste des favoris (swipe droite)
    const [favorites, setFavorites] = useState<string[]>([]);

    // Annonce sélectionnée pour afficher les détails
    const [selectedListing, setSelectedListing] = useState<string | null>(null);

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
     * Gestion du swipe droite (favori)
     */
    const handleSwipeRight = useCallback(() => {
        const listing = MOCK_LISTINGS[currentIndex];
        if (listing) {
            console.log('Favori:', listing.title);
            setFavorites((prev) => [...prev, listing.id]);
        }
        setCurrentIndex((prev) => prev + 1);
    }, [currentIndex]);

    /**
     * Gestion du retour (undo)
     */
    const handleUndo = useCallback(() => {
        if (currentIndex > 0) {
            const prevListing = MOCK_LISTINGS[currentIndex - 1];
            console.log('Retour:', prevListing?.title);
            // Retirer des favoris si c'était un favori
            if (prevListing) {
                setFavorites((prev) => prev.filter((id) => id !== prevListing.id));
            }
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
    }, []);

    // Cartes restantes à afficher
    const remainingCards = MOCK_LISTINGS.slice(currentIndex);

    // Récupérer les données complètes de l'annonce sélectionnée
    const selectedListingData = selectedListing
        ? getListingById(selectedListing)
        : null;

    // Si une annonce est sélectionnée, afficher la page détails
    if (selectedListingData) {
        return (
            <ListingDetails
                listing={selectedListingData}
                onBack={handleCloseDetails}
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
