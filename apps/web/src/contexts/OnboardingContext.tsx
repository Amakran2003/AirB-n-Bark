import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * ==================== ONBOARDING CONTEXT ====================
 * Gère l'état de l'onboarding et du tutoriel
 * - Persiste dans localStorage
 * - Gère les étapes: splash → onboarding → tutorial → app
 * - Change le background du body selon la phase
 */

const STORAGE_KEY = 'airbinbark_onboarding';

interface OnboardingState {
    hasSeenSplash: boolean;
    hasCompletedOnboarding: boolean;
    hasCompletedTutorial: boolean;
}

interface OnboardingContextType {
    state: OnboardingState;
    currentPhase: 'splash' | 'onboarding' | 'tutorial' | 'app';
    completeSplash: () => void;
    completeOnboarding: () => void;
    completeTutorial: () => void;
    resetOnboarding: () => void; // Pour debug/testing
}

const defaultState: OnboardingState = {
    hasSeenSplash: false,
    hasCompletedOnboarding: false,
    hasCompletedTutorial: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<OnboardingState>(() => {
        // Charger depuis localStorage au démarrage
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load onboarding state:', e);
        }
        return defaultState;
    });

    // Calculer la phase actuelle
    const currentPhase = (() => {
        if (!state.hasSeenSplash) return 'splash';
        if (!state.hasCompletedOnboarding) return 'onboarding';
        if (!state.hasCompletedTutorial) return 'tutorial';
        return 'app';
    })();

    // Changer le background du body selon la phase
    useEffect(() => {
        if (currentPhase === 'splash') {
            document.body.style.backgroundColor = '#3B82F6';
        } else {
            document.body.style.backgroundColor = '#ffffff';
        }
    }, [currentPhase]);

    // Sauvegarder dans localStorage à chaque changement
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save onboarding state:', e);
        }
    }, [state]);

    const completeSplash = () => {
        setState((prev) => ({ ...prev, hasSeenSplash: true }));
    };

    const completeOnboarding = () => {
        setState((prev) => ({ ...prev, hasCompletedOnboarding: true }));
    };

    const completeTutorial = () => {
        setState((prev) => ({ ...prev, hasCompletedTutorial: true }));
    };

    const resetOnboarding = () => {
        setState(defaultState);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <OnboardingContext.Provider
            value={{
                state,
                currentPhase,
                completeSplash,
                completeOnboarding,
                completeTutorial,
                resetOnboarding,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
