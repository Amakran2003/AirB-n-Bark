import { useState, useEffect } from 'react';

/**
 * ==================== USE PWA INSTALL ====================
 * Hook pour gérer l'installation PWA
 * - Capture le beforeinstallprompt event
 * - Permet de déclencher le prompt d'installation natif
 * - Détecte si l'app est déjà installée
 * - Détecte iOS pour afficher les instructions manuelles
 */

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Détecter iOS
const isIOS = (): boolean => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
};

// Détecter si on est sur Safari
const isSafari = (): boolean => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/crios/.test(userAgent);
};

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOSDevice] = useState(() => isIOS());
    const [isIOSSafari] = useState(() => isIOS() && isSafari());

    useEffect(() => {
        // Vérifier si l'app est déjà installée (standalone mode)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Capturer l'événement beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        // Détecter quand l'app est installée
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            setIsInstallable(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    /**
     * Déclencher le prompt d'installation natif
     * Retourne true si l'utilisateur a accepté, false sinon
     */
    const promptInstall = async (): Promise<boolean> => {
        if (!deferredPrompt) {
            return false;
        }

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            // Reset le prompt après utilisation
            setDeferredPrompt(null);

            if (outcome === 'accepted') {
                setIsInstalled(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Erreur lors du prompt d'installation:", error);
            return false;
        }
    };

    return {
        isInstallable,
        isInstalled,
        isIOSDevice,
        isIOSSafari,
        promptInstall,
    };
};
