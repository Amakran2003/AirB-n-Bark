import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Dog, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * ==================== COMPOSANT MODAL AUTH ====================
 * Modal d'authentification style Airbnb
 * Utilise les classes CSS existantes du design system
 * Swipe down pour fermer
 * Gestion du clavier iOS (visualViewport API)
 */
export const AuthModal = () => {
    const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
    const [step, setStep] = useState<'email' | 'password'>('email');
    const [isNewUser, setIsNewUser] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pseudo, setPseudo] = useState('');
    const [modalHeight, setModalHeight] = useState('90vh');

    // Swipe to close
    const [swipeY, setSwipeY] = useState(0);
    const touchStartRef = useRef<number | null>(null);

    // Ajuster la hauteur du modal quand le clavier s'ouvre
    useEffect(() => {
        if (!isAuthModalOpen) return;

        const updateHeight = () => {
            if (window.visualViewport) {
                const vh = window.visualViewport.height;
                // Garder 90% mais max viewport height - 20px de marge en haut
                const maxHeight = vh - 20;
                const targetHeight = Math.min(vh * 0.9, maxHeight);
                setModalHeight(`${targetHeight}px`);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateHeight);
            window.visualViewport.addEventListener('scroll', updateHeight);
            updateHeight();
        }

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', updateHeight);
                window.visualViewport.removeEventListener('scroll', updateHeight);
            }
            setModalHeight('90vh');
        };
    }, [isAuthModalOpen]);

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
            setPseudo('');
            setIsSuccess(false);
            setStep('email');
            setIsNewUser(false);
        }
    }, [isAuthModalOpen]);

    const handleEmailSubmit = (e: FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (email.trim()) {
            const isNew = email.includes('new');
            setIsNewUser(isNew);
            setStep('password');
        }
    };

    const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!password) return;

        setIsLoading(true);
        let success = false;

        if (isNewUser) {
            if (!pseudo) {
                setIsLoading(false);
                return;
            }
            success = await register(pseudo, email, password);
        } else {
            success = await login(email, password);
        }

        setIsLoading(false);
        if (success) {
            setIsSuccess(true);
            setTimeout(() => {
                closeAuthModal();
            }, 1500);
        }
    };

    if (!isAuthModalOpen) return null;

    return (
        <div
            className="fixed inset-0 z-200 flex items-end justify-center bg-black/50 touch-none"
            onClick={closeAuthModal}
        >
            <div
                className="relative w-full bg-white rounded-t-3xl overflow-hidden flex flex-col touch-none"
                onClick={(e) => e.stopPropagation()}
                style={{
                    height: modalHeight,
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
                        <div className="w-10 h-1 bg-gray-300 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#ebebeb]">
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
                            <CheckCircle className="w-6 h-6 absolute -bottom-1 -right-1 text-[#16a34a] bg-white rounded-full" />
                        </div>
                        <span className="text-h3">
                            {isNewUser ? 'Compte créé !' : 'Connecté !'}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 p-6 pb-8 overflow-y-auto max-h-[calc(90vh-60px)] touch-auto overscroll-contain">
                    {step === 'email' ? (
                        <div className="flex flex-col gap-6">
                            {/* Email form */}
                            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="input-label">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            setEmail(e.target.value)
                                        }
                                        className="input"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary btn-full btn-lg"
                                    disabled={!email.trim()}
                                    style={{ opacity: !email.trim() ? 0.5 : 1 }}
                                >
                                    Continue
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-[#ebebeb]" />
                                <span className="text-caption">or</span>
                                <div className="flex-1 h-px bg-[#ebebeb]" />
                            </div>

                            {/* Social buttons */}
                            <div className="flex flex-col gap-3">
                                <button className="btn-secondary btn-full">
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                    </svg>
                                    Continue with Apple
                                </button>

                                <button className="btn-secondary btn-full">
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
                                    Continue with Google
                                </button>

                                <button className="btn-secondary btn-full">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    Continue with Facebook
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                            {/* Back to email */}
                            <button
                                type="button"
                                className="flex items-center justify-between p-3 rounded-xl bg-[#f7f7f7]"
                                onClick={() => setStep('email')}
                            >
                                <span className="text-body-sm text-secondary">{email}</span>
                                <span className="text-body-sm" style={{ color: '#0066ff' }}>
                                    Modifier
                                </span>
                            </button>

                            {isNewUser && (
                                <div>
                                    <label className="input-label">Pseudo</label>
                                    <input
                                        type="text"
                                        value={pseudo}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            setPseudo(e.target.value)
                                        }
                                        className="input"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div>
                                <label className="input-label">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setPassword(e.target.value)
                                    }
                                    className="input"
                                    autoFocus={!isNewUser}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary btn-full btn-lg"
                                disabled={isLoading || !password || (isNewUser && !pseudo)}
                                style={{
                                    opacity:
                                        isLoading || !password || (isNewUser && !pseudo) ? 0.5 : 1,
                                }}
                            >
                                {isLoading
                                    ? 'Chargement...'
                                    : isNewUser
                                      ? 'Créer un compte'
                                      : 'Se connecter'}
                            </button>
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
