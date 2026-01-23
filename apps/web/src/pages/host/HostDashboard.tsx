import { 
    Home, 
    Calendar, 
    Plus, 
    ChevronRight, 
    AlertTriangle,
    TrendingUp,
    Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ==================== HOST DASHBOARD ====================
 * Tableau de bord principal pour les hotes
 * - Vue d'ensemble des statistiques
 * - Acces rapide aux fonctionnalites
 * - Alertes et notifications
 * 
 * TODO API:
 * - GET /api/host/dashboard → statistiques globales
 * - GET /api/host/notifications → notifications recentes
 * - GET /api/host/earnings → revenus du mois
 * - GET /api/host/verification-status → statut de verification
 */

interface HostDashboardProps {
    onAddListing: () => void;
    onViewListings: () => void;
}

export const HostDashboard = ({ onAddListing, onViewListings }: HostDashboardProps) => {
    const { user } = useAuth();
    
    // Mock data - TODO: remplacer par API
    const stats = {
        totalListings: 0,
        activeBookings: 0,
        pendingBookings: 0,
        unreadMessages: 0,
        monthlyEarnings: 0,
        averageRating: 0,
    };

    const isVerified = false; // TODO: GET /api/host/verification-status

    return (
        <div className="fixed inset-0 bg-[#f7f7f7] flex flex-col">
            {/* Header */}
            <div 
                className="shrink-0 px-4 py-4 bg-white border-b border-[#ebebeb]"
                style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
            >
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-caption text-secondary">Mode Hote</p>
                        <h1 className="text-h2">Bonjour, {user?.pseudo || 'Hote'}</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div 
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
            >
                {/* Alerte verification */}
                {!isVerified && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-body-md font-medium text-amber-800">
                                    Verification en attente
                                </p>
                                <p className="text-sm text-amber-700 mt-1">
                                    Pour publier des annonces, verifie ton identite. 
                                    Tu peux quand meme preparer tes annonces en attendant.
                                </p>
                                <button className="mt-2 text-sm font-medium text-amber-800 underline">
                                    Verifier mon identite
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats rapides */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-caption text-secondary">Ce mois</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.monthlyEarnings}€</p>
                        <p className="text-caption text-secondary">revenus</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="text-caption text-secondary">Note moyenne</span>
                        </div>
                        <p className="text-2xl font-bold">
                            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                        </p>
                        <p className="text-caption text-secondary">sur 5</p>
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#ebebeb]">
                        <h2 className="text-body-md font-semibold">Actions rapides</h2>
                    </div>
                    
                    <button 
                        onClick={onAddListing}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-[#ebebeb]"
                    >
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-body-md font-medium">Ajouter une annonce</p>
                            <p className="text-caption text-secondary">Propose une nouvelle niche</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-secondary" />
                    </button>

                    <button 
                        onClick={onViewListings}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-[#ebebeb]"
                    >
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Home className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-body-md font-medium">Mes annonces</p>
                            <p className="text-caption text-secondary">{stats.totalListings} annonce(s)</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-secondary" />
                    </button>
                </div>

                {/* Prochaines reservations */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-[#ebebeb]">
                        <h2 className="text-body-md font-semibold">Prochaines reservations</h2>
                    </div>
                    <div className="p-8 text-center">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-body text-secondary">Aucune reservation a venir</p>
                        <p className="text-caption text-secondary mt-1">
                            Les reservations apparaitront ici
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
