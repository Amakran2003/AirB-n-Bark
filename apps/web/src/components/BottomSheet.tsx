import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useSwipeToClose } from '../hooks/useSwipeToClose';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

/**
 * ==================== BOTTOM SHEET ====================
 * Composant modal réutilisable style iOS/Airbnb
 * - Swipe down pour fermer
 * - Gestion du clavier mobile
 * - Animation d'entrée/sortie
 * - Safe area support
 * 
 * Usage:
 * <BottomSheet isOpen={isOpen} onClose={onClose} title="Mon titre">
 *   <p>Contenu de la modal</p>
 * </BottomSheet>
 */

interface BottomSheetProps {
    /** État d'ouverture de la modal */
    isOpen: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Titre affiché dans le header (optionnel) */
    title?: string;
    /** Élément personnalisé pour le header (remplace title) */
    headerContent?: React.ReactNode;
    /** Contenu de la modal */
    children: React.ReactNode;
    /** Hauteur en pourcentage du viewport (default: 85) */
    heightPercent?: number;
    /** Afficher le bouton X de fermeture (default: true) */
    showCloseButton?: boolean;
    /** Afficher l'indicateur de swipe (default: true) */
    showSwipeIndicator?: boolean;
    /** Activer la gestion du clavier (default: true) */
    handleKeyboard?: boolean;
    /** Classe CSS additionnelle pour le conteneur */
    className?: string;
    /** Footer fixe en bas de la modal */
    footer?: React.ReactNode;
}

export const BottomSheet = ({
    isOpen,
    onClose,
    title,
    headerContent,
    children,
    heightPercent = 85,
    showCloseButton = true,
    showSwipeIndicator = true,
    handleKeyboard = true,
    className = '',
    footer,
}: BottomSheetProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    
    // Keyboard handling
    const { viewportHeight, isKeyboardOpen } = useKeyboardHeight({ enabled: isOpen && handleKeyboard });
    
    // Swipe to close
    const { swipeY, handlers } = useSwipeToClose(onClose, { enabled: isOpen });

    // Calculer la hauteur de la modal
    const baseHeight = viewportHeight > 0 ? viewportHeight : window.innerHeight;
    const modalHeight = Math.min(baseHeight * (heightPercent / 100), baseHeight - 20);

    // Reset scroll on open
    useEffect(() => {
        if (isOpen && contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [isOpen]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-200 flex items-end bg-black/50 touch-none"
            onClick={onClose}
        >
            <div
                className={`w-full bg-white rounded-t-3xl overflow-hidden flex flex-col touch-none ${className}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    height: `${modalHeight}px`,
                    maxHeight: `${heightPercent}vh`,
                    animation: swipeY === 0 ? 'slideUp 0.4s ease-out' : 'none',
                    transform: `translateY(${swipeY}px)`,
                    transition: swipeY === 0 ? 'transform 0.3s ease-out' : 'none',
                }}
            >
                {/* Swipe zone + Header */}
                <div className="touch-auto" {...handlers}>
                    {/* Swipe indicator */}
                    {showSwipeIndicator && (
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>
                    )}

                    {/* Header */}
                    <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
                        {showCloseButton ? (
                            <button className="btn-icon" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="w-10" />
                        )}
                        
                        {headerContent ? (
                            headerContent
                        ) : title ? (
                            <h2 className="text-base font-semibold text-primary">{title}</h2>
                        ) : (
                            <div />
                        )}
                        
                        <div className="w-10" />
                    </div>
                </div>

                {/* Content */}
                <div
                    ref={contentRef}
                    className="flex-1 overflow-y-auto touch-auto overscroll-contain"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div
                        className="shrink-0 border-t border-gray-200 bg-white"
                        style={{ 
                            paddingBottom: isKeyboardOpen ? '16px' : 'calc(16px + env(safe-area-inset-bottom))'
                        }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
