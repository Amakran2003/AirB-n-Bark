/**
 * ==================== DATE FORMATTERS ====================
 * Utilitaires de formatage de dates réutilisables
 */

/**
 * Formate une heure simple
 * Ex: "14:30"
 */
export const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formate une date pour afficher le temps relatif ou l'heure
 * Ex: "14:30", "Hier", "Lun", "25 janv."
 */
export const formatMessageTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
        return 'Hier';
    } else if (days < 7) {
        return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
};

/**
 * Formate une date courte
 * Ex: "25 janv."
 */
export const formatDateShort = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
    });
};

/**
 * Formate une plage de dates
 * Ex: "25 janv. - 30 janv. 2026"
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
    const start = formatDateShort(startDate);
    const end = formatDateShort(endDate);
    const endYear = new Date(endDate + 'T00:00:00').getFullYear();
    return `${start} - ${end} ${endYear}`;
};

/**
 * Formate une date complète
 * Ex: "Lundi 25 janvier 2026"
 */
export const formatDateFull = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

/**
 * Calcule le nombre de nuits entre deux dates
 */
export const calculateNights = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

/**
 * Vérifie si une date est dans le passé
 */
export const isPast = (dateStr: string): boolean => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
};
