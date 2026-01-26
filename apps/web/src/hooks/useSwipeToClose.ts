import { useState, useRef, useCallback } from 'react';

/**
 * ==================== USE SWIPE TO CLOSE ====================
 * Hook réutilisable pour fermer une modal en swipant vers le bas
 *
 * @param onClose - Callback appelé quand l'utilisateur swipe assez loin
 * @param options - Options de configuration
 * @returns swipeY, handlers, isClosing
 *
 * Usage:
 * const { swipeY, handlers, isClosing } = useSwipeToClose(onClose);
 * <div {...handlers} style={{ transform: `translateY(${swipeY}px)` }}>
 */

interface UseSwipeToCloseOptions {
    /** Seuil en pixels pour déclencher la fermeture (default: 100) */
    threshold?: number;
    /** Activer/désactiver le swipe (default: true) */
    enabled?: boolean;
}

interface UseSwipeToCloseReturn {
    /** Position Y actuelle du swipe */
    swipeY: number;
    /** Si la modal est en train de se fermer */
    isClosing: boolean;
    /** Handlers à spreader sur l'élément swipeable */
    handlers: {
        onTouchStart: (e: React.TouchEvent) => void;
        onTouchMove: (e: React.TouchEvent) => void;
        onTouchEnd: () => void;
    };
    /** Reset le swipe (utile si la modal reste ouverte) */
    reset: () => void;
}

export const useSwipeToClose = (
    onClose: () => void,
    options: UseSwipeToCloseOptions = {}
): UseSwipeToCloseReturn => {
    const { threshold = 100, enabled = true } = options;

    const [swipeY, setSwipeY] = useState(0);
    const [isClosing, setIsClosing] = useState(false);
    const touchStartRef = useRef<number | null>(null);

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (!enabled) return;
            touchStartRef.current = e.touches[0].clientY;
        },
        [enabled]
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!enabled || touchStartRef.current === null) return;
            const deltaY = e.touches[0].clientY - touchStartRef.current;
            // Seulement vers le bas
            if (deltaY > 0) {
                setSwipeY(deltaY);
            }
        },
        [enabled]
    );

    const handleTouchEnd = useCallback(() => {
        if (!enabled) return;

        if (swipeY > threshold) {
            setIsClosing(true);
            onClose();
        }
        setSwipeY(0);
        touchStartRef.current = null;
    }, [enabled, swipeY, threshold, onClose]);

    const reset = useCallback(() => {
        setSwipeY(0);
        setIsClosing(false);
        touchStartRef.current = null;
    }, []);

    return {
        swipeY,
        isClosing,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
        reset,
    };
};
