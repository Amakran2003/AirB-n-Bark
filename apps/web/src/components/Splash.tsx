import { useEffect, useState } from 'react';

/**
 * ==================== SPLASH SCREEN ====================
 * Animation de démarrage de l'application
 * - Logo animé avec bounce
 * - Texte qui apparaît progressivement
 * - Transition fade-out vers l'onboarding
 */

interface SplashProps {
    onComplete: () => void;
}

export const Splash = ({ onComplete }: SplashProps) => {
    const [phase, setPhase] = useState<'logo' | 'text' | 'fadeOut'>('logo');

    useEffect(() => {
        // Phase 1: Logo bounce (0-800ms)
        const textTimer = setTimeout(() => {
            setPhase('text');
        }, 800);

        // Phase 2: Text appears (800-2000ms)
        const fadeTimer = setTimeout(() => {
            setPhase('fadeOut');
        }, 2000);

        // Phase 3: Fade out and complete (2000-2500ms)
        const completeTimer = setTimeout(() => {
            // Changer le background en blanc AVANT de quitter le splash
            document.body.style.backgroundColor = '#ffffff';
            onComplete();
        }, 2500);

        return () => {
            clearTimeout(textTimer);
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div
            className={`fixed inset-0 z-999 bg-brand flex flex-col items-center justify-center transition-opacity duration-500 ${
                phase === 'fadeOut' ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
                paddingBottom: 'env(safe-area-inset-bottom)',
                paddingTop: 'env(safe-area-inset-top)',
            }}
        >
            {/* Logo animé */}
            <div
                className={`transition-all duration-700 ease-out ${
                    phase === 'logo' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                }`}
                style={{
                    animation:
                        phase !== 'logo'
                            ? 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                            : undefined,
                }}
            >
                <div className="w-24 h-24 flex items-center justify-center">
                    <img src="/logo-white.svg" alt="AirbnBark" className="w-24 h-24" />
                </div>
            </div>

            {/* Titre */}
            <h1
                className={`mt-8 text-4xl font-bold text-white transition-all duration-500 ${
                    phase === 'text' || phase === 'fadeOut'
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4'
                }`}
            >
                AirbnBark
            </h1>

            {/* Sous-titre */}
            <p
                className={`mt-2 text-white/80 text-lg transition-all duration-500 delay-200 ${
                    phase === 'text' || phase === 'fadeOut'
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4'
                }`}
            >
                Des niches pour toutous
            </p>

            {/* Loader dots */}
            <div className="mt-12 flex gap-2">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2 h-2 bg-white/60 rounded-full"
                        style={{
                            animation: 'pulse 1s ease-in-out infinite',
                            animationDelay: `${i * 0.2}s`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes bounceIn {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.1); }
                    70% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
};
