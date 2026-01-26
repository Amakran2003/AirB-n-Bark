import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api';
import type { User as ApiUser } from '../types/api.types';

/**
 * ==================== AUTH CONTEXT ====================
 * Gestion de l'authentification utilisateur
 *
 * Architecture API-Ready:
 * - USE_API = true  → appels API réels
 * - USE_API = false → simulation locale (par défaut)
 *
 * Endpoints API:
 * - POST /api/auth/register → inscription
 * - POST /api/auth/login → connexion
 * - POST /api/auth/logout → deconnexion
 * - GET /api/auth/me → recuperer l'utilisateur connecte
 * - POST /api/auth/oauth/google → OAuth Google
 * - POST /api/auth/oauth/apple → OAuth Apple Sign In
 */

// Toggle pour activer l'API (mettre à true quand le backend est prêt)
const USE_API = import.meta.env.VITE_USE_API === 'true';

/**
 * ==================== TYPES ====================
 */
interface User {
    id: string;
    email: string;
    pseudo: string;
    avatar?: string; // URL de la photo de profil
    role: 'guest' | 'host'; // guest = voyageur, host = hote
    isHost: boolean; // Si l'utilisateur est aussi hote
    language?: string;
}

// Résultat d'auth avec erreur optionnelle
interface AuthResult {
    success: boolean;
    error?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAuthModalOpen: boolean;
    isLoading: boolean;
    error: string | null;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    login: (email: string, password: string) => Promise<AuthResult>;
    register: (pseudo: string, email: string, password: string) => Promise<AuthResult>;
    loginWithGoogle: () => Promise<boolean>;
    loginWithApple: () => Promise<boolean>;
    loginWithFacebook: () => Promise<boolean>;
    becomeHost: () => Promise<AuthResult>;
    switchToGuest: () => void;
    switchToHost: () => void;
    updateAvatar: (avatarUrl: string) => Promise<AuthResult>;
    updateLanguage: (language: string) => Promise<AuthResult>;
    logout: () => void;
}

// Helper pour convertir ApiUser en User local
const mapApiUser = (apiUser: ApiUser): User => ({
    id: apiUser.id,
    email: apiUser.email,
    pseudo: apiUser.name,
    avatar: apiUser.avatar,
    role: apiUser.isHost ? 'host' : 'guest',
    isHost: apiUser.isHost,
    language: apiUser.language ?? 'english',
});

