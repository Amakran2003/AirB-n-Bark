import { useState } from 'react';
import { Share, Plus, X } from 'lucide-react';

/**
 * ==================== IOS INSTALL PROMPT ====================
 * Modal d'instructions pour installer la PWA sur iOS
 * Safari ne supporte pas le beforeinstallprompt, donc on guide l'utilisateur
 */

interface IOSInstallPromptProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IOSInstallPrompt = ({ isOpen, onClose }: IOSInstallPromptProps) => {
    const [isExiting, setIsExiting] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsExiting(false);
            onClose();
        }, 300);
    };

    return (
        <div
            className={`fixed inset-0 z-[1000] flex items-end justify-center transition-opacity duration-300 ${
                isExiting ? 'opacity-0' : 'opacity-100'
            }`}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md bg-white rounded-t-3xl p-6 transition-transform duration-300 ${
                    isExiting ? 'translate-y-full' : 'translate-y-0'
                }`}
                style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
            >
                {/* Close button */}
                <button
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-tertiary"
                    onClick={handleClose}
                >
                    <X className="w-5 h-5 text-secondary" />
                </button>

                {/* Title */}
                <h2 className="text-xl font-bold text-center mb-6 pr-8">Installer AirbnBark</h2>

                {/* Instructions */}
                <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                        <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shrink-0">
                            <Share className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-primary">1. Appuie sur Partager</p>
                            <p className="text-sm text-secondary">
                                Avec ta patte, en bas de Safari
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                        <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shrink-0">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-primary">2. Sur l'écran d'accueil</p>
                            <p className="text-sm text-secondary">
                                Fais défiler et appuie, c'est pas sorcier !
                            </p>
                        </div>
                    </div>

                    {/* Step 3 - App icon preview */}
                    <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                        <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                            <img src="/logo-white.svg" alt="AirbnBark" className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="font-medium text-primary">3. Appuie sur Ajouter</p>
                            <p className="text-sm text-secondary">
                                Et voilà, t'es un pro du téléphone 🐾
                            </p>
                        </div>
                    </div>
                </div>

                {/* Button */}
                <button className="btn-primary btn-full" onClick={handleClose}>
                    J'ai compris
                </button>
            </div>
        </div>
    );
};
