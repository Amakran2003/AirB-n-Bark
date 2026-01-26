import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Plus,
    MoreVertical,
    Eye,
    EyeOff,
    Pencil,
    Trash2,
    Home,
    Star,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import {
    getMyListings,
    toggleListingStatus as apiToggleListingStatus,
    deleteListing as apiDeleteListing,
} from '../../services/hostApi';

/**
 * ==================== HOST LISTINGS ====================
 * Page pour gerer les annonces de l'hote
 * - Liste des annonces avec statut (depuis API)
 * - Bottom Sheet pour les actions (responsive)
 * - Modal de confirmation pour la suppression
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
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Bottom Sheet pour les actions
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

    // Modal de confirmation suppression
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Charger les listings au montage
    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        setIsLoading(true);
        setError(null);

        const result = await getMyListings();

        if (result.success && result.data) {
            const mappedListings: Listing[] = result.data.map((item: any) => ({
                id: item.id,
                title: item.title,
                image: item.mainImage || '/placeholder-dog.svg',
                price: item.pricePerNight,
                isActive: item.isActive ?? true,
                totalBookings: item._count?.bookings ?? 0,
                averageRating: item.rating ?? 0,
                reviewCount: item.reviewsCount ?? 0,
            }));
            setListings(mappedListings);
        } else {
            setError(result.error || 'Erreur lors du chargement');
        }

        setIsLoading(false);
    };

    const openActionSheet = (listing: Listing) => {
        setSelectedListing(listing);
        setIsActionSheetOpen(true);
    };

    const closeActionSheet = () => {
        setIsActionSheetOpen(false);
        setTimeout(() => setSelectedListing(null), 200);
    };

    const handleEdit = () => {
        if (selectedListing) {
            onEditListing(selectedListing.id);
        }
        closeActionSheet();
    };

    const handleToggleStatus = async () => {
        if (!selectedListing) return;

        const newStatus = !selectedListing.isActive;
        const listingId = selectedListing.id;

        // Optimistic update
        setListings((prev) =>
            prev.map((l) => (l.id === listingId ? { ...l, isActive: newStatus } : l))
        );
        closeActionSheet();

        // Call API
        const result = await apiToggleListingStatus(listingId, newStatus);
        if (!result.success) {
            // Rollback on error
            setListings((prev) =>
                prev.map((l) => (l.id === listingId ? { ...l, isActive: !newStatus } : l))
            );
        }
    };

    const openDeleteModal = () => {
        setIsActionSheetOpen(false);
        setTimeout(() => setIsDeleteModalOpen(true), 200);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
    };

    const handleDelete = async () => {
        if (!selectedListing) return;

        setIsDeleting(true);
        const listingId = selectedListing.id;

        const result = await apiDeleteListing(listingId);

        if (result.success) {
            setListings((prev) => prev.filter((l) => l.id !== listingId));
            closeDeleteModal();
            setSelectedListing(null);
        } else {
            // Show error somehow
        }

        setIsDeleting(false);
    };

    return (
        <div className="fixed inset-0 bg-page flex flex-col">
            {/* Header */}
            <div
                className="shrink-0 px-4 py-4 bg-white border-b border-(--color-border-light)"
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
                        className="w-10 h-10 bg-brand rounded-full flex items-center justify-center"
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
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-brand" />
                    </div>
                ) : error ? (
                    <EmptyState
                        icon={Home}
                        title="Erreur"
                        description={error}
                        action={{ label: 'Réessayer', onClick: loadListings }}
                    />
                ) : listings.length === 0 ? (
                    <EmptyState
                        icon={Home}
                        title="Aucune annonce"
                        description="Commence par creer ta premiere annonce pour accueillir des toutous"
                        action={{ label: 'Ajouter une annonce', onClick: onAddListing }}
                    />
                ) : (
                    <div className="space-y-4">
                        {listings.map((listing) => (
                            <div
                                key={listing.id}
                                className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-opacity ${
                                    !listing.isActive ? 'opacity-60' : ''
                                }`}
                            >
                                <div className="flex gap-4 p-4">
                                    <img
                                        src={listing.image}
                                        alt={listing.title}
                                        className="w-24 h-24 rounded-xl object-cover shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-body-md font-medium truncate pr-2">
                                                {listing.title}
                                            </h3>
                                            <button
                                                onClick={() => openActionSheet(listing)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-tertiary shrink-0"
                                            >
                                                <MoreVertical className="w-5 h-5 text-secondary" />
                                            </button>
                                        </div>

                                        <p className="text-body font-semibold mt-1">
                                            {listing.price}€{' '}
                                            <span className="text-secondary font-normal">
                                                / nuit
                                            </span>
                                        </p>

                                        <div className="flex items-center gap-3 mt-2 text-caption text-secondary flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 text-warning" />
                                                {listing.averageRating > 0
                                                    ? `${listing.averageRating.toFixed(1)} (${listing.reviewCount})`
                                                    : 'Nouveau'}
                                            </span>
                                            <span>{listing.totalBookings} résa</span>
                                        </div>

                                        <span
                                            className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                listing.isActive
                                                    ? 'bg-success-light text-success'
                                                    : 'bg-tertiary text-secondary'
                                            }`}
                                        >
                                            {listing.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Bottom Sheet */}
            {isActionSheetOpen && (
                <div className="fixed inset-0 z-50" onClick={closeActionSheet}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 animate-fade-in" />

                    {/* Sheet */}
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl animate-slide-up"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-10 h-1 bg-tertiary rounded-full" />
                        </div>

                        {/* Listing Info */}
                        {selectedListing && (
                            <div className="px-4 pb-4 border-b border-(--color-border-light)">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={selectedListing.image}
                                        alt={selectedListing.title}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {selectedListing.title}
                                        </p>
                                        <p className="text-sm text-secondary">
                                            {selectedListing.price}€ / nuit
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="p-2">
                            <button
                                onClick={handleEdit}
                                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-secondary active:bg-tertiary transition-colors"
                            >
                                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                                    <Pencil className="w-5 h-5 text-brand" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">Modifier</p>
                                    <p className="text-sm text-secondary">
                                        Éditer les informations
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={handleToggleStatus}
                                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-secondary active:bg-tertiary transition-colors"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        selectedListing?.isActive
                                            ? 'bg-warning-light'
                                            : 'bg-success-light'
                                    }`}
                                >
                                    {selectedListing?.isActive ? (
                                        <EyeOff className="w-5 h-5 text-warning" />
                                    ) : (
                                        <Eye className="w-5 h-5 text-success" />
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">
                                        {selectedListing?.isActive ? 'Désactiver' : 'Activer'}
                                    </p>
                                    <p className="text-sm text-secondary">
                                        {selectedListing?.isActive
                                            ? 'Masquer temporairement'
                                            : 'Rendre visible'}
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={openDeleteModal}
                                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-error-light active:bg-error-lighter transition-colors"
                            >
                                <div className="w-10 h-10 bg-error-light rounded-full flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-error" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-error">Supprimer</p>
                                    <p className="text-sm text-error">Action irréversible</p>
                                </div>
                            </button>
                        </div>

                        {/* Cancel */}
                        <div className="p-4 pt-0">
                            <button
                                onClick={closeActionSheet}
                                className="w-full py-3 rounded-xl bg-tertiary font-medium hover:bg-secondary transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedListing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={closeDeleteModal}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 animate-fade-in" />

                    {/* Modal */}
                    <div
                        className="relative bg-white rounded-3xl w-full max-w-sm p-6 animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-error-light rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-error" />
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-center mb-2">
                            Supprimer l'annonce ?
                        </h2>

                        {/* Description */}
                        <p className="text-secondary text-center mb-6">
                            <span className="font-medium text-primary">
                                {selectedListing.title}
                            </span>{' '}
                            sera définitivement supprimée. Cette action est irréversible.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={closeDeleteModal}
                                disabled={isDeleting}
                                className="flex-1 py-3 rounded-xl bg-tertiary font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 rounded-xl bg-error text-white font-medium hover:bg-error-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Suppression...
                                    </>
                                ) : (
                                    'Supprimer'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes scale-in {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
                .animate-scale-in { animation: scale-in 0.2s ease-out; }
            `}</style>
        </div>
    );
};
