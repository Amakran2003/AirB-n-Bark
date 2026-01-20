import { useState } from 'react';
import { ChevronLeft, Calendar, Dog, Users, Clock, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ListingCardData } from '../data/listings';

/**
 * ==================== BOOKING RECAP ====================
 * Page de récap de réservation avant authentification
 * - Affiche les infos de l'annonce
 * - Sélection des dates
 * - Bouton Next → Auth si pas connecté
 */

interface BookingRecapProps {
    listing: ListingCardData;
    onBack: () => void;
    onConfirm: () => void;
}

export const BookingRecap = ({ listing, onBack, onConfirm }: BookingRecapProps) => {
    const { isAuthenticated, openAuthModal } = useAuth();
    
    // Dates mockées pour la démo
    const [checkIn] = useState('24 Jan 2026');
    const [checkOut] = useState('27 Jan 2026');
    const nights = 3;

    const handleNext = () => {
        if (!isAuthenticated) {
            openAuthModal();
        } else {
            onConfirm();
        }
    };

    const totalPrice = listing.price * nights;
    const serviceFee = Math.round(totalPrice * 0.12);
    const total = totalPrice + serviceFee;

    return (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#ebebeb]">
                <button className="btn-icon" onClick={onBack}>
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-body-md">Confirmer la réservation</span>
                <div className="w-10" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Listing preview */}
                <div className="flex gap-4 pb-6 border-b border-[#ebebeb]">
                    <img 
                        src={listing.image} 
                        alt={listing.title}
                        className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                        <p className="text-caption text-secondary">{listing.subtitle}</p>
                        <h3 className="text-body-md mt-1">{listing.title}</h3>
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-body-sm">★ {listing.rating}</span>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="py-6 border-b border-[#ebebeb]">
                    <h2 className="text-h3 mb-4">Votre séjour</h2>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 icon-secondary" />
                                <div>
                                    <p className="text-body-md">Dates</p>
                                    <p className="text-caption text-secondary">{checkIn} → {checkOut}</p>
                                </div>
                            </div>
                            <button className="text-body-sm underline">Modifier</button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Dog className="w-5 h-5 icon-secondary" />
                                <div>
                                    <p className="text-body-md">Voyageur</p>
                                    <p className="text-caption text-secondary">1 chien</p>
                                </div>
                            </div>
                            <button className="text-body-sm underline">Modifier</button>
                        </div>
                    </div>
                </div>

                {/* Price details */}
                <div className="py-6 border-b border-[#ebebeb]">
                    <h2 className="text-h3 mb-4">Détails du prix</h2>
                    
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-body">€{listing.price} x {nights} nuits</span>
                            <span className="text-body">€{totalPrice}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-body">Frais de service</span>
                            <span className="text-body">€{serviceFee}</span>
                        </div>
                    </div>
                </div>

                {/* Total */}
                <div className="py-6">
                    <div className="flex items-center justify-between">
                        <span className="text-h3">Total</span>
                        <span className="text-h3">€{total}</span>
                    </div>
                </div>

                {/* Infos */}
                <div className="card flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#16a34a] shrink-0 mt-0.5" />
                        <p className="text-body-sm">Annulation gratuite avant le 22 Jan</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 icon-secondary shrink-0 mt-0.5" />
                        <p className="text-body-sm">Check-in à partir de 14h00</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 icon-secondary shrink-0 mt-0.5" />
                        <p className="text-body-sm">Hébergé par {listing.hostName}</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div 
                className="p-4 border-t border-[#ebebeb] bg-white"
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
            >
                <button 
                    className="btn-primary btn-full btn-lg"
                    onClick={handleNext}
                >
                    Next
                </button>
            </div>
        </div>
    );
};
