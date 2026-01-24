import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Camera, Dog, Home, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BottomNavbar } from '../components/BottomNavbar';

/**
 * ==================== PAGE PROFIL ====================
 * Profil du toutou sur AirB'n'Bark
 * 
 * TODO API:
 * - GET /api/users/:id/profile → recuperer les donnees du profil
 * - PUT /api/users/:id/profile → mettre a jour le profil
 * - POST /api/users/:id/avatar → upload de la photo de profil
 * - PUT /api/users/:id/password → changer le mot de passe
 * - PUT /api/users/:id/languages → mettre a jour les langues
 */

interface ProfileProps {
    onTabChange?: (tab: 'home' | 'trips' | 'messages' | 'profile') => void;
    onBecomeHost?: () => void;
    onGoToHostDashboard?: () => void;
    isHostMode?: boolean;
    onSwitchToGuest?: () => void;
}

export const Profile = ({ onTabChange, onBecomeHost, onGoToHostDashboard, isHostMode = false, onSwitchToGuest }: ProfileProps) => {
    const { user, becomeHost, logout, openAuthModal, updateAvatar } = useAuth();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    
    const [showLanguages, setShowLanguages] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('Français');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [email, setEmail] = useState(user?.email ?? '');
    const [tempEmail, setTempEmail] = useState(user?.email ?? '');
    const [tempPassword, setTempPassword] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

    const languages = ['Français', 'English', 'Español', 'Deutsch'];

    const selectLanguage = (language: string) => {
        setSelectedLanguage(language);
        // TODO: Changer la langue de l'app
        setShowLanguages(false);
    };

    const handleSaveEmail = async () => {
        // TODO: PUT /api/users/:id/profile { email: tempEmail }
        setEmail(tempEmail);
        setIsEditingEmail(false);
    };

    const handleCancelEmail = () => {
        setTempEmail(email);
        setIsEditingEmail(false);
    };

    const handleSavePassword = async () => {
        if (tempPassword.length >= 6) {
            // TODO: PUT /api/users/:id/password { password: tempPassword }
            setTempPassword('');
            setIsEditingPassword(false);
        }
    };

    const handleCancelPassword = () => {
        setTempPassword('');
        setIsEditingPassword(false);
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Convertir en base64 pour stockage
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Url = e.target?.result as string;
            
            // Mettre à jour localement d'abord pour feedback immédiat
            setProfileImageUrl((prevUrl) => {
                if (prevUrl?.startsWith('blob:')) {
                    URL.revokeObjectURL(prevUrl);
                }
                return base64Url;
            });
            
            // Sauvegarder via l'API
            const result = await updateAvatar(base64Url);
            if (!result.success) {
                console.error('Erreur lors de la sauvegarde de l\'avatar:', result.error);
            }
        };
        reader.readAsDataURL(file);
    };

    // Charger l'avatar de l'utilisateur au démarrage
    useEffect(() => {
        if (user?.avatar && !profileImageUrl) {
            setProfileImageUrl(user.avatar);
        }
    }, [user?.avatar]);

    useEffect(() => {
        return () => {
            if (profileImageUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(profileImageUrl);
            }
        };
    }, [profileImageUrl]);

    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
            setTempEmail(user.email);
        }
    }, [user?.email]);

    const displayName = user?.pseudo ?? 'Mon Toutou';

    return (
        <div className="fixed inset-0 bg-[#f7f7f7] flex flex-col">
            <div 
                className="shrink-0 flex items-center justify-center px-4 py-4 bg-white border-b border-[#ebebeb]"
                style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
            >
                <h1 className="text-h2">Mon Profil</h1>
            </div>

            <div 
                className="flex-1 overflow-y-auto"
                style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
            >
                <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative mb-4">
                            {profileImageUrl ? (
                                <img
                                    src={profileImageUrl}
                                    alt="Photo de profil"
                                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                                    <Dog className="w-12 h-12 text-gray-400" />
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                            <button 
                                onClick={handlePhotoClick}
                                className="absolute bottom-0 right-0 w-9 h-9 bg-[#3B82F6] rounded-full flex items-center justify-center border-3 border-white shadow-md"
                            >
                                <Camera className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        <h2 className="text-xl font-semibold">{displayName}</h2>
                        <span className="text-secondary text-sm">Toutou voyageur</span>
                    </div>

                    <div className="flex items-center justify-center gap-8 pt-4 border-t border-[#ebebeb]">
                        <div className="text-center">
                            <p className="text-xl font-semibold">0</p>
                            <p className="text-caption text-secondary">voyages</p>
                        </div>
                        <div className="w-px h-8 bg-[#ebebeb]" />
                        <div className="text-center">
                            <p className="text-xl font-semibold">0</p>
                            <p className="text-caption text-secondary">avis</p>
                        </div>
                        <div className="w-px h-8 bg-[#ebebeb]" />
                        <div className="text-center">
                            <p className="text-xl font-semibold">2026</p>
                            <p className="text-caption text-secondary">membre depuis</p>
                        </div>
                    </div>
                </div>

                <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
                    {!isEditingEmail ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-body-md font-medium">Email</p>
                                <p className="text-sm text-secondary">{email || 'Non renseigné'}</p>
                            </div>
                            <button
                                onClick={() => setIsEditingEmail(true)}
                                className="text-sm text-[#3B82F6] font-medium"
                            >
                                Modifier
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-sm text-secondary">Email</label>
                            <input
                                type="email"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-[#ebebeb] rounded-xl text-body focus:outline-none focus:border-[#3B82F6]"
                                placeholder="ton@email.com"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancelEmail}
                                    className="px-4 py-2 text-sm font-medium text-secondary"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSaveEmail}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#3B82F6] rounded-lg"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
                    {!isEditingPassword ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-body-md font-medium">Mot de passe</p>
                                <p className="text-sm text-secondary">••••••••</p>
                            </div>
                            <button
                                onClick={() => setIsEditingPassword(true)}
                                className="text-sm text-[#3B82F6] font-medium"
                            >
                                Modifier
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-sm text-secondary">Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={tempPassword}
                                onChange={(e) => setTempPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-[#ebebeb] rounded-xl text-body focus:outline-none focus:border-[#3B82F6]"
                                placeholder="Minimum 6 caractères"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancelPassword}
                                    className="px-4 py-2 text-sm font-medium text-secondary"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSavePassword}
                                    disabled={tempPassword.length < 6}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#3B82F6] rounded-lg disabled:opacity-50"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4">
                    <button
                        onClick={() => setShowLanguages(!showLanguages)}
                        className="w-full flex items-center justify-between"
                    >
                        <div>
                            <p className="text-body-md font-medium text-left">Langue de l'app</p>
                            <p className="text-sm text-secondary text-left">
                                {selectedLanguage}
                            </p>
                        </div>
                        <ChevronDown 
                            className={`w-5 h-5 text-secondary transition-transform ${showLanguages ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {showLanguages && (
                        <div className="mt-4 pt-4 border-t border-[#ebebeb] space-y-1">
                            {languages.map((language) => (
                                <button 
                                    key={language}
                                    onClick={() => selectLanguage(language)}
                                    className={`w-full flex items-center justify-between py-3 px-2 rounded-lg ${
                                        selectedLanguage === language ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <span className="text-body">{language}</span>
                                    {selectedLanguage === language && (
                                        <Check className="w-5 h-5 text-blue-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section Devenir Hote - toujours affiché si pas hôte */}
                {!user?.isHost && (
                    <div className="mx-4 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-sm p-4 border border-amber-200">
                        <button
                            onClick={() => {
                                if (!user) {
                                    // Pas connecté → ouvrir modal de connexion
                                    openAuthModal();
                                } else {
                                    // Connecté → devenir hôte
                                    becomeHost();
                                    onBecomeHost?.();
                                }
                            }}
                            className="w-full flex items-center gap-4"
                        >
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Home className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-body-md font-semibold">Devenir un hote</p>
                                <p className="text-sm text-secondary">Propose ta niche aux toutous voyageurs</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-secondary" />
                        </button>
                    </div>
                )}

                {/* Badge Hote si deja hote */}
                {user?.isHost && (
                    <div className="mx-4 mt-4 bg-green-50 rounded-2xl shadow-sm p-4 border border-green-200">
                        {isHostMode ? (
                            /* En mode hôte → bouton pour passer en mode voyageur */
                            <button 
                                onClick={onSwitchToGuest}
                                className="w-full flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Dog className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-body-md font-semibold text-blue-700">Mode voyageur</p>
                                    <p className="text-sm text-blue-600">Trouve une niche pour ton toutou</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-blue-600" />
                            </button>
                        ) : (
                            /* En mode voyageur → bouton pour passer en mode hôte */
                            <button 
                                onClick={onGoToHostDashboard}
                                className="w-full flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Check className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-body-md font-semibold text-green-700">Tu es hote</p>
                                    <p className="text-sm text-green-600">Accede a ton espace hote</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-green-600" />
                            </button>
                        )}
                    </div>
                )}

                <div className="mx-4 mt-4 mb-4">
                    {user ? (
                        <button 
                            onClick={() => {
                                logout();
                            }}
                            className="w-full py-3 text-red-500 font-medium text-center"
                        >
                            Se deconnecter
                        </button>
                    ) : (
                        <button 
                            onClick={openAuthModal}
                            className="btn-primary btn-full"
                        >
                            Se connecter
                        </button>
                    )}
                </div>
            </div>

            {/* BottomNavbar seulement en mode voyageur */}
            {!isHostMode && <BottomNavbar activeTab="profile" onTabChange={onTabChange} />}
        </div>
    );
};
