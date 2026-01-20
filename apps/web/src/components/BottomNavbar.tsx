import { Home, MessageCircle, User } from 'lucide-react';

/**
 * ==================== BOTTOM NAVBAR ====================
 * Barre de navigation fixée en bas de l'écran
 * 3 onglets : Home, Messages, Profil
 */

interface NavItemProps {
    icon: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
}

const NavItem = ({ icon, isActive = false, onClick }: NavItemProps) => (
    <button
        onClick={onClick}
        className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
    >
        {icon}
    </button>
);

interface BottomNavbarProps {
    activeTab?: 'home' | 'messages' | 'profile';
    onTabChange?: (tab: 'home' | 'messages' | 'profile') => void;
}

export const BottomNavbar = ({ activeTab = 'home', onTabChange }: BottomNavbarProps) => {
    return (
        <nav className="bottom-navbar">
            <NavItem
                icon={<Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 1.5} />}
                isActive={activeTab === 'home'}
                onClick={() => onTabChange?.('home')}
            />
            <NavItem
                icon={<MessageCircle className="w-6 h-6" strokeWidth={activeTab === 'messages' ? 2.5 : 1.5} />}
                isActive={activeTab === 'messages'}
                onClick={() => onTabChange?.('messages')}
            />

            <NavItem
                icon={<User className="w-6 h-6" strokeWidth={activeTab === 'profile' ? 2.5 : 1.5} />}
                isActive={activeTab === 'profile'}
                onClick={() => onTabChange?.('profile')}
            />
        </nav>
    );
};
