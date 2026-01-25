import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Dog, CheckCircle, X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * ==================== UTILITAIRES DE SÉCURITÉ ====================
 */

// Sanitize les entrées utilisateur pour éviter les injections XSS
const sanitizeInput = (input: string): string => {
    return input
        .replace(/[<>]/g, '') // Supprime les chevrons HTML
        .replace(/javascript:/gi, '') // Supprime les liens javascript
        .replace(/on\w+=/gi, '') // Supprime les handlers d'événements
        .trim();
};

// Sanitize spécifiquement pour l'email
const sanitizeEmail = (email: string): string => {
    return email
        .toLowerCase()
        .replace(/[<>"']/g, '')
        .trim();
};

// Sanitize pour le pseudo (alphanumérique + underscores seulement)
const sanitizePseudo = (pseudo: string): string => {
    return pseudo
        .replace(/[^a-zA-Z0-9_À-ÿ\s]/g, '') // Garde lettres, chiffres, underscores, accents
        .trim()
        .slice(0, 30); // Max 30 caractères
};

// Validation du mot de passe
interface PasswordValidation {
    isValid: boolean;
    errors: string[];
}

const validatePassword = (password: string): PasswordValidation => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Une majuscule');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Une minuscule');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Un chiffre');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validation de l'email
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * ==================== COMPOSANT MODAL AUTH ====================
 * Modal d'authentification style Airbnb
 * Utilise les classes CSS existantes du design system
 * Swipe down pour fermer
 * Gestion du clavier iOS (visualViewport API)
 *
 * TODO API:
 * - POST /api/auth/register → inscription avec email/password
 * - POST /api/auth/login → connexion
 * - POST /api/auth/oauth/google → OAuth Google
 * - POST /api/auth/oauth/apple → OAuth Apple (Sign in with Apple)
 */
export const AuthModal = () => {
    const {
        isAuthModalOpen,
        closeAuthModal,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        loginWithFacebook,
    } = useAuth();
    const [step, setStep] = useState<'choice' | 'login' | 'register'>('choice');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pseudo, setPseudo] = useState('');

    // Visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Erreurs
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [pseudoError, setPseudoError] = useState('');
    const [generalError, setGeneralError] = useState('');

    // Swipe to close
    const [swipeY, setSwipeY] = useState(0);
    const touchStartRef = useRef<number | null>(null);

    // Ref pour le conteneur scrollable
    const contentRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

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
            closeAuthModal();
        }
        setSwipeY(0);
        touchStartRef.current = null;
    };

    // Reset form quand modal se ferme
    useEffect(() => {
        if (!isAuthModalOpen) {
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setPseudo('');
            setIsSuccess(false);
            setStep('choice');
            setShowPassword(false);
            setShowConfirmPassword(false);
            setEmailError('');
            setPasswordError('');
            setConfirmPasswordError('');
            setPseudoError('');
            setGeneralError('');
        }
    }, [isAuthModalOpen]);

    // Handlers pour les inputs avec sanitization
    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizeEmail(e.target.value);
        setEmail(sanitized);
        setEmailError('');
    };

    const handlePseudoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizePseudo(e.target.value);
        setPseudo(sanitized);
        setPseudoError('');
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = sanitizeInput(e.target.value);
        setPassword(value);
        setPasswordError('');
        // Vérifier aussi la confirmation si elle existe
        if (confirmPassword && value !== confirmPassword) {
            setConfirmPasswordError('Les mots de passe ne correspondent pas');
        } else {
            setConfirmPasswordError('');
        }
    };

    const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = sanitizeInput(e.target.value);
        setConfirmPassword(value);
        if (value !== password) {
            setConfirmPasswordError('Les mots de passe ne correspondent pas');
        } else {
            setConfirmPasswordError('');
        }
    };

    // Helpers
    const isNewUser = step === 'register';

    const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setEmailError('');
        setPasswordError('');
        setGeneralError('');

        if (!email.trim()) {
            setEmailError("L'email est requis");
            return;
        }
        if (!validateEmail(email)) {
            setEmailError("Format d'email invalide");
            return;
        }
        if (!password) {
            setPasswordError('Le mot de passe est requis');
            return;
        }

        setIsLoading(true);
        try {
            // TODO API: POST /api/auth/login
            const result = await login(email, password);
            if (result.success) {
                setIsSuccess(true);
                setTimeout(() => closeAuthModal(), 1500);
            } else {
                setGeneralError(result.error || 'Email ou mot de passe incorrect');
            }
        } catch {
            setGeneralError('Une erreur est survenue. Réessayez.');
        }
        setIsLoading(false);
    };

    const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setPseudoError('');
        setGeneralError('');

        // Validation pseudo
        if (!pseudo.trim()) {
            setPseudoError('Le pseudo est requis');
            return;
        }
        if (pseudo.length < 3) {
            setPseudoError('Le pseudo doit faire au moins 3 caractères');
            return;
        }

        // Validation email
        if (!email.trim()) {
            setEmailError("L'email est requis");
            return;
        }
        if (!validateEmail(email)) {
            setEmailError("Format d'email invalide");
            return;
        }

        // Validation mot de passe
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            setPasswordError(passwordValidation.errors.join(', '));
            return;
        }

        // Vérifier la confirmation
        if (password !== confirmPassword) {
            setConfirmPasswordError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        try {
            // TODO API: POST /api/auth/register
            const result = await register(pseudo, email, password);
            if (result.success) {
                setIsSuccess(true);
                setTimeout(() => closeAuthModal(), 1500);
            } else {
                // Utiliser le message d'erreur de l'API
                setGeneralError(result.error || 'Erreur lors de la création du compte. Réessayez.');
            }
        } catch {
            setGeneralError('Une erreur est survenue. Réessayez.');
        }
        setIsLoading(false);
    };

    if (!isAuthModalOpen) return null;

    return (
        <div
            className="fixed inset-0 z-200 flex items-end justify-center bg-black/50 touch-none"
            onClick={closeAuthModal}
        >
            <div
                ref={modalRef}
                className="relative w-full bg-white rounded-t-3xl overflow-hidden flex flex-col touch-none"
                onClick={(e) => e.stopPropagation()}
                style={{
                    height: '90vh',
                    maxHeight: '90vh',
                    animation: swipeY === 0 ? 'slideUp 0.3s ease-out' : undefined,
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
                        <button className="btn-icon" onClick={closeAuthModal}>
                            <X className="w-4 h-4" />
                        </button>
                        <span className="text-body-md">Log in or sign up</span>
                        <div className="w-10" />
                    </div>
                </div>

                {/* Success overlay */}
                {isSuccess && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white z-10">
                        <div className="relative">
                            <Dog className="w-16 h-16 icon" strokeWidth={1.5} />
                            <CheckCircle className="w-6 h-6 absolute -bottom-1 -right-1 text-success bg-white rounded-full" />
                        </div>
                        <span className="text-h3">
                            {isNewUser ? 'Compte créé !' : 'Connecté !'}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div
                    ref={contentRef}
                    className="flex-1 p-6 pb-64 overflow-y-auto touch-auto overscroll-contain"
                >
                    {step === 'choice' && (
                        <div className="flex flex-col gap-6">
                            <div className="text-center mb-2">
                                <h2 className="text-xl font-semibold mb-1">
                                    Bienvenue sur AirBnBark 🐕
                                </h2>
                                <p className="text-secondary text-sm">
                                    Connecte-toi ou crée un compte pour continuer
                                </p>
                            </div>

                            {/* Boutons principaux */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setStep('login')}
                                    className="w-full py-3 px-6 bg-(--color-text-primary) text-white font-semibold rounded-xl"
                                >
                                    Se connecter
                                </button>
                                <button
                                    onClick={() => setStep('register')}
                                    className="w-full py-3 px-6 bg-white text-primary font-semibold rounded-xl border border-(--color-text-primary)"
                                >
                                    Créer un compte
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-(--color-border-light)" />
                                <span className="text-caption">ou</span>
                                <div className="flex-1 h-px bg-(--color-border-light)" />
                            </div>

                            {/* Social buttons */}
                            <div className="flex flex-col gap-3">
                                <button
                                    className="btn-secondary btn-full"
                                    onClick={async () => {
                                        const success = await loginWithApple();
                                        if (success) {
                                            setIsSuccess(true);
                                            setTimeout(() => closeAuthModal(), 1500);
                                        }
                                    }}
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                    </svg>
                                    Continuer avec Apple
                                </button>

                                <button
                                    className="btn-secondary btn-full"
                                    onClick={async () => {
                                        const success = await loginWithGoogle();
                                        if (success) {
                                            setIsSuccess(true);
                                            setTimeout(() => closeAuthModal(), 1500);
                                        }
                                    }}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Continuer avec Google
                                </button>

                                <button
                                    className="btn-secondary btn-full"
                                    onClick={async () => {
                                        const success = await loginWithFacebook();
                                        if (success) {
                                            setIsSuccess(true);
                                            setTimeout(() => closeAuthModal(), 1500);
                                        }
                                    }}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    Continuer avec Facebook
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'login' && (
                        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                            <div className="text-center mb-2">
                                <h2 className="text-xl font-semibold mb-1">Connexion</h2>
                                <p className="text-secondary text-sm">Content de te revoir !</p>
                            </div>

                            {/* Erreur générale */}
                            {generalError && (
                                <div className="p-3 bg-error-light border border-error rounded-xl flex items-center gap-2 text-error">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span className="text-sm">{generalError}</span>
                                </div>
                            )}

                            <div>
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    className={`input ${emailError ? 'border-error' : ''}`}
                                    autoFocus
                                    autoComplete="email"
                                    placeholder="ton@email.com"
                                />
                                {emailError && (
                                    <p className="text-error text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="input-label">Mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className={`input pr-12 ${passwordError ? 'border-error' : ''}`}
                                        autoComplete="current-password"
                                        placeholder="Ton mot de passe"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-tertiary hover:text-secondary"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className="text-error text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {passwordError}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn-primary btn-full mt-2"
                                disabled={isLoading || !email || !password}
                                style={{ opacity: isLoading || !email || !password ? 0.5 : 1 }}
                            >
                                {isLoading ? 'Connexion...' : 'Se connecter'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('choice')}
                                className="text-center text-sm text-secondary underline"
                            >
                                Retour
                            </button>

                            <div className="text-center text-sm text-secondary">
                                Pas encore de compte ?{' '}
                                <button
                                    type="button"
                                    onClick={() => setStep('register')}
                                    className="text-brand font-medium"
                                >
                                    Créer un compte
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'register' && (
                        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                            <div className="text-center mb-2">
                                <h2 className="text-xl font-semibold mb-1">Inscription</h2>
                                <p className="text-secondary text-sm">
                                    Crée ton compte en quelques secondes
                                </p>
                            </div>

                            {/* Erreur générale */}
                            {generalError && (
                                <div className="p-3 bg-error-light border border-error rounded-xl flex items-center gap-2 text-error">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span className="text-sm">{generalError}</span>
                                </div>
                            )}

                            <div>
                                <label className="input-label">Pseudo</label>
                                <input
                                    type="text"
                                    value={pseudo}
                                    onChange={handlePseudoChange}
                                    className={`input ${pseudoError ? 'border-error' : ''}`}
                                    autoFocus
                                    autoComplete="username"
                                    placeholder="Ton pseudo (3-30 caractères)"
                                    maxLength={30}
                                />
                                {pseudoError && (
                                    <p className="text-error text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {pseudoError}
                                    </p>
                                )}
                                <p className="text-xs text-tertiary mt-1">
                                    {pseudo.length}/30 caractères
                                </p>
                            </div>

                            <div>
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    className={`input ${emailError ? 'border-error' : ''}`}
                                    autoComplete="email"
                                    placeholder="ton@email.com"
                                />
                                {emailError && (
                                    <p className="text-error text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="input-label">Mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className={`input pr-12 ${passwordError ? 'border-error' : ''}`}
                                        autoComplete="new-password"
                                        placeholder="Min. 8 caractères"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-tertiary hover:text-secondary"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className="text-error text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {passwordError}
                                    </p>
                                )}
                                {!passwordError && (
                                    <p className="text-xs text-tertiary mt-1">
                                        8+ caractères, 1 majuscule, 1 minuscule, 1 chiffre
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="input-label">Confirmer le mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                        className={`input pr-12 ${confirmPasswordError ? 'border-error' : ''}`}
                                        autoComplete="new-password"
                                        placeholder="Retape ton mot de passe"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-tertiary hover:text-secondary"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {confirmPasswordError && (
                                    <p className="text-error text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {confirmPasswordError}
                                    </p>
                                )}
                                {!confirmPasswordError &&
                                    confirmPassword &&
                                    password === confirmPassword && (
                                        <p className="text-success text-sm mt-1 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4" />
                                            Les mots de passe correspondent
                                        </p>
                                    )}
                            </div>

                            <button
                                type="submit"
                                className="btn-primary btn-full mt-2"
                                disabled={
                                    isLoading || !pseudo || !email || !password || !confirmPassword
                                }
                                style={{
                                    opacity:
                                        isLoading ||
                                        !pseudo ||
                                        !email ||
                                        !password ||
                                        !confirmPassword
                                            ? 0.5
                                            : 1,
                                }}
                            >
                                {isLoading ? 'Création...' : 'Créer mon compte'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('choice')}
                                className="text-center text-sm text-secondary underline"
                            >
                                Retour
                            </button>

                            <div className="text-center text-sm text-secondary">
                                Déjà un compte ?{' '}
                                <button
                                    type="button"
                                    onClick={() => setStep('login')}
                                    className="text-brand font-medium"
                                >
                                    Se connecter
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
