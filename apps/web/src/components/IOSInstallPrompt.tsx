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
            <div 
                className="absolute inset-0 bg-black/50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md bg-white rounded-t-3xl p-6 transition-transform duration-300 ${
                    isExiting ? 'translate-y-full' : 'translate-y-0'
                }`}
                style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
            >
                {/* Close button */}
                <button
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
                    onClick={handleClose}
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Title */}
                <h2 className="text-xl font-bold text-center mb-6 pr-8">
                    Installer AirbnBark
                </h2>

                {/* Instructions */}
                <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-[#3B82F6] rounded-xl flex items-center justify-center shrink-0">
                            <Share className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">1. Appuyez sur Partager</p>
                            <p className="text-sm text-gray-500">En bas de Safari</p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-[#3B82F6] rounded-xl flex items-center justify-center shrink-0">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">2. Sur l'écran d'accueil</p>
                            <p className="text-sm text-gray-500">Faites défiler et appuyez</p>
                        </div>
                    </div>

                    {/* Step 3 - App icon preview */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-[#3B82F6] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                            <img src="/logo-white.svg" alt="AirbnBark" className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">3. Appuyez sur Ajouter</p>
                            <p className="text-sm text-gray-500">En haut à droite</p>
                        </div>
                    </div>
                </div>

                {/* Button */}
                <button
                    className="btn-primary btn-full btn-lg rounded-xl mt-6"
                    onClick={handleClose}
                >
                    J'ai compris
                </button>
            </div>
        </div>
    );
};
