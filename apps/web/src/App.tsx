import { useState } from 'react';
import { Home } from './pages/Home.tsx';
import { Trips } from './pages/Trips.tsx';
import { Messages } from './pages/Messages.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { FilterProvider } from './contexts/FilterContext';
import { BookingProvider } from './contexts/BookingContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { AuthModal } from './components/AuthModal';
import { FilterModal } from './components/FilterModal';
import { Splash } from './components/Splash';
import { Onboarding } from './components/Onboarding';
import { TutorialOverlay, getTutorialStepId, TutorialStepId } from './components/TutorialOverlay';

/**
 * ==================== APP CONTENT ====================
 * Gère l'affichage conditionnel selon la phase d'onboarding
 */
const AppContent = () => {
    const { currentPhase, completeSplash, completeOnboarding, completeTutorial } = useOnboarding();
    
    // Étape actuelle du tutoriel (pour animer la carte)
    const [tutorialStep, setTutorialStep] = useState<TutorialStepId | null>(null);
    
    // Onglet actif (pour navigation entre Home et Trips)
    const [activeTab, setActiveTab] = useState<'home' | 'trips' | 'messages' | 'profile'>('home');

    // Callback quand l'étape du tutoriel change
    const handleTutorialStepChange = (stepIndex: number) => {
        setTutorialStep(getTutorialStepId(stepIndex));
    };
    
    // Gestion du changement d'onglet
    const handleTabChange = (tab: 'home' | 'trips' | 'messages' | 'profile') => {
        setActiveTab(tab);
    };

    return (
        <>
            {/* Splash Screen */}
            {currentPhase === 'splash' && <Splash onComplete={completeSplash} />}

            {/* Onboarding Slides */}
            {currentPhase === 'onboarding' && <Onboarding onComplete={completeOnboarding} />}

            {/* Main App (always rendered for background) */}
            {(currentPhase === 'tutorial' || currentPhase === 'app') && (
                <>
                    {activeTab === 'home' && (
                        <Home 
                            tutorialStep={currentPhase === 'tutorial' ? tutorialStep : null}
                            onTabChange={handleTabChange}
                        />
                    )}
                    {activeTab === 'trips' && (
                        <Trips 
                            onBack={() => setActiveTab('home')}
                            onTabChange={handleTabChange}
                        />
                    )}
                    {activeTab === 'messages' && (
                        <Messages 
                            onBack={() => setActiveTab('home')}
                            onTabChange={handleTabChange}
                        />
                    )}
                    <AuthModal />
                    <FilterModal />
                </>
            )}

            {/* Tutorial Overlay (on top of Home) */}
            {currentPhase === 'tutorial' && (
                <TutorialOverlay 
                    onComplete={completeTutorial} 
                    onStepChange={handleTutorialStepChange}
                />
            )}
        </>
    );
};

function App() {
    return (
        <OnboardingProvider>
            <AuthProvider>
                <BookingProvider>
                    <FilterProvider>
                        <AppContent />
                    </FilterProvider>
                </BookingProvider>
            </AuthProvider>
        </OnboardingProvider>
    );
}

export default App;
