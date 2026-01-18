import { useState, useRef } from 'react';
import { Heart, X, Star, MapPin, ChevronUp, RotateCcw } from 'lucide-react';
import { ListingCardData } from '../data/listings';

/**
 * ==================== PROPS DU COMPOSANT ====================
 */
interface SwipeCardProps {
    listing: ListingCardData;
    onSwipeLeft: () => void; // Pas intéressé
    onSwipeRight: () => void; // Favori
    onSwipeUp: () => void; // Ouvrir détails
    onUndo?: () => void; // Retour à la carte précédente
    isTop: boolean; // Est-ce la carte du dessus (interactive)
    canUndo?: boolean; // Peut-on revenir en arrière
}

/**
 * ==================== COMPOSANT SWIPE CARD ====================
 * Carte swipable style Tinder pour parcourir les annonces
 * - Swipe gauche = passer
 * - Swipe droite = ajouter aux favoris
 * - Swipe haut / clic = ouvrir la page détails
 * - Geste tactile et souris supportés
 */
export const SwipeCard = ({
    listing,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onUndo,
    isTop,
    canUndo = false,
}: SwipeCardProps) => {
    // Position actuelle de la carte pendant le drag
    const [position, setPosition] = useState({ x: 0, y: 0 });
    // Rotation basée sur la position X
    const [rotation, setRotation] = useState(0);
    // Scale de la carte (pour l'effet d'agrandissement)
    const [scale, setScale] = useState(1);
    // Est-ce qu'on est en train de drag
    const [isDragging, setIsDragging] = useState(false);
    // Indicateur de direction (like/nope/up)
    const [swipeDirection, setSwipeDirection] = useState<
        'left' | 'right' | 'up' | null
    >(null);
    // Est-ce qu'on est en train de swipe vers le haut (pour cacher les boutons)
    const [isSwipingUp, setIsSwipingUp] = useState(false);

    // Références pour le calcul du drag
    const startPos = useRef({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    // Seuils de swipe (en pixels) pour déclencher l'action
    const SWIPE_THRESHOLD_X = 100;
    const SWIPE_THRESHOLD_Y = -80; // Négatif car vers le haut

    /**
     * Début du drag (tactile ou souris)
     */
    const handleDragStart = (clientX: number, clientY: number) => {
        if (!isTop) return;
        setIsDragging(true);
        startPos.current = { x: clientX, y: clientY };
    };

    /**
     * Pendant le drag - mise à jour de la position
     */
    const handleDragMove = (clientX: number, clientY: number) => {
        if (!isDragging || !isTop) return;

        const deltaX = clientX - startPos.current.x;
        const deltaY = clientY - startPos.current.y;

        // Mise à jour position et rotation
        setPosition({ x: deltaX, y: deltaY });
        
        // Si on swipe vers le haut, pas de rotation mais un scale
        if (deltaY < -30) {
            setRotation(0);
            // Scale progressif (max 1.15)
            const scaleValue = Math.min(1.15, 1 + Math.abs(deltaY) / 500);
            setScale(scaleValue);
            setSwipeDirection('up');
        } else {
            setScale(1);
            setRotation(deltaX * 0.1); // Rotation proportionnelle au déplacement
            
            // Mise à jour de l'indicateur de direction
            if (deltaX > 50) {
                setSwipeDirection('right');
            } else if (deltaX < -50) {
                setSwipeDirection('left');
            } else {
                setSwipeDirection(null);
            }
        }
    };

    /**
     * Fin du drag - décision de swipe ou retour
     */
    const handleDragEnd = () => {
        if (!isDragging || !isTop) return;
        setIsDragging(false);

        // Si swipe vers le haut - Ouvrir détails
        if (position.y < SWIPE_THRESHOLD_Y) {
            animateSwipeUp();
            return;
        }

        // Si on dépasse le seuil horizontal, on swipe
        if (position.x > SWIPE_THRESHOLD_X) {
            // Swipe droite - Favori
            animateSwipe('right');
        } else if (position.x < -SWIPE_THRESHOLD_X) {
            // Swipe gauche - Passer
            animateSwipe('left');
        } else {
            // Retour à la position initiale
            setPosition({ x: 0, y: 0 });
            setRotation(0);
            setScale(1);
            setSwipeDirection(null);
        }
    };

    /**
     * Animation de sortie horizontale et callback
     */
    const animateSwipe = (direction: 'left' | 'right') => {
        const exitX = direction === 'right' ? 500 : -500;
        setPosition({ x: exitX, y: position.y });
        setRotation(direction === 'right' ? 30 : -30);

        // Attendre la fin de l'animation puis callback
        setTimeout(() => {
            if (direction === 'right') {
                onSwipeRight();
            } else {
                onSwipeLeft();
            }
        }, 300);
    };

    /**
     * Animation de swipe vers le haut (centre puis fullscreen)
     */
    const animateSwipeUp = () => {
        setIsSwipingUp(true);
        // D'abord centrer la carte
        setPosition({ x: 0, y: 0 });
        setRotation(0);
        setScale(1.05);
        
        // Puis zoom fullscreen
        setTimeout(() => {
            setScale(1.5);
            setPosition({ x: 0, y: 0 });
        }, 150);
        
        // Callback après l'animation
        setTimeout(() => {
            onSwipeUp();
        }, 300);
    };

    /**
     * Boutons de swipe rapide
     */
    const handleQuickSwipe = (direction: 'left' | 'right') => {
        setSwipeDirection(direction);
        animateSwipe(direction);
    };

    /**
     * Clic sur la carte = ouvrir détails
     */
    const handleCardClick = () => {
        if (!isTop) return;
        // Ne pas déclencher si on a bougé la carte
        if (Math.abs(position.x) > 5 || Math.abs(position.y) > 5) return;
        animateSwipeUp();
    };

    // Événements souris
    const handleMouseDown = (e: React.MouseEvent) => {
        handleDragStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        handleDragEnd();
    };

    const handleMouseLeave = () => {
        if (isDragging) handleDragEnd();
    };

    // Événements tactiles
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    return (
        <div
            ref={cardRef}
            className="swipe-card"
            style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                zIndex: isSwipingUp || swipeDirection === 'up' ? 200 : (isTop ? 10 : 1),
                cursor: isTop ? 'grab' : 'default',
            }}
            onClick={handleCardClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* ==================== IMAGE DE FOND ==================== */}
            <div
                className="swipe-card-image"
                style={{ backgroundImage: `url(${listing.image})` }}
            >
                {/* Overlay gradient pour le texte */}
                <div className="swipe-card-overlay" />

                {/* ==================== INDICATEURS DE SWIPE ==================== */}
                {/* Badge LIKE (swipe droite) */}
                <div
                    className="swipe-indicator swipe-indicator-like"
                    style={{
                        opacity: swipeDirection === 'right' ? 1 : 0,
                    }}
                >
                    <Heart className="w-8 h-8" fill="currentColor" />
                    <span>LIKE</span>
                </div>

                {/* Badge NOPE (swipe gauche) */}
                <div
                    className="swipe-indicator swipe-indicator-nope"
                    style={{
                        opacity: swipeDirection === 'left' ? 1 : 0,
                    }}
                >
                    <X className="w-8 h-8" />
                    <span>NOPE</span>
                </div>

                {/* Badge VOIR (swipe haut) */}
                <div
                    className="swipe-indicator swipe-indicator-up"
                    style={{
                        opacity: swipeDirection === 'up' ? 1 : 0,
                    }}
                >
                    <ChevronUp className="w-8 h-8" />
                    <span>VOIR</span>
                </div>

                {/* ==================== INFOS DE L'ANNONCE ==================== */}
                <div className="swipe-card-content">
                    {/* Note et étoile */}
                    <div className="swipe-card-rating">
                        <Star
                            className="w-4 h-4 text-black"
                            fill="currentColor"
                        />
                        <span>{listing.rating.toFixed(1)}</span>
                    </div>

                    {/* Titre */}
                    <h2 className="swipe-card-title">{listing.title}</h2>

                    {/* Localisation */}
                    <div className="swipe-card-location">
                        <MapPin className="w-4 h-4" />
                        <span>{listing.location}</span>
                    </div>

                    {/* Prix et Host */}
                    <div className="swipe-card-footer">
                        <div className="swipe-card-price">
                            <span className="font-semibold">
                                {listing.price}€
                            </span>
                            <span className="text-white/70"> / nuit</span>
                        </div>

                        {/* Avatar du host */}
                        <div className="swipe-card-host">
                            <img
                                src={listing.hostAvatar}
                                alt={listing.hostName}
                                className="w-10 h-10 rounded-full border-2 border-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== BOUTONS D'ACTION ==================== */}
            {/* Cacher les boutons pendant le swipe vers le haut */}
            {isTop && !isSwipingUp && swipeDirection !== 'up' && (
                <div className="swipe-card-actions" onClick={(e) => e.stopPropagation()}>
                    {/* Bouton Retour - toujours visible mais désactivé si pas possible */}
                    <button
                        className={`swipe-btn swipe-btn-undo ${!canUndo ? 'opacity-30' : ''}`}
                        disabled={!canUndo}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (canUndo && onUndo) onUndo();
                        }}
                    >
                        <RotateCcw className="w-6 h-6" strokeWidth={2.5} />
                    </button>

                    {/* Bouton Passer (X) */}
                    <button
                        className="swipe-btn swipe-btn-nope"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleQuickSwipe('left');
                        }}
                    >
                        <X className="w-8 h-8" strokeWidth={2.5} />
                    </button>

                    {/* Bouton Favori (Coeur) */}
                    <button
                        className="swipe-btn swipe-btn-like"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleQuickSwipe('right');
                        }}
                    >
                        <Heart className="w-8 h-8" strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </div>
    );
};
