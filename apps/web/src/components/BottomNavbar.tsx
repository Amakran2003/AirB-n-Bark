import { Home, Calendar, MessageCircle, User } from 'lucide-react';

/**
 * ==================== BOTTOM NAVBAR ====================
 * Barre de navigation fixée en bas de l'écran
 * 4 onglets : Swipe (Home), Voyages, Messages, Profil
 */

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
}

const NavItem = ({ icon, label, isActive = false, onClick }: NavItemProps) => (
    <button
        onClick={onClick}
        className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
    >
        {icon}
        <span className={`text-[10px] mt-1 ${isActive ? 'text-[#3B82F6] font-medium' : 'text-secondary'}`}>
            {label}
        </span>
    </button>
);

interface BottomNavbarProps {
    activeTab?: 'home' | 'trips' | 'messages' | 'profile';
    onTabChange?: (tab: 'home' | 'trips' | 'messages' | 'profile') => void;
}

export const BottomNavbar = ({ activeTab = 'home', onTabChange }: BottomNavbarProps) => {
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
                    <Calendar
                        className="w-6 h-6"
                        strokeWidth={activeTab === 'trips' ? 2.5 : 1.5}
                    />
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
