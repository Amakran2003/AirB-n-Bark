import { Home, Calendar, MessageCircle, User } from 'lucide-react';
import { NavItem } from './NavItem';

/**
 * ==================== HOST BOTTOM NAVBAR ====================
 * Barre de navigation fixée en bas de l'écran pour le mode Hôte
 * 4 onglets : Accueil, Réservations, Messages, Profil
 */

export type HostTab = 'dashboard' | 'bookings' | 'messages' | 'profile';

interface HostBottomNavbarProps {
    activeTab?: HostTab;
    onTabChange?: (tab: HostTab) => void;
    pendingBookings?: number;
    unreadMessages?: number;
}

export const HostBottomNavbar = ({
    activeTab = 'dashboard',
    onTabChange,
    pendingBookings = 0,
    unreadMessages = 0,
}: HostBottomNavbarProps) => {
    return (
        <nav className="bottom-navbar">
            <NavItem
                icon={
                    <Home className="w-6 h-6" strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.5} />
                }
                label="Accueil"
                isActive={activeTab === 'dashboard'}
                onClick={() => onTabChange?.('dashboard')}
            />
            <NavItem
                icon={
                    <Calendar
                        className="w-6 h-6"
                        strokeWidth={activeTab === 'bookings' ? 2.5 : 1.5}
                    />
                }
                label="Réservations"
                isActive={activeTab === 'bookings'}
                onClick={() => onTabChange?.('bookings')}
                badge={pendingBookings}
            />
            <NavItem
                icon={
                    <MessageCircle
                        className="w-6 h-6"
                        strokeWidth={activeTab === 'messages' ? 2.5 : 1.5}
                    />
                }
                label="Messages"
                isActive={activeTab === 'messages'}
                onClick={() => onTabChange?.('messages')}
                badge={unreadMessages}
            />
            <NavItem
                icon={
                    <User className="w-6 h-6" strokeWidth={activeTab === 'profile' ? 2.5 : 1.5} />
                }
                label="Profil"
                isActive={activeTab === 'profile'}
                onClick={() => onTabChange?.('profile')}
            />
        </nav>
    );
};
