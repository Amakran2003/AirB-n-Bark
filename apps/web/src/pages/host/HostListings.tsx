import { useState } from 'react';
import { 
    ArrowLeft, 
    Plus, 
    MoreVertical, 
    Eye, 
    EyeOff,
    Pencil, 
    Trash2,
    Home,
    Star
} from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

/**
 * ==================== HOST LISTINGS ====================
 * Page pour gerer les annonces de l'hote
 * - Liste des annonces avec statut
 * - Actions: modifier, desactiver, supprimer
 * - Bouton ajouter une annonce
 * 
 * TODO API:
 * - GET /api/host/listings → liste des annonces de l'hote
 * - PUT /api/host/listings/:id → modifier une annonce
 * - DELETE /api/host/listings/:id → supprimer une annonce
 * - PATCH /api/host/listings/:id/toggle → activer/desactiver
 */

interface Listing {
    id: string;
    title: string;
    image: string;
    price: number;
    isActive: boolean;
    totalBookings: number;
    averageRating: number;
    reviewCount: number;
}

interface HostListingsProps {
    onBack: () => void;
    onAddListing: () => void;
    onEditListing: (id: string) => void;
}

export const HostListings = ({ onBack, onAddListing, onEditListing }: HostListingsProps) => {
    // Mock data - TODO: GET /api/host/listings
    const [listings, setListings] = useState<Listing[]>([]);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const toggleListingStatus = (id: string) => {
        // TODO: PATCH /api/host/listings/:id/toggle
        setListings(prev => 
            prev.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l)
        );
        setActiveMenu(null);
    };

    const deleteListing = (id: string) => {
        // TODO: DELETE /api/host/listings/:id
        if (confirm('Supprimer cette annonce ?')) {
            setListings(prev => prev.filter(l => l.id !== id));
        }
        setActiveMenu(null);
    };

    return (
        <div className="fixed inset-0 bg-[#f7f7f7] flex flex-col">
            {/* Header */}
            <div 
                className="shrink-0 px-4 py-4 bg-white border-b border-[#ebebeb]"
                style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
            >
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center -ml-2"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-h2 flex-1">Mes annonces</h1>
                    <button 
                        onClick={onAddListing}
                        className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div 
                className="flex-1 overflow-y-auto p-4"
                style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
            >
                {listings.length === 0 ? (
                    <EmptyState
                        icon={Home}
                        title="Aucune annonce"
                        description="Commence par creer ta premiere annonce pour accueillir des toutous"
                        action={{ label: "Ajouter une annonce", onClick: onAddListing }}
                    />
                ) : (
                    <div className="space-y-4">
                        {listings.map(listing => (
                            <div 
                                key={listing.id}
                                className={`bg-white rounded-2xl shadow-sm overflow-hidden ${
                                    !listing.isActive ? 'opacity-60' : ''
                                }`}
                            >
                                <div className="flex gap-4 p-4">
                                    <img 
                                        src={listing.image} 
                                        alt={listing.title}
                                        className="w-24 h-24 rounded-xl object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-body-md font-medium truncate">
                                                {listing.title}
                                            </h3>
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setActiveMenu(activeMenu === listing.id ? null : listing.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                                                >
                                                    <MoreVertical className="w-5 h-5 text-secondary" />
                                                </button>
                                                
                                                {activeMenu === listing.id && (
                                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#ebebeb] py-2 z-10 min-w-[150px]">
                                                        <button 
                                                            onClick={() => {
                                                                onEditListing(listing.id);
                                                                setActiveMenu(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                            <span className="text-sm">Modifier</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleListingStatus(listing.id)}
                                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
                                                        >
                                                            {listing.isActive ? (
                                                                <>
                                                                    <EyeOff className="w-4 h-4" />
                                                                    <span className="text-sm">Desactiver</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye className="w-4 h-4" />
                                                                    <span className="text-sm">Activer</span>
                                                                </>
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteListing(listing.id)}
                                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <span className="text-sm">Supprimer</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <p className="text-body font-semibold mt-1">
                                            {listing.price}€ <span className="text-secondary font-normal">/ nuit</span>
                                        </p>
                                        
                                        <div className="flex items-center gap-4 mt-2 text-caption text-secondary">
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 text-amber-500" />
                                                {listing.averageRating > 0 
                                                    ? `${listing.averageRating.toFixed(1)} (${listing.reviewCount})`
                                                    : 'Nouveau'}
                                            </span>
                                            <span>{listing.totalBookings} reservation(s)</span>
                                        </div>
                                        
                                        <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                            listing.isActive 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {listing.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
