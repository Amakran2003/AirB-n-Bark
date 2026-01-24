import { useState, useEffect } from 'react';
import { Home } from './pages/Home.tsx';
import { Trips } from './pages/Trips.tsx';
import { Messages } from './pages/Messages.tsx';
import { Profile } from './pages/Profile.tsx';
import { 
    HostDashboard, 
    HostListings, 
    HostAddListing, 
    HostBookings, 
    HostMessages 
} from './pages/host';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FilterProvider, useFilters } from './contexts/FilterContext';
import { BookingProvider } from './contexts/BookingContext';
import { MessagesProvider } from './contexts/MessagesContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { AuthModal } from './components/AuthModal';
import { FilterModal } from './components/FilterModal';
import { Splash } from './components/Splash';
import { Onboarding } from './components/Onboarding';
import { TutorialOverlay, getTutorialStepId, TutorialStepId } from './components/TutorialOverlay';
import { HostBottomNavbar, HostTab } from './components/HostBottomNavbar';

/**
 * ==================== APP CONTENT ====================
 * Gère l'affichage conditionnel selon la phase d'onboarding
 */

const AppContent = () => {
    const { currentPhase, completeSplash, completeOnboarding, completeTutorial } = useOnboarding();
    const { user, switchToGuest } = useAuth();
    const { refetch: refetchListings } = useFilters();
    
    // Étape actuelle du tutoriel (pour animer la carte)
    const [tutorialStep, setTutorialStep] = useState<TutorialStepId | null>(null);
    
    // Onglet actif (pour navigation entre Home et Trips)
    const [activeTab, setActiveTab] = useState<'home' | 'trips' | 'messages' | 'profile'>('home');
    
    // Mode hote actif - persisté dans localStorage
    const [isHostMode, setIsHostMode] = useState(() => {
        const saved = localStorage.getItem('isHostMode');
        return saved === 'true';
    });
    const [hostTab, setHostTab] = useState<HostTab>('dashboard');
    
    // Pages hote qui s'ouvrent en overlay (listings, add-listing)
    const [hostOverlay, setHostOverlay] = useState<'listings' | 'add-listing' | null>(null);
    
    // Persister isHostMode dans localStorage
    useEffect(() => {
        localStorage.setItem('isHostMode', isHostMode.toString());
    }, [isHostMode]);
    
    // Si l'utilisateur n'est plus hôte, revenir en mode guest
    useEffect(() => {
        if (isHostMode && user && !user.isHost) {
            setIsHostMode(false);
        }
    }, [user, isHostMode]);

    // Callback quand l'étape du tutoriel change
    const handleTutorialStepChange = (stepIndex: number) => {
        setTutorialStep(getTutorialStepId(stepIndex));
    };
    
    // Gestion du changement d'onglet (guest)
    const handleTabChange = (tab: 'home' | 'trips' | 'messages' | 'profile') => {
        setActiveTab(tab);
    };
    
    // Gestion du changement d'onglet (host)
    const handleHostTabChange = (tab: HostTab) => {
        setHostTab(tab);
        setHostOverlay(null); // Fermer l'overlay si on change d'onglet
    };
    
    // Passer en mode hote
    const handleBecomeHost = () => {
        setIsHostMode(true);
        setHostTab('dashboard');
        setHostOverlay(null);
    };
    
    // Aller au dashboard hote
    const handleGoToHostDashboard = () => {
        setIsHostMode(true);
        setHostTab('dashboard');
        setHostOverlay(null);
    };
    
    // Revenir en mode voyageur
    const handleSwitchToGuest = () => {
        setIsHostMode(false);
        setActiveTab('home');
        setHostOverlay(null);
        switchToGuest();
        refetchListings(); // Rafraîchir les annonces pour voir les nouvelles
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
                    {/* Mode Hote */}
                    {isHostMode && user?.isHost ? (
                        <>
                            {/* Contenu principal selon l'onglet actif */}
                            {hostTab === 'dashboard' && !hostOverlay && (
                                <HostDashboard 
                                    onAddListing={() => setHostOverlay('add-listing')}
                                    onViewListings={() => setHostOverlay('listings')}
                                />
                            )}
                            {hostTab === 'bookings' && !hostOverlay && (
                                <HostBookings 
                                    onMessage={() => setHostTab('messages')}
                                />
                            )}
                            {hostTab === 'messages' && !hostOverlay && (
                                <HostMessages />
                            )}
                            {hostTab === 'profile' && !hostOverlay && (
                                <Profile 
                                    onTabChange={handleTabChange}
                                    onBecomeHost={handleBecomeHost}
                                    onGoToHostDashboard={handleGoToHostDashboard}
                                    isHostMode={true}
                                    onSwitchToGuest={handleSwitchToGuest}
                                />
                            )}
                            
                            {/* Overlays (pages qui s'ouvrent par-dessus avec bouton retour) */}
                            {hostOverlay === 'listings' && (
                                <HostListings 
                                    onBack={() => setHostOverlay(null)}
                                    onAddListing={() => setHostOverlay('add-listing')}
                                    onEditListing={(id) => console.log('Edit listing', id)}
                                />
                            )}
                            {hostOverlay === 'add-listing' && (
                                <HostAddListing 
                                    onBack={() => setHostOverlay(null)}
                                    onSuccess={() => {
                                        refetchListings(); // Rafraîchir les listings pour les guests aussi
                                        setHostOverlay('listings');
                                    }}
                                />
                            )}
                            
                            {/* Bottom Nav Hote (toujours visible sauf en overlay) */}
                            {!hostOverlay && (
                                <HostBottomNavbar 
                                    activeTab={hostTab}
                                    onTabChange={handleHostTabChange}
                                />
                            )}
                        </>
                    ) : (
                        /* Mode Voyageur */
                        <>
                            {activeTab === 'home' && (
                                <Home 
                                    tutorialStep={currentPhase === 'tutorial' ? tutorialStep : null}
                                    onTabChange={handleTabChange}
                                />
                            )}
                            {activeTab === 'trips' && (
                                <Trips onTabChange={handleTabChange} />
                            )}
                            {activeTab === 'messages' && (
                                <Messages onTabChange={handleTabChange} />
                            )}
                            {activeTab === 'profile' && (
                                <Profile 
                                    onTabChange={handleTabChange}
                                    onBecomeHost={handleBecomeHost}
                                    onGoToHostDashboard={handleGoToHostDashboard}
                                />
                            )}
                        </>
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
                    <MessagesProvider>
                        <FilterProvider>
                            <AppContent />
                        </FilterProvider>
                    </MessagesProvider>
                </BookingProvider>
            </AuthProvider>
        </OnboardingProvider>
    );
}

export default App;
