/**
 * ==================== NAV ITEM ====================
 * Composant bouton de navigation réutilisable
 * Utilisé par BottomNavbar et HostBottomNavbar
 */

interface NavItemProps {
    /** Icône à afficher */
    icon: React.ReactNode;
    /** Label sous l'icône */
    label: string;
    /** État actif (sélectionné) */
    isActive?: boolean;
    /** Callback au clic */
    onClick?: () => void;
    /** Badge de notification (nombre) */
    badge?: number;
}

export const NavItem = ({ icon, label, isActive = false, onClick, badge }: NavItemProps) => (
    <button
        onClick={onClick}
        className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
    >
        <div className="relative">
            {icon}
            {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </div>
        <span
            className={`text-xs mt-1 ${isActive ? 'text-brand font-semibold' : 'text-secondary'}`}
        >
            {label}
        </span>
    </button>
);
