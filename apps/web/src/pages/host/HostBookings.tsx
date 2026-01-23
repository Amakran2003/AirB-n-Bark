import { useState } from 'react';
import { 
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    MessageCircle,
    Dog
} from 'lucide-react';

/**
 * ==================== HOST BOOKINGS ====================
 * Page pour voir et gerer les reservations recues
 * - Onglets: En attente, Confirmees, Passees, Annulees
 * - Actions: Accepter, Refuser, Contacter
 * 
 * TODO API:
 * - GET /api/host/bookings?status=pending → reservations en attente
 * - GET /api/host/bookings?status=confirmed → reservations confirmees
 * - GET /api/host/bookings?status=completed → reservations passees
 * - GET /api/host/bookings?status=cancelled → reservations annulees
 * - POST /api/host/bookings/:id/accept → accepter une reservation
 * - POST /api/host/bookings/:id/decline → refuser une reservation
 */

interface Booking {
    id: string;
    guestName: string;
    guestAvatar: string;
    dogName: string;
    dogBreed: string;
    dogSize: 'small' | 'medium' | 'large';
    listingTitle: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    createdAt: string;
}

interface HostBookingsProps {
    onMessage: (guestId: string) => void;
}

type TabType = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const HostBookings = ({ onMessage }: HostBookingsProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    
    // Mock data - TODO: GET /api/host/bookings
    const [bookings, setBookings] = useState<Booking[]>([]);

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'pending', label: 'En attente', icon: Clock },
        { id: 'confirmed', label: 'Confirmees', icon: CheckCircle },
        { id: 'completed', label: 'Passees', icon: Calendar },
        { id: 'cancelled', label: 'Annulees', icon: XCircle },
    ];

    const filteredBookings = bookings.filter(b => b.status === activeTab);

    const handleAccept = (bookingId: string) => {
        // TODO: POST /api/host/bookings/:id/accept
        setBookings(prev => 
            prev.map(b => b.id === bookingId ? { ...b, status: 'confirmed' as const } : b)
        );
    };

    const handleDecline = (bookingId: string) => {
        // TODO: POST /api/host/bookings/:id/decline
        if (confirm('Refuser cette reservation ?')) {
            setBookings(prev => 
                prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b)
            );
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const getDogSizeLabel = (size: string) => {
        switch (size) {
            case 'small': return 'Petit';
            case 'medium': return 'Moyen';
            case 'large': return 'Grand';
            default: return size;
        }
    };

    return (
        <div className="fixed inset-0 bg-[#f7f7f7] flex flex-col">
            {/* Header */}
            <div 
                className="shrink-0 px-4 py-4 bg-white border-b border-[#ebebeb]"
                style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
            >
                <h1 className="text-h2 mb-4">Réservations</h1>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                    {tabs.map(tab => {
                        const count = bookings.filter(b => b.status === tab.id).length;
                        const Icon = tab.icon;
                        return (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-secondary'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                                        activeTab === tab.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-200'
                                    }`}>
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
                {filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-h3 mb-2">
                            {activeTab === 'pending' && 'Aucune demande'}
                            {activeTab === 'confirmed' && 'Aucune reservation'}
                            {activeTab === 'completed' && 'Aucun historique'}
                            {activeTab === 'cancelled' && 'Aucune annulation'}
                        </h2>
                        <p className="text-body text-secondary">
                            {activeTab === 'pending' && 'Les nouvelles demandes apparaitront ici'}
                            {activeTab === 'confirmed' && 'Les reservations confirmees apparaitront ici'}
                            {activeTab === 'completed' && 'Les reservations passees apparaitront ici'}
                            {activeTab === 'cancelled' && 'Les reservations annulees apparaitront ici'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map(booking => (
                            <div 
                                key={booking.id}
                                className="bg-white rounded-2xl shadow-sm overflow-hidden"
                            >
                                {/* Guest info */}
                                <div className="flex items-center gap-3 p-4 border-b border-[#ebebeb]">
                                    <img 
                                        src={booking.guestAvatar} 
                                        alt={booking.guestName}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{booking.guestName}</p>
                                        <p className="text-caption text-secondary">
                                            Demande recue le {formatDate(booking.createdAt)}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => onMessage(booking.id)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
                                    >
                                        <MessageCircle className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>

                                {/* Booking details */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Dog className="w-5 h-5 text-secondary" />
                                        <div>
                                            <p className="text-body-md font-medium">{booking.dogName}</p>
                                            <p className="text-caption text-secondary">
                                                {booking.dogBreed} • {getDogSizeLabel(booking.dogSize)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-secondary" />
                                        <p className="text-body">
                                            {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-[#ebebeb]">
                                        <span className="text-secondary">Total</span>
                                        <span className="text-body-md font-bold">{booking.totalPrice}€</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {booking.status === 'pending' && (
                                    <div className="flex gap-3 p-4 pt-0">
                                        <button 
                                            onClick={() => handleDecline(booking.id)}
                                            className="flex-1 py-3 border border-[#ebebeb] rounded-xl font-medium text-secondary"
                                        >
                                            Refuser
                                        </button>
                                        <button 
                                            onClick={() => handleAccept(booking.id)}
                                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium"
                                        >
                                            Accepter
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
