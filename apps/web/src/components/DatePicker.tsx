import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * ==================== DATE PICKER ====================
 * Calendrier style Airbnb pour sélection de dates
 * - Navigation mois par mois
 * - Sélection check-in / check-out
 * - Dates passées désactivées
 * - Swipe down pour fermer
 */

interface DatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    checkIn: string | null;
    checkOut: string | null;
    onDateSelect: (checkIn: string | null, checkOut: string | null) => void;
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
];

export const DatePicker = ({
    isOpen,
    onClose,
    checkIn,
    checkOut,
    onDateSelect,
}: DatePickerProps) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectingType, setSelectingType] = useState<'checkIn' | 'checkOut'>('checkIn');

    // Local state pour les dates pendant la sélection
    const [localCheckIn, setLocalCheckIn] = useState<string | null>(checkIn);
    const [localCheckOut, setLocalCheckOut] = useState<string | null>(checkOut);

    // Swipe to close
    const [swipeY, setSwipeY] = useState(0);
    const touchStartRef = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartRef.current === null) return;
        const deltaY = e.touches[0].clientY - touchStartRef.current;
        if (deltaY > 0) {
            setSwipeY(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (swipeY > 100) {
            onClose();
        }
        setSwipeY(0);
        touchStartRef.current = null;
    };

    // Générer les jours du mois
    const daysInMonth = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysCount = lastDay.getDate();

        // Jour de début (0 = dimanche, on veut 0 = lundi)
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const days: (Date | null)[] = [];

        // Jours vides avant le 1er
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Jours du mois
        for (let i = 1; i <= daysCount; i++) {
            days.push(new Date(currentYear, currentMonth, i));
        }

        return days;
    }, [currentMonth, currentYear]);

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDate = (dateStr: string | null): Date | null => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const isDateDisabled = (date: Date): boolean => {
        // Dates passées désactivées (sauf si c'est le checkIn sélectionné)
        const dateStr = formatDate(date);
        if (dateStr === localCheckIn) return false; // Le checkIn n'est jamais disabled

        if (date < today) return true;

        return false;
    };

    const isDateSelected = (date: Date): 'checkIn' | 'checkOut' | 'inRange' | null => {
        const dateStr = formatDate(date);

        if (localCheckIn === dateStr) return 'checkIn';
        if (localCheckOut === dateStr) return 'checkOut';

        // Dans la plage
        if (localCheckIn && localCheckOut) {
            const checkInDate = parseDate(localCheckIn);
            const checkOutDate = parseDate(localCheckOut);
            if (checkInDate && checkOutDate && date > checkInDate && date < checkOutDate) {
                return 'inRange';
            }
        }

        return null;
    };

    const handleDateClick = (date: Date) => {
        if (isDateDisabled(date)) return;

        const dateStr = formatDate(date);

        // Si les deux dates sont déjà sélectionnées, recommencer avec nouvelle arrivée
        if (localCheckIn && localCheckOut) {
            setLocalCheckIn(dateStr);
            setLocalCheckOut(null);
            setSelectingType('checkOut');
            return;
        }

        // Si on a seulement un checkout sans checkin, ou si on clique sur une date
        // et qu'on n'a pas de checkin -> cette date devient l'arrivée
        if (!localCheckIn) {
            setLocalCheckIn(dateStr);
            // Si checkout existe et est avant ou égal au nouveau checkin, le reset
            if (localCheckOut && parseDate(localCheckOut)! <= date) {
                setLocalCheckOut(null);
            }
            setSelectingType('checkOut');
            return;
        }

        // Si on est en mode checkOut mais qu'on clique sur une date avant/égale au checkIn
        // => ça devient la nouvelle date d'arrivée
        if (selectingType === 'checkOut' && localCheckIn) {
            const checkInDate = parseDate(localCheckIn);
            if (checkInDate && date <= checkInDate) {
                setLocalCheckIn(dateStr);
                setLocalCheckOut(null);
                setSelectingType('checkOut');
                return;
            }
        }

        if (selectingType === 'checkIn') {
            setLocalCheckIn(dateStr);
            // Si check-out existe et est avant le nouveau check-in, le reset
            if (localCheckOut && parseDate(localCheckOut)! <= date) {
                setLocalCheckOut(null);
            }
            setSelectingType('checkOut');
        } else {
            setLocalCheckOut(dateStr);
        }
    };

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleConfirm = () => {
        onDateSelect(localCheckIn, localCheckOut);
        onClose();
    };

    const handleClear = () => {
        setLocalCheckIn(null);
        setLocalCheckOut(null);
        setSelectingType('checkIn');
    };

    // Vérifier si on peut aller au mois précédent
    const canGoPrev =
        currentYear > today.getFullYear() ||
        (currentYear === today.getFullYear() && currentMonth > today.getMonth());

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-250 flex items-end justify-center bg-black/50 touch-none"
            onClick={onClose}
        >
            <div
                className="relative w-full max-h-[90vh] bg-white rounded-t-3xl overflow-hidden flex flex-col touch-none"
                onClick={(e) => e.stopPropagation()}
                style={{
                    animation: swipeY === 0 ? 'slideUp 0.3s ease-out' : 'none',
                    transform: `translateY(${swipeY}px)`,
                    transition: swipeY === 0 ? 'transform 0.2s ease-out' : 'none',
                }}
            >
                {/* Swipe indicator + Header - zone de swipe pour fermer */}
                <div
                    className="touch-auto"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 bg-tertiary rounded-full" />
                    </div>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-(--color-border-light)">
                        <button className="btn-icon" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </button>
                        <span className="text-body-md">Sélectionner les dates</span>
                        <button className="text-body-sm underline" onClick={handleClear}>
                            Effacer
                        </button>
                    </div>
                </div>

                {/* Indicateurs de sélection */}
                <div className="flex gap-3 p-4 border-b border-(--color-border-light) touch-auto">
                    <button
                        className={`flex-1 p-3 rounded-xl border-2 transition-colors ${
                            selectingType === 'checkIn'
                                ? 'border-(--color-primary) bg-(--color-bg-secondary)'
                                : 'border-(--color-border)'
                        }`}
                        onClick={() => setSelectingType('checkIn')}
                    >
                        <p className="text-caption text-secondary">Arrivée</p>
                        <p className="text-body-md font-medium">
                            {localCheckIn
                                ? new Date(localCheckIn + 'T00:00:00').toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                  })
                                : 'Ajouter'}
                        </p>
                    </button>
                    <button
                        className={`flex-1 p-3 rounded-xl border-2 transition-colors ${
                            selectingType === 'checkOut'
                                ? 'border-(--color-primary) bg-(--color-bg-secondary)'
                                : 'border-(--color-border)'
                        }`}
                        onClick={() => setSelectingType('checkOut')}
                    >
                        <p className="text-caption text-secondary">Départ</p>
                        <p className="text-body-md font-medium">
                            {localCheckOut
                                ? new Date(localCheckOut + 'T00:00:00').toLocaleDateString(
                                      'fr-FR',
                                      { day: 'numeric', month: 'short' }
                                  )
                                : 'Ajouter'}
                        </p>
                    </button>
                </div>

                {/* Navigation mois */}
                <div className="flex items-center justify-between p-4">
                    <button
                        className={`btn-icon ${!canGoPrev ? 'opacity-30 pointer-events-none' : ''}`}
                        onClick={goToPrevMonth}
                        disabled={!canGoPrev}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-h3">
                        {MONTHS[currentMonth]} {currentYear}
                    </span>
                    <button className="btn-icon" onClick={goToNextMonth}>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Jours de la semaine */}
                <div className="grid grid-cols-7 px-4">
                    {DAYS.map((day) => (
                        <div key={day} className="text-center text-caption text-secondary py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grille des jours */}
                <div className="grid grid-cols-7 gap-1 px-4 pb-4">
                    {daysInMonth.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                        }

                        const disabled = isDateDisabled(date);
                        const selectedState = isDateSelected(date);
                        const isToday = formatDate(date) === formatDate(today);

                        let className =
                            'aspect-square flex items-center justify-center rounded-full text-body-sm transition-colors ';

                        if (disabled) {
                            className += 'text-(--color-border) cursor-not-allowed';
                        } else if (selectedState === 'checkIn' || selectedState === 'checkOut') {
                            // Dates sélectionnées en bleu (primary)
                            className += 'bg-(--color-primary) text-white font-medium';
                        } else if (selectedState === 'inRange') {
                            // Dates entre check-in et check-out en gris
                            className += 'bg-(--color-bg-secondary) text-(--color-text-primary)';
                        } else if (isToday) {
                            className +=
                                'border-2 border-(--color-primary) text-(--color-primary) font-medium cursor-pointer';
                        } else {
                            className += 'hover:bg-(--color-bg-secondary) cursor-pointer';
                        }

                        return (
                            <button
                                key={formatDate(date)}
                                className={className}
                                onClick={() => handleDateClick(date)}
                                disabled={disabled}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div
                    className="p-4 border-t border-(--color-border-light)"
                    style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
                >
                    <button className="btn-primary btn-full" onClick={handleConfirm}>
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
};
