import { LucideIcon } from 'lucide-react';

/**
 * ==================== EMPTY STATE ====================
 * Composant réutilisable pour afficher un état vide
 * Utilisé dans Messages, Trips, HostListings, etc.
 * 
 * Usage:
 * <EmptyState
 *   icon={MessageCircle}
 *   title="Pas encore de messages"
 *   description="Reserve une niche pour discuter avec ton hote"
 *   action={{ label: "Explorer", onClick: () => navigate('/') }}
 * />
 */

interface EmptyStateProps {
    /** Icône Lucide à afficher */
    icon: LucideIcon;
    /** Titre principal */
    title: string;
    /** Description secondaire */
    description: string;
    /** Action optionnelle (bouton) */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Classe CSS additionnelle */
    className?: string;
}

export const EmptyState = ({ 
    icon: Icon, 
    title, 
    description, 
    action,
    className = ''
}: EmptyStateProps) => (
    <div className={`flex flex-col items-center justify-center h-full px-8 text-center ${className}`}>
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Icon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-h2 mb-2">{title}</h3>
        <p className="text-body text-secondary mb-6">{description}</p>
        {action && (
            <button
                onClick={action.onClick}
                className="btn-primary px-6 py-3"
            >
                {action.label}
            </button>
        )}
    </div>
);
