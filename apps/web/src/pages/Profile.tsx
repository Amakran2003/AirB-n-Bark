import { useEffect, useRef, useState } from 'react';
import { X, ChevronDown, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * ==================== PAGE PROFIL ====================
 * Page profil utilisateur pour AirB'n'Bark
 * Utilise les classes CSS existantes du projet
 */
type ProfileProps = {
    onClose?: () => void;
    displayName?: string;
    commentsCount?: number;
    yearsOnPlatform?: number;
};

export const Profile = ({
    onClose,
    displayName,
    commentsCount = 0,
    yearsOnPlatform = 0,
}: ProfileProps) => {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [showLanguages, setShowLanguages] = useState(false);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Français']);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [email, setEmail] = useState(user?.email ?? 'user@gmail.com');
    const [tempEmail, setTempEmail] = useState(user?.email ?? 'user@gmail.com');
    const [password, setPassword] = useState('••••••••');
    const [tempPassword, setTempPassword] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState(
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop'
    );

    const languages = ['Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien', 'Portugais'];
    const selectedLabel = selectedLanguages.length
        ? selectedLanguages.join(', ')
        : 'Choisir vos langues';

    const toggleLanguage = (language: string) => {
        setSelectedLanguages((prev) =>
            prev.includes(language)
                ? prev.filter((item) => item !== language)
                : [...prev, language]
        );
    };

    const handleSaveEmail = () => {
        setEmail(tempEmail);
        setIsEditingEmail(false);
    };

    const handleCancelEmail = () => {
        setTempEmail(email);
        setIsEditingEmail(false);
    };

    const handleSavePassword = () => {
        if (tempPassword.length >= 6) {
            setPassword('••••••••');
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

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        const nextUrl = URL.createObjectURL(file);
        setProfileImageUrl((prevUrl) => {
            if (prevUrl.startsWith('blob:')) {
                URL.revokeObjectURL(prevUrl);
            }
            return nextUrl;
        });
    };

    useEffect(() => {
        return () => {
            if (profileImageUrl.startsWith('blob:')) {
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

    const resolvedName = displayName ?? user?.pseudo ?? 'Utilisateur';

    return (
        <div className="profile-page">
            {/* Header avec icône X - UTILISE btn-icon existant */}
            <div style={{ padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
                <button
                    className="btn-icon"
                    type="button"
                    aria-label="Fermer"
                    onClick={onClose}
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Carte principale avec photo et infos - UTILISE card existant */}
            <div className="card card-shadow" style={{ 
                margin: '0 16px 16px', 
                padding: '32px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                background: 'white'
            }}>
                {/* Photo de profil du chien - UTILISE avatar-xl existant */}
                <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <div className="avatar avatar-xl" style={{ width: '120px', height: '120px', border: '3px solid white', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                        <img
                            src={profileImageUrl}
                            alt="Photo de profil du chien"
                        />
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                    />
                    <button 
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '36px',
                            height: '36px',
                            backgroundColor: '#ff385c',
                            border: '3px solid white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }}
                        type="button"
                        onClick={handlePhotoClick}
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                </div>

                {/* Nom et badge */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <h1 className="text-h1" style={{ fontSize: '32px', fontWeight: 600, margin: '0 0 4px 0' }}>
                        {resolvedName}
                    </h1>
                    <span className="text-body-md text-secondary">Voyageur</span>
                </div>

                {/* Stats - UTILISE divider existant */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '32px', 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--color-border-light)',
                    width: '100%',
                    justifyContent: 'center'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span className="text-h2">{commentsCount}</span>
                        <span className="text-caption text-secondary">commentaires</span>
                    </div>
                    <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-border-light)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span className="text-h2">{yearsOnPlatform}</span>
                        <span className="text-caption text-secondary">années sur AirB'n'Bark</span>
                    </div>
                </div>
            </div>

            {/* Section Email - UTILISE card et btn existants */}
            <div className="card card-shadow" style={{ margin: '0 16px 16px', padding: '24px', background: 'white' }}>
                {!isEditingEmail ? (
                    <div className="flex flex-between gap-md">
                        <div className="flex-col gap-xs" style={{ flex: 1 }}>
                            <span className="text-body-md">Email : </span>
                            <span className="text-body-sm text-secondary">{email}</span>
                        </div>
                        <button
                            style={{ 
                                fontSize: '14px', 
                                color: 'var(--color-text-primary)', 
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                fontWeight: 500
                            }}
                            type="button"
                            onClick={() => setIsEditingEmail(true)}
                        >
                            Modifier
                        </button>
                    </div>
                ) : (
                    <div className="flex-col gap-md">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            value={tempEmail}
                            onChange={(e) => setTempEmail(e.target.value)}
                            className="input"
                            placeholder="Votre email"
                        />
                        <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                            <button
                                className="btn-secondary btn-sm"
                                type="button"
                                onClick={handleCancelEmail}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn-primary btn-sm"
                                type="button"
                                onClick={handleSaveEmail}
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Section Mot de passe - UTILISE card et btn existants */}
            <div className="card card-shadow" style={{ margin: '0 16px 16px', padding: '24px', background: 'white' }}>
                {!isEditingPassword ? (
                    <div className="flex flex-between gap-md">
                        <div className="flex-col gap-xs" style={{ flex: 1 }}>
                            <span className="text-body-md">Mot de passe : </span>
                            <span className="text-body-sm text-secondary">{password}</span>
                        </div>
                        <button
                            style={{ 
                                fontSize: '14px', 
                                color: 'var(--color-text-primary)', 
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                fontWeight: 500
                            }}
                            type="button"
                            onClick={() => setIsEditingPassword(true)}
                        >
                            Modifier
                        </button>
                    </div>
                ) : (
                    <div className="flex-col gap-md">
                        <label className="input-label">Nouveau mot de passe</label>
                        <input
                            type="password"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            className="input"
                            placeholder="Minimum 6 caractères"
                        />
                        <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                            <button
                                className="btn-secondary btn-sm"
                                type="button"
                                onClick={handleCancelPassword}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn-primary btn-sm"
                                type="button"
                                onClick={handleSavePassword}
                                disabled={tempPassword.length < 6}
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sélecteur de langues - UTILISE card existant */}
            <div className="card card-shadow" style={{ margin: '0 16px 80px', padding: '24px', background: 'white' }}>
                <button
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0
                    }}
                    type="button"
                    onClick={() => setShowLanguages((prev) => !prev)}
                    aria-expanded={showLanguages}
                >
                    <span className="text-body-md">
                        Langues : <span className="text-body-sm text-secondary">{selectedLabel}</span>
                    </span>
                    <ChevronDown
                        className={`w-5 h-5`}
                        style={{ 
                            transition: 'transform 0.2s',
                            transform: showLanguages ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                    />
                </button>

                {showLanguages && (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px',
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--color-border-light)'
                    }}>
                        {languages.map((language) => (
                            <label 
                                key={language}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '16px',
                                    padding: '8px 0',
                                    cursor: 'pointer'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedLanguages.includes(language)}
                                    onChange={() => toggleLanguage(language)}
                                    style={{ 
                                        width: '20px', 
                                        height: '20px', 
                                        cursor: 'pointer',
                                        accentColor: 'var(--color-primary)'
                                    }}
                                />
                                <span className="text-body">{language}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};