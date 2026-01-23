import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * ==================== HOOK USE SWIPE BACK ====================
 * Hook réutilisable pour le swipe retour (glissement vers la droite)
 * Utilisé sur les pages: ListingDetails, Messages, Payment, BookingRecap
 * 
 * @param onBack - Callback appelé quand le swipe est confirmé
 * @param threshold - Distance minimale pour confirmer le swipe (défaut: 100px)
 * @param enabled - Activer/désactiver le swipe (défaut: true)
 */

interface UseSwipeBackOptions {
    threshold?: number;
    enabled?: boolean;
}

interface UseSwipeBackReturn {
    swipeX: number;
    isExiting: boolean;
    containerStyle: React.CSSProperties;
}

export const useSwipeBack = (
    onBack?: () => void,
    options: UseSwipeBackOptions = {}
): UseSwipeBackReturn => {
    const { threshold = 100, enabled = true } = options;

    const [swipeX, setSwipeX] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const isSwipingRef = useRef(false);

    const handleBack = useCallback(() => {
        if (onBack) {
            onBack();
        }
    }, [onBack]);

    // Réinitialiser les états quand enabled change (ex: retour à la liste)
    useEffect(() => {
        if (!enabled) {
            setSwipeX(0);
            setIsExiting(false);
            touchStartRef.current = null;
            isSwipingRef.current = false;
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;

        const handleTouchStart = (e: TouchEvent) => {
            // Ne pas démarrer le swipe si on est trop loin du bord gauche
            if (e.touches[0].clientX > 50) return;
            
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            isSwipingRef.current = false;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!touchStartRef.current) return;

            const deltaX = e.touches[0].clientX - touchStartRef.current.x;
            const deltaY = e.touches[0].clientY - touchStartRef.current.y;

            // Déterminer si c'est un swipe horizontal ou vertical
            if (!isSwipingRef.current) {
                if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 20) {
                    isSwipingRef.current = true;
                } else if (Math.abs(deltaY) > 10) {
                    // C'est un scroll vertical, annuler
                    touchStartRef.current = null;
                    return;
                }
            }

            // Appliquer le swipe horizontal
            if (isSwipingRef.current && deltaX > 0) {
                setSwipeX(deltaX * 0.8); // 0.8 pour un effet de résistance
            }
        };

        const handleTouchEnd = () => {
            if (isSwipingRef.current && swipeX > threshold) {
                // Swipe confirmé - animer la sortie
                setIsExiting(true);
                setSwipeX(window.innerWidth);
                setTimeout(() => {
                    handleBack();
                }, 250);
            } else {
                // Swipe annulé - retour à la position initiale
                setSwipeX(0);
            }
            touchStartRef.current = null;
            isSwipingRef.current = false;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, swipeX, threshold, handleBack]);

    // Style à appliquer au conteneur
    const containerStyle: React.CSSProperties = {
        transform: swipeX > 0 ? `translateX(${swipeX}px)` : undefined,
        transition: isExiting || swipeX === 0 ? 'transform 0.25s ease-out' : 'none',
    };

    return {
        swipeX,
        isExiting,
        containerStyle,
    };
};
