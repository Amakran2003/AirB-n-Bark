import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { IOSInstallPrompt } from './IOSInstallPrompt';

/**
 * ==================== ONBOARDING ====================
 * Quotes qui défilent automatiquement
 * - Textes inspirants sur l'app
 * - Défilement auto avec transition fade
 * - Un seul bouton "Commencer"
 * - Prompt PWA install si disponible (Android)
 * - Instructions manuelles pour iOS
 */

interface OnboardingProps {
    onComplete: () => void;
}

const quotes = [
    "Des niches uniques pour votre toutou",
    "Swipez, craquez, réservez",
    "Le Airbnb des chiens",
    "Trouvez l'hébergement parfait",
    "Voyagez l'esprit tranquille",
];

export const Onboarding = ({ onComplete }: OnboardingProps) => {
    const [currentQuote, setCurrentQuote] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const [isFading, setIsFading] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);

    const { isInstallable, isIOSSafari, isInstalled, promptInstall } = usePWAInstall();

    // Auto-scroll des quotes
    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setCurrentQuote((prev) => (prev + 1) % quotes.length);
                setIsFading(false);
            }, 300);
        }, 1350);

        return () => clearInterval(interval);
    }, []);

    const proceedToTutorial = () => {
        setIsExiting(true);
        setTimeout(() => {
            onComplete();
        }, 300);
    };

    const handleStart = async () => {
        // Si déjà installé, passer directement au tutoriel
        if (isInstalled) {
            proceedToTutorial();
            return;
        }

        // Sur iOS Safari, montrer les instructions
        if (isIOSSafari) {
            setShowIOSPrompt(true);
            return;
        }

        // Sur Android/Chrome, déclencher le prompt natif
        if (isInstallable) {
            await promptInstall();
        }

        // Continuer vers le tutoriel
        proceedToTutorial();
    };

    const handleIOSPromptClose = () => {
        setShowIOSPrompt(false);
        proceedToTutorial();
    };

    return (
        <div
            className={`fixed inset-0 z-998 bg-white flex flex-col transition-opacity duration-300 overflow-hidden touch-none ${
                isExiting ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ overscrollBehavior: 'none' }}
        >
            {/* Content centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-8">
                {/* Logo */}
                <div className="w-28 h-28 flex items-center justify-center mb-8">
                    <img src="/logo-blue.svg" alt="AirbnBark" className="w-28 h-28" />
                </div>

                {/* App name */}
                <h1 className="text-3xl font-bold text-primary mb-2">AirbnBark</h1>

                {/* Quote container with fixed height */}
                <div className="h-16 flex items-center justify-center mt-6">
                    <p
                        className={`text-xl text-secondary text-center transition-opacity duration-300 ${
                            isFading ? 'opacity-0' : 'opacity-100'
                        }`}
                    >
                        {quotes[currentQuote]}
                    </p>
                </div>

                {/* Dots indicator */}
                <div className="flex gap-2 mt-8">
                    {quotes.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentQuote
                                    ? 'bg-[#3B82F6] w-6'
                                    : 'bg-gray-300'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom button */}
            <div
                className="shrink-0 px-6"
                style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
            >
                <button
                    className="btn-primary btn-full"
                    onClick={handleStart}
                >
                    Commencer
                </button>
            </div>

            {/* iOS Install Prompt */}
            <IOSInstallPrompt
                isOpen={showIOSPrompt}
                onClose={handleIOSPromptClose}
            />
        </div>
    );
};
