import { ReactNode } from 'react';
import { BottomNavbar } from './BottomNavbar';
import { HostBottomNavbar, HostTab } from './HostBottomNavbar';

/**
 * ==================== PAGE LAYOUT ====================
 * Layout réutilisable pour les pages de l'app
 * - Header avec safe-area
 * - Contenu scrollable
 * - BottomNavbar optionnelle
 * 
 * Usage:
 * <PageLayout
 *   title="Messages"
 *   showNavbar
 *   activeTab="messages"
 *   onTabChange={setTab}
 * >
 *   <div>Contenu de la page</div>
 * </PageLayout>
 */

type GuestTab = 'home' | 'trips' | 'messages' | 'profile';

interface PageLayoutProps {
    /** Contenu de la page */
    children: ReactNode;
    /** Titre affiché dans le header */
    title?: string;
    /** Élément personnalisé côté gauche du header */
    headerLeft?: ReactNode;
    /** Élément personnalisé côté droit du header */
    headerRight?: ReactNode;
    /** Contenu personnalisé du header (remplace title) */
    headerContent?: ReactNode;
    /** Afficher le header (default: true) */
    showHeader?: boolean;
    /** Afficher la navbar en bas (default: true) */
    showNavbar?: boolean;
    /** Type de navbar: 'guest' | 'host' */
    navbarType?: 'guest' | 'host';
    /** Onglet actif pour la navbar guest */
    activeTab?: GuestTab;
    /** Callback changement d'onglet guest */
    onTabChange?: (tab: GuestTab) => void;
    /** Onglet actif pour la navbar host */
    activeHostTab?: HostTab;
    /** Callback changement d'onglet host */
    onHostTabChange?: (tab: HostTab) => void;
    /** Badges pour host navbar */
    pendingBookings?: number;
    unreadMessages?: number;
    /** Couleur de fond (default: white) */
    backgroundColor?: string;
    /** Style inline additionnel pour le conteneur */
    style?: React.CSSProperties;
    /** Classe CSS additionnelle */
    className?: string;
    /** Footer fixe (au-dessus de la navbar) */
    footer?: ReactNode;
}

export const PageLayout = ({
    children,
    title,
    headerLeft,
    headerRight,
    headerContent,
    showHeader = true,
    showNavbar = true,
    navbarType = 'guest',
    activeTab = 'home',
    onTabChange,
    activeHostTab = 'dashboard',
    onHostTabChange,
    pendingBookings = 0,
    unreadMessages = 0,
    backgroundColor = 'white',
    style,
    className = '',
    footer,
}: PageLayoutProps) => {
    return (
        <div 
            className={`fixed inset-0 flex flex-col ${className}`}
            style={{ backgroundColor, ...style }}
        >
            {/* Header */}
            {showHeader && (
                <div
                    className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-[#ebebeb]"
                    style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
                >
                    {headerLeft ?? <div className="w-10" />}
                    
                    {headerContent ? (
                        headerContent
                    ) : title ? (
                        <h1 className="text-h2">{title}</h1>
                    ) : (
                        <div />
                    )}
                    
                    {headerRight ?? <div className="w-10" />}
                </div>
            )}

            {/* Content */}
            <div
                className="flex-1 overflow-y-auto"
                style={{ 
                    paddingBottom: showNavbar 
                        ? 'calc(80px + env(safe-area-inset-bottom))' 
                        : footer 
                            ? '0' 
                            : 'env(safe-area-inset-bottom)'
                }}
            >
                {children}
            </div>

            {/* Footer */}
            {footer && (
                <div 
                    className="shrink-0 bg-white border-t border-[#ebebeb]"
                    style={{ 
                        paddingBottom: showNavbar 
                            ? 'calc(80px + env(safe-area-inset-bottom))'
                            : 'env(safe-area-inset-bottom)'
                    }}
                >
                    {footer}
                </div>
            )}

            {/* Bottom Navbar */}
            {showNavbar && navbarType === 'guest' && (
                <BottomNavbar activeTab={activeTab} onTabChange={onTabChange} />
            )}
            {showNavbar && navbarType === 'host' && (
                <HostBottomNavbar 
                    activeTab={activeHostTab} 
                    onTabChange={onHostTabChange}
                    pendingBookings={pendingBookings}
                    unreadMessages={unreadMessages}
                />
            )}
        </div>
    );
};