/**
 * ==================== CONTEXT ====================
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * ==================== PROVIDER ====================
 */
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Vérifier le token au chargement
    useEffect(() => {
        const checkAuth = async () => {
            const token = getAuthToken();
            if (!token || !USE_API) return;

            setIsLoading(true);
            const response = await api.auth.me();
            if (response.success) {
                setUser(mapApiUser(response.data));
            } else {
                setAuthToken(null);
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const openAuthModal = useCallback(() => {
        setIsAuthModalOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
        setError(null);
    }, []);

    // Login - API ou simulation
    const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
        setIsLoading(true);
        setError(null);

        if (USE_API) {
            const response = await api.auth.login({ email, password });
            setIsLoading(false);

            if (response.success) {
                setAuthToken(response.data.token);
                setUser(mapApiUser(response.data.user));
                // Notifier les autres contextes du changement d'auth
                window.dispatchEvent(new Event('auth-changed'));
                return { success: true };
            } else {
                setError(response.error.message);
                return { success: false, error: response.error.message };
            }
        }

        // Simulation locale
        await new Promise((resolve) => setTimeout(resolve, 500));
        setUser({
            id: '1',
            email,
            pseudo: email.split('@')[0],
            role: 'guest',
            isHost: false,
            language: 'english',
        });
        setIsLoading(false);
        return { success: true };
    }, []);

    // Register - API ou simulation
    const register = useCallback(
        async (pseudo: string, email: string, password: string): Promise<AuthResult> => {
            setIsLoading(true);
            setError(null);

            if (USE_API) {
                const response = await api.auth.register({ email, password, name: pseudo });
                setIsLoading(false);

                if (response.success) {
                    setAuthToken(response.data.token);
                    setUser(mapApiUser(response.data.user));
                    // Notifier les autres contextes du changement d'auth
                    window.dispatchEvent(new Event('auth-changed'));
                    return { success: true };
                } else {
                    setError(response.error.message);
                    return { success: false, error: response.error.message };
                }
            }

            // Simulation locale
            await new Promise((resolve) => setTimeout(resolve, 500));
            setUser({
                id: '1',
                email,
                pseudo,
                role: 'guest',
                isHost: false,
                language: 'english',
            });
            setIsLoading(false);
            return { success: true };
        },
        []
    );

    // OAuth Google
    const loginWithGoogle = useCallback(async (): Promise<boolean> => {
        if (USE_API) {
            // En production: redirection vers Google OAuth ou popup
            // puis récupérer le token et appeler api.auth.oauthGoogle(token)
            return false;
        }
        // Mode simulation
        await new Promise((resolve) => setTimeout(resolve, 500));
        return false; // Retourne false tant que non configure
    }, []);

    // OAuth Apple
    const loginWithApple = useCallback(async (): Promise<boolean> => {
        // Non implémenté: Sign in with Apple
        // En production: utiliser Sign in with Apple JS
        await new Promise((resolve) => setTimeout(resolve, 500));
        return false;
    }, []);

    // OAuth Facebook
    const loginWithFacebook = useCallback(async (): Promise<boolean> => {
        // Non implémenté: Facebook Login
        await new Promise((resolve) => setTimeout(resolve, 500));
        return false;
    }, []);

    // Devenir hote (activation directe)
    const becomeHost = useCallback(async (): Promise<AuthResult> => {
        if (!user) {
            return { success: false, error: 'Non connecté' };
        }

        if (USE_API) {
            setIsLoading(true);
            const response = await api.auth.becomeHost();
            setIsLoading(false);

            if (response.success) {
                setUser((prev) =>
                    prev
                        ? {
                              ...prev,
                              isHost: true,
                              role: 'host',
                          }
                        : null
                );
                return { success: true };
            } else {
                return { success: false, error: response.error.message };
            }
        }

        // Simulation locale
        setUser((prev) =>
            prev
                ? {
                      ...prev,
                      isHost: true,
                      role: 'host',
                  }
                : null
        );
        return { success: true };
    }, [user]);

    // Basculer vers le mode voyageur
    const switchToGuest = useCallback(() => {
        setUser((prev) =>
            prev
                ? {
                      ...prev,
                      role: 'guest',
                  }
                : null
        );
    }, []);

    // Basculer vers le mode hote
    const switchToHost = useCallback(() => {
        setUser((prev) =>
            prev
                ? {
                      ...prev,
                      role: 'host',
                  }
                : null
        );
    }, []);

    // Mettre à jour l'avatar
    const updateAvatar = useCallback(
        async (avatarUrl: string): Promise<AuthResult> => {
            if (!user) {
                return { success: false, error: 'Non connecté' };
            }

            if (USE_API) {
                setIsLoading(true);
                const response = await api.auth.updateAvatar(avatarUrl);
                setIsLoading(false);

                if (response.success) {
                    setUser((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  avatar: response.data.avatar || avatarUrl,
                              }
                            : null
                    );
                    return { success: true };
                } else {
                    return { success: false, error: response.error.message };
                }
            }

            // Simulation locale - juste mettre à jour le state
            setUser((prev) =>
                prev
                    ? {
                          ...prev,
                          avatar: avatarUrl,
                      }
                    : null
            );
            return { success: true };
        },
        [user]
    );

    const updateLanguage = useCallback(
        async (language: string): Promise<AuthResult> => {
            if (!user) {
                return { success: false, error: 'Non connecté' };
            }

            if (USE_API) {
                setIsLoading(true);
                const response = await api.auth.updateLanguage(language);
                setIsLoading(false);

                if (response.success) {
                    setUser((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  language: response.data.language ?? language,
                              }
                            : null
                    );
                    return { success: true };
                }
                return { success: false, error: response.error.message };
            }

            setUser((prev) =>
                prev
                    ? {
                          ...prev,
                          language,
                      }
                    : null
            );
            return { success: true };
        },
        [user]
    );

    const logout = useCallback(async () => {
        if (USE_API) {
            await api.auth.logout();
        }
        setAuthToken(null);
        setUser(null);
        // Notifier les autres contextes du changement d'auth
        window.dispatchEvent(new Event('auth-changed'));
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isAuthModalOpen,
                isLoading,
                error,
                openAuthModal,
                closeAuthModal,
                login,
                register,
                loginWithGoogle,
                loginWithApple,
                loginWithFacebook,
                becomeHost,
                switchToGuest,
                switchToHost,
                updateAvatar,
                updateLanguage,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

/**
 * ==================== HOOK ====================
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
