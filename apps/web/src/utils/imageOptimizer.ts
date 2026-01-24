/**
 * ==================== IMAGE OPTIMIZER ====================
 * Utilitaires pour optimiser les URLs d'images
 */

/**
 * Optimise une URL d'image Unsplash pour de meilleures performances
 * - Ajoute le format WebP
 * - Ajuste la qualité
 * - Redimensionne si nécessaire
 */
export const optimizeImageUrl = (url: string, width = 800): string => {
    if (!url) return url;
    
    // Si c'est une image Unsplash
    if (url.includes('images.unsplash.com')) {
        const separator = url.includes('?') ? '&' : '?';
        // Ajoute format WebP, qualité 80, et largeur optimisée
        return `${url}${separator}fm=webp&q=80&w=${width}&fit=crop`;
    }
    
    // Si c'est randomuser.me (avatars)
    if (url.includes('randomuser.me')) {
        // Ces images sont déjà optimisées
        return url;
    }
    
    return url;
};

/**
 * Génère un srcset pour les images responsives
 */
export const generateSrcSet = (url: string): string => {
    if (!url || !url.includes('images.unsplash.com')) return '';
    
    const sizes = [400, 800, 1200];
    return sizes
        .map(w => `${optimizeImageUrl(url, w)} ${w}w`)
        .join(', ');
};
