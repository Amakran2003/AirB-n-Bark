import { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    MessageCircle,
    Dog,
    Loader2,
    RefreshCw,
    Home,
    Ban,
} from 'lucide-react';
import {
    getHostBookings,
    confirmBooking as apiConfirmBooking,
    rejectBooking as apiRejectBooking,
    cancelBookingAsHost as apiCancelBooking,
    type HostBooking,
} from '../../services/hostApi';

/**
 * ==================== HOST BOOKINGS ====================
 * Page pour voir et gerer les reservations recues
 * - Onglets: En attente, Confirmees, Passees, Annulees
 * - Actions: Accepter, Refuser, Contacter
 */

interface Booking {
    id: string;
    bookingNumber: string;
    guestName: string;
    guestAvatar: string;
    guestId: string;
    dogsCount: number;
    listingId: string;
    listingTitle: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    createdAt: string;
}

interface HostBookingsProps {
    onMessage: (guestId: string) => void;
}

type TabType = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const HostBookings = ({ onMessage }: HostBookingsProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Charger les réservations
    const loadBookings = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await getHostBookings();

            if (result.success && result.bookings) {
                // Mapper les données de l'API vers le format du composant
                const mappedBookings: Booking[] = result.bookings.map((b: HostBooking) => ({
                    id: b.id,
                    bookingNumber: b.bookingNumber,
                    guestName: b.guestName || 'Guest',
                    guestAvatar:
                        b.guestAvatar ||
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
                    guestId: b.guestId,
                    dogsCount: b.dogsCount || 1,
                    listingId: b.listingId,
                    listingTitle: b.listingTitle,
                    startDate: b.startDate,
                    endDate: b.endDate,
                    totalPrice: b.totalPrice,
                    status: b.status,
                    createdAt: b.createdAt,
                }));
                setBookings(mappedBookings);
            } else {
                setError(result.error || 'Erreur de chargement');
            }
        } catch (err) {
            console.error('Erreur chargement réservations:', err);
            setError('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'pending', label: 'En attente', icon: Clock },
        { id: 'confirmed', label: 'Confirmees', icon: CheckCircle },
        { id: 'completed', label: 'Passees', icon: Calendar },
        { id: 'cancelled', label: 'Annulees', icon: XCircle },
    ];

    const filteredBookings = bookings.filter((b) => b.status === activeTab);

    const handleAccept = async (bookingId: string) => {
        setActionLoading(bookingId);

        const result = await apiConfirmBooking(bookingId);

        if (result.success) {
            // Mise à jour optimiste
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' as const } : b))
            );
        } else {
            alert(result.error || 'Erreur lors de la confirmation');
        }

        setActionLoading(null);
    };

    const handleDecline = async (bookingId: string) => {
        if (!confirm('Refuser cette réservation ?')) return;

        setActionLoading(bookingId);

        const result = await apiRejectBooking(bookingId, "Refusé par l'hôte");

        if (result.success) {
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
            );
        } else {
            alert(result.error || 'Erreur lors du refus');
        }

        setActionLoading(null);
    };

    const handleCancel = async (bookingId: string) => {
        if (!confirm('Annuler cette réservation confirmée ? Le voyageur sera remboursé.')) return;

        setActionLoading(bookingId);

        const result = await apiCancelBooking(bookingId, "Annulé par l'hôte");

        if (result.success) {
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
            );
        } else {
            alert(result.error || "Erreur lors de l'annulation");
        }

        setActionLoading(null);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    // Calculer le nombre de nuits
    const calculateNights = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="fixed inset-0 bg-page flex flex-col">
            {/* Header */}
            <div
                className="shrink-0 px-4 py-4 bg-white border-b border-(--color-border-light)"
                style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-h2">Réservations</h1>
                    <button
                        onClick={loadBookings}
                        disabled={loading}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-tertiary hover:bg-secondary transition-colors"
                    >
                        <RefreshCw
                            className={`w-5 h-5 text-secondary ${loading ? 'animate-spin' : ''}`}
                        />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                    {tabs.map((tab) => {
                        const count = bookings.filter((b) => b.status === tab.id).length;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-brand text-white'
                                        : 'bg-tertiary text-secondary'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {count > 0 && (
                                    <span
                                        className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                                            activeTab === tab.id
                                                ? 'bg-white/20 text-white'
                                                : 'bg-secondary'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div
                className="flex-1 overflow-y-auto p-4"
                style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
            >
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-brand animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 bg-error-light rounded-full flex items-center justify-center mb-4">
                            <XCircle className="w-10 h-10 text-error" />
                        </div>
                        <h2 className="text-h3 mb-2">Erreur</h2>
                        <p className="text-body text-secondary mb-4">{error}</p>
                        <button
                            onClick={loadBookings}
                            className="px-4 py-2 bg-brand text-white rounded-lg font-medium"
                        >
                            Réessayer
                        </button>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 bg-tertiary rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-10 h-10 text-secondary" />
                        </div>
                        <h2 className="text-h3 mb-2">
                            {activeTab === 'pending' && 'Aucune demande'}
                            {activeTab === 'confirmed' && 'Aucune reservation'}
                            {activeTab === 'completed' && 'Aucun historique'}
                            {activeTab === 'cancelled' && 'Aucune annulation'}
                        </h2>
                        <p className="text-body text-secondary">
                            {activeTab === 'pending' && 'Les nouvelles demandes apparaitront ici'}
                            {activeTab === 'confirmed' &&
                                'Les reservations confirmees apparaitront ici'}
                            {activeTab === 'completed' &&
                                'Les reservations passees apparaitront ici'}
                            {activeTab === 'cancelled' &&
                                'Les reservations annulees apparaitront ici'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => {
                            const nights = calculateNights(booking.startDate, booking.endDate);
                            return (
                                <div
                                    key={booking.id}
                                    className="bg-white rounded-2xl shadow-sm overflow-hidden"
                                >
                                    {/* Annonce en header avec image */}
                                    <div className="p-4 bg-gradient-to-r from-primary-lighter to-white border-b border-(--color-border-light)">
                                        <div className="flex items-center gap-2 text-brand mb-1">
                                            <Home className="w-4 h-4" />
                                            <span className="text-caption font-medium">
                                                Votre annonce
                                            </span>
                                        </div>
                                        <p className="text-body-md font-semibold">
                                            {booking.listingTitle}
                                        </p>
                                    </div>

                                    {/* Guest info */}
                                    <div className="flex items-center gap-3 p-4 border-b border-(--color-border-light)">
                                        <img
                                            src={booking.guestAvatar}
                                            alt={booking.guestName}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium">{booking.guestName}</p>
                                            <p className="text-caption text-secondary">
                                                Demande du {formatDate(booking.createdAt)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => onMessage(booking.id)}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-tertiary"
                                        >
                                            <MessageCircle className="w-5 h-5 text-secondary" />
                                        </button>
                                    </div>

                                    {/* Booking details - plus compact */}
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-secondary" />
                                                <span className="text-body">
                                                    {formatDate(booking.startDate)} →{' '}
                                                    {formatDate(booking.endDate)}
                                                </span>
                                            </div>
                                            <span className="text-caption text-secondary">
                                                {nights} nuit{nights > 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Dog className="w-4 h-4 text-secondary" />
                                                <span className="text-body">
                                                    {booking.dogsCount || 1} toutou
                                                    {(booking.dogsCount || 1) > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <span className="text-body-md font-bold text-success">
                                                {booking.totalPrice}€
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions - Demandes en attente */}
                                    {booking.status === 'pending' && (
                                        <div className="flex gap-3 p-4 pt-0">
                                            <button
                                                onClick={() => handleDecline(booking.id)}
                                                disabled={actionLoading === booking.id}
                                                className="flex-1 py-3 border border-(--color-border-light) rounded-xl font-medium text-secondary disabled:opacity-50"
                                            >
                                                {actionLoading === booking.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                                ) : (
                                                    'Refuser'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleAccept(booking.id)}
                                                disabled={actionLoading === booking.id}
                                                className="flex-1 py-3 bg-success text-white rounded-xl font-medium disabled:opacity-50"
                                            >
                                                {actionLoading === booking.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                                ) : (
                                                    'Accepter'
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Actions - Réservations confirmées */}
                                    {booking.status === 'confirmed' && (
                                        <div className="p-4 pt-0">
                                            <button
                                                onClick={() => handleCancel(booking.id)}
                                                disabled={actionLoading === booking.id}
                                                className="w-full py-3 border border-error-light bg-error-lighter rounded-xl font-medium text-error disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {actionLoading === booking.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Ban className="w-4 h-4" />
                                                        Annuler la réservation
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
