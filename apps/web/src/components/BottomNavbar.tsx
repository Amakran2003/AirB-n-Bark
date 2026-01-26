import { Home, Calendar, MessageCircle, User } from 'lucide-react';
import { useMessages } from '../contexts/MessagesContext';
import { NavItem } from './NavItem';

/**
 * ==================== BOTTOM NAVBAR ====================
 * Barre de navigation fixée en bas de l'écran
 * 4 onglets : Swipe (Home), Voyages, Messages, Profil
 */

interface BottomNavbarProps {
    activeTab?: 'home' | 'trips' | 'messages' | 'profile';
    onTabChange?: (tab: 'home' | 'trips' | 'messages' | 'profile') => void;
}

export const BottomNavbar = ({ activeTab = 'home', onTabChange }: BottomNavbarProps) => {
    // Récupérer le nombre de messages non lus
    let unreadCount = 0;
    try {
        const { totalUnreadCount } = useMessages();
        unreadCount = totalUnreadCount;
    } catch {
        // Context non disponible, pas de badge
    }

    return (
        <nav className="bottom-navbar">
            <NavItem
                icon={<Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 1.5} />}
                label="Swipe"
                isActive={activeTab === 'home'}
                onClick={() => onTabChange?.('home')}
            />
            <NavItem
                icon={
                    <Calendar className="w-6 h-6" strokeWidth={activeTab === 'trips' ? 2.5 : 1.5} />
                }
                label="Voyages"
                isActive={activeTab === 'trips'}
                onClick={() => onTabChange?.('trips')}
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
                badge={unreadCount}
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
