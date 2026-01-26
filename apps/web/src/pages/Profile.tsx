import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Camera, Dog, Home, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BottomNavbar } from '../components/BottomNavbar';
import { api } from '../services/api';
import type { Language } from '../types/api.types';

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

export const Profile = ({
    onTabChange,
    onBecomeHost,
    onGoToHostDashboard,
    isHostMode = false,
    onSwitchToGuest,
}: ProfileProps) => {
    const { user, becomeHost, logout, openAuthModal, updateAvatar, updateLanguage } = useAuth();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

    const [showLanguages, setShowLanguages] = useState(false);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('english');
    const [languageError, setLanguageError] = useState<string | null>(null);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [email, setEmail] = useState(user?.email ?? '');
    const [tempEmail, setTempEmail] = useState(user?.email ?? '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

    const selectLanguage = async (languageCode: string) => {
        setSelectedLanguageCode(languageCode);
        setLanguageError(null);
        setShowLanguages(false);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);

        if (user) {
            const result = await updateLanguage(languageCode);
            if (!result.success) {
                setLanguageError(result.error || 'Erreur lors de la mise a jour de la langue');
            }
        }
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
        if (tempPassword.length >= 6 && currentPassword.length > 0) {
            setPasswordError(null);
            const response = await api.auth.changePassword(currentPassword, tempPassword);
            if (response.success) {
                setCurrentPassword('');
                setTempPassword('');
                setIsEditingPassword(false);
            } else {
                setPasswordError(response.error.message);
            }
        }
    };

    const handleCancelPassword = () => {
        setCurrentPassword('');
        setTempPassword('');
        setPasswordError(null);
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
                console.error("Erreur lors de la sauvegarde de l'avatar:", result.error);
            }
        };
        reader.readAsDataURL(file);
    };

    // Charger l'avatar de l'utilisateur au démarrage ou reset si déconnexion
    useEffect(() => {
        if (user?.avatar) {
            setProfileImageUrl(user.avatar);
        } else if (!user) {
            // Reset quand l'utilisateur se déconnecte
            setProfileImageUrl(null);
        }
    }, [user, user?.avatar]);

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

    useEffect(() => {
        if (user?.language) {
            setSelectedLanguageCode(user.language);
            localStorage.setItem(LANGUAGE_STORAGE_KEY, user.language);
            return;
        }

        const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage) {
            setSelectedLanguageCode(storedLanguage);
        }
    }, [user?.language]);

    useEffect(() => {
        const loadLanguages = async () => {
            const response = await api.meta.getLanguages();
            if (response.success) {
                setLanguages(response.data);
            }
        };
        loadLanguages();
    }, []);

    useEffect(() => {
        if (languages.length && !languages.find((lang) => lang.code === selectedLanguageCode)) {
            setSelectedLanguageCode(languages[0].code);
        }
    }, [languages, selectedLanguageCode]);

    const displayName = user?.pseudo ?? 'Mon Toutou';
    const selectedLanguageLabel =
        languages.find((lang) => lang.code === selectedLanguageCode)?.label ?? selectedLanguageCode;

    return (
        <div className="fixed inset-0 bg-page flex flex-col">
            <div
                className="shrink-0 flex items-center justify-center px-4 py-4 bg-white border-b border-(--color-border-light)"
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
                                <div className="w-28 h-28 rounded-full bg-tertiary border-4 border-white shadow-lg flex items-center justify-center">
                                    <Dog className="w-12 h-12 text-tertiary" />
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
                                className="absolute bottom-0 right-0 w-9 h-9 bg-brand rounded-full flex items-center justify-center border-3 border-white shadow-md"
                            >
                                <Camera className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        <h2 className="text-xl font-semibold">{displayName}</h2>
                        <span className="text-secondary text-sm">Toutou voyageur</span>
                    </div>

                    <div className="flex items-center justify-center gap-8 pt-4 border-t border-(--color-border-light)">
                        <div className="text-center">
                            <p className="text-h3 font-semibold">0</p>
                            <p className="text-caption text-secondary">voyages</p>
                        </div>
                        <div className="w-px h-8 bg-(--color-border-light)" />
                        <div className="text-center">
                            <p className="text-h3 font-semibold">0</p>
                            <p className="text-caption text-secondary">avis</p>
                        </div>
                        <div className="w-px h-8 bg-(--color-border-light)" />
                        <div className="text-center">
                            <p className="text-h3 font-semibold">2026</p>
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
                                className="text-sm text-brand font-medium"
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
                                className="input-field"
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
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg"
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
                                className="text-sm text-brand font-medium"
                            >
                                Modifier
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-secondary">
                                    Mot de passe actuel
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Votre mot de passe actuel"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-secondary">
                                    Nouveau mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={tempPassword}
                                    onChange={(e) => setTempPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Minimum 6 caractères"
                                />
                            </div>
                            {passwordError && <p className="text-sm text-error">{passwordError}</p>}
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancelPassword}
                                    className="px-4 py-2 text-sm font-medium text-secondary"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSavePassword}
                                    disabled={
                                        tempPassword.length < 6 || currentPassword.length === 0
                                    }
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg disabled:opacity-50"
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
                                {selectedLanguageLabel}
                            </p>
                        </div>
                        <ChevronDown
                            className={`w-5 h-5 text-secondary transition-transform ${showLanguages ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {showLanguages && (
                        <div className="mt-4 pt-4 border-t border-(--color-border-light) space-y-1">
                            {languages.map((language) => (
                                <button
                                    key={language.code}
                                    onClick={() => selectLanguage(language.code)}
                                    className={`w-full flex items-center justify-between py-3 px-2 rounded-lg ${
                                        selectedLanguageCode === language.code
                                            ? 'bg-brand-lighter'
                                            : ''
                                    }`}
                                >
                                    <span className="text-body">{language.label}</span>
                                    {selectedLanguageCode === language.code && (
                                        <Check className="w-5 h-5 text-brand" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                    {languageError && <p className="mt-3 text-sm text-warning">{languageError}</p>}
                </div>

                {/* Section Devenir Hote - toujours affiché si pas hôte */}
                {!user?.isHost && (
                    <div className="mx-4 mt-4 bg-warning-lighter rounded-2xl shadow-sm p-4 border border-(--color-warning-light)">
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
                            <div className="w-12 h-12 bg-warning-light rounded-xl flex items-center justify-center">
                                <Home className="w-6 h-6 text-warning" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-body-md font-semibold">Devenir un hote</p>
                                <p className="text-sm text-secondary">
                                    Propose ta niche aux toutous voyageurs
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-secondary" />
                        </button>
                    </div>
                )}

                {/* Badge Hote si deja hote */}
                {user?.isHost && (
                    <div className="mx-4 mt-4 bg-success-lighter rounded-2xl shadow-sm p-4 border border-(--color-success-light)">
                        {isHostMode ? (
                            /* En mode hôte → bouton pour passer en mode voyageur */
                            <button
                                onClick={onSwitchToGuest}
                                className="w-full flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center">
                                    <Dog className="w-6 h-6 text-brand" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-body-md font-semibold text-(--color-primary-dark)">
                                        Mode voyageur
                                    </p>
                                    <p className="text-sm text-brand">
                                        Retourne renifler des niches !
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-brand" />
                            </button>
                        ) : (
                            /* En mode voyageur → bouton pour passer en mode hôte */
                            <button
                                onClick={onGoToHostDashboard}
                                className="w-full flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-success-light rounded-xl flex items-center justify-center">
                                    <Check className="w-6 h-6 text-success" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-body-md font-semibold text-(--color-success-dark)">
                                        Tu es hote
                                    </p>
                                    <p className="text-sm text-success">Accede a ton espace hote</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-success" />
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
                            className="w-full py-3 text-error font-medium text-center"
                        >
                            Se deconnecter
                        </button>
                    ) : (
                        <button onClick={openAuthModal} className="btn-primary btn-full">
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
