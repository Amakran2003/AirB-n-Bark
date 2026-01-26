import { useState, useEffect } from 'react';
import { ChevronRight, X, ArrowRight, ArrowLeft, ArrowUp } from 'lucide-react';

/**
 * ==================== TUTORIAL OVERLAY ====================
 * Overlay tutoriel léger sur la page d'accueil
 * - Pas de backdrop opaque, on voit la vraie page
 * - Textes et flèches explicatifs
 * - Home anime la vraie carte selon l'étape
 */

interface TutorialOverlayProps {
    onComplete: () => void;
    onStepChange?: (step: number) => void;
}

export type TutorialStepId = 'swipe-right' | 'swipe-left' | 'swipe-up' | 'filter' | 'chat';

interface TutorialStep {
    id: TutorialStepId;
    title: string;
    description: string;
}

const tutorialSteps: TutorialStep[] = [
    {
        id: 'swipe-right',
        title: 'Swipe à droite avec ta patte 🐾',
        description: 'Cette niche te plaît ? Réserve direct !',
    },
    {
        id: 'swipe-left',
        title: 'Swipe à gauche, beurk !',
        description: 'Pas ton style ? Au suivant !',
    },
    {
        id: 'swipe-up',
        title: 'Glisse vers le haut ou clique',
        description: 'Envie de renifler les détails ?',
    },
    {
        id: 'filter',
        title: 'Filtre tes recherches',
        description: 'Dates, prix, type de niche... fais le difficile !',
    },
    {
        id: 'chat',
        title: "Besoin d'un coup de patte ?",
        description: 'Notre assistant IA parle couramment le wouf',
    },
];

// Export pour que Home puisse connaître l'étape
export const getTutorialStepId = (stepIndex: number): TutorialStepId | null => {
    if (stepIndex >= 0 && stepIndex < tutorialSteps.length) {
        return tutorialSteps[stepIndex].id;
    }
    return null;
};

export const TutorialOverlay = ({ onComplete, onStepChange }: TutorialOverlayProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    const step = tutorialSteps[currentStep];
    const isLastStep = currentStep === tutorialSteps.length - 1;

    // Notifier Home du changement d'étape
    useEffect(() => {
        onStepChange?.(currentStep);
    }, [currentStep, onStepChange]);

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsExiting(true);
        onStepChange?.(-1); // Reset animation
        setTimeout(() => {
            onComplete();
        }, 300);
    };

    // Position du tooltip selon l'étape
    const getTooltipPosition = (): React.CSSProperties => {
        if (step.id === 'filter') {
            return { top: 'calc(85px + env(safe-area-inset-top))', left: '16px' };
        }
        if (step.id === 'chat') {
            return { top: 'calc(85px + env(safe-area-inset-top))', right: '16px' };
        }
        // Pour les swipes, tooltip en bas de la carte
        return { bottom: '180px', left: '50%', transform: 'translateX(-50%)' };
    };

    // Flèche selon l'étape
    const renderArrow = () => {
        if (step.id === 'swipe-right') {
            return <ArrowRight className="w-10 h-10 text-white" />;
        }
        if (step.id === 'swipe-left') {
            return <ArrowLeft className="w-10 h-10 text-white" />;
        }
        if (step.id === 'swipe-up') {
            return <ArrowUp className="w-10 h-10 text-white" />;
        }
        return null;
    };

    return (
        <div
            className={`fixed inset-0 z-[500] transition-opacity duration-300 ${
                isExiting ? 'opacity-0' : 'opacity-100'
            }`}
        >
            {/* Overlay très léger - cliquable pour quitter */}
            <div className="absolute inset-0 bg-black/20" onClick={handleComplete} />

            {/* Skip button - centré */}
            <button
                className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 text-white/80 text-sm bg-black/50 px-3 py-1.5 rounded-full"
                style={{ top: 'calc(16px + env(safe-area-inset-top))' }}
                onClick={handleComplete}
            >
                Skip
                <X className="w-4 h-4" />
            </button>

            {/* Flèche pour filtre pointant vers le haut */}
            {step.id === 'filter' && (
                <div
                    className="absolute"
                    style={{ top: 'calc(60px + env(safe-area-inset-top))', left: '45px' }}
                >
                    <ArrowUp className="w-6 h-6 text-white animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </div>
            )}

            {/* Flèche pour chat pointant vers le haut */}
            {step.id === 'chat' && (
                <div
                    className="absolute"
                    style={{ top: 'calc(60px + env(safe-area-inset-top))', right: '30px' }}
                >
                    <ArrowUp className="w-6 h-6 text-white animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </div>
            )}

            {/* Tooltip avec texte */}
            <div
                className="absolute"
                style={getTooltipPosition()}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-black/85 backdrop-blur-sm rounded-2xl px-6 py-4 max-w-xs shadow-2xl">
                    {/* Flèche pour les swipes */}
                    {(step.id === 'swipe-right' ||
                        step.id === 'swipe-left' ||
                        step.id === 'swipe-up') && (
                        <div className="flex justify-center mb-3">{renderArrow()}</div>
                    )}

                    {/* Title */}
                    <h2 className="text-lg font-bold text-white text-center mb-1">{step.title}</h2>

                    {/* Description */}
                    <p className="text-white/70 text-center text-sm">{step.description}</p>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-1.5 mt-4">
                        {tutorialSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    index === currentStep
                                        ? 'bg-white w-4'
                                        : index < currentStep
                                          ? 'bg-white/60 w-1.5'
                                          : 'bg-white/30 w-1.5'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Next button */}
                    <button
                        className="w-full mt-4 bg-white text-black font-medium py-2.5 rounded-xl flex items-center justify-center gap-1"
                        onClick={handleNext}
                    >
                        {isLastStep ? 'Commencer' : 'Suivant'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
