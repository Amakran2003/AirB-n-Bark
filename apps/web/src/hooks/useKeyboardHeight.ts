import { useState, useEffect, useRef } from 'react';

/**
 * ==================== HOOK USE KEYBOARD HEIGHT ====================
 * Hook réutilisable pour gérer le clavier mobile (iOS/Android)
 * Utilisé sur: Messages, ChatBot, et autres pages avec input
 *
 * @param enabled - Activer/désactiver la détection (défaut: true)
 * @returns { keyboardHeight, isKeyboardOpen, viewportHeight }
 */

interface UseKeyboardHeightOptions {
    enabled?: boolean;
}

interface UseKeyboardHeightReturn {
    keyboardHeight: number;
    isKeyboardOpen: boolean;
    viewportHeight: number;
}

export const useKeyboardHeight = (
    options: UseKeyboardHeightOptions = {}
): UseKeyboardHeightReturn => {
    const { enabled = true } = options;

    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(
        typeof window !== 'undefined' ? window.visualViewport?.height || window.innerHeight : 0
    );
    const initialHeightRef = useRef<number>(typeof window !== 'undefined' ? window.innerHeight : 0);

    useEffect(() => {
        if (!enabled) {
            setKeyboardHeight(0);
            setIsKeyboardOpen(false);
            return;
        }

        // Stocker la hauteur initiale au mount
        initialHeightRef.current = window.innerHeight;

        const handleResize = () => {
            if (window.visualViewport) {
                const vh = window.visualViewport.height;
                const keyboard = initialHeightRef.current - vh;

                setViewportHeight(vh);
                setKeyboardHeight(keyboard > 50 ? keyboard : 0); // 50px minimum pour considérer que c'est un clavier
                setIsKeyboardOpen(keyboard > 100); // 100px pour être sûr
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
            handleResize(); // Appel initial
        }

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
        };
    }, [enabled]);

    return {
        keyboardHeight,
        isKeyboardOpen,
        viewportHeight,
    };
};
