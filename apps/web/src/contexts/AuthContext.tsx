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
    role: 'guest' | 'host';  // guest = voyageur, host = hote
    isHost: boolean;         // Si l'utilisateur est aussi hote
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAuthModalOpen: boolean;
    isLoading: boolean;
    error: string | null;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    login: (email: string, password: string) => Promise<boolean>;
    register: (pseudo: string, email: string, password: string) => Promise<boolean>;
    loginWithGoogle: () => Promise<boolean>;
    loginWithApple: () => Promise<boolean>;
    loginWithFacebook: () => Promise<boolean>;
    becomeHost: () => void;
    switchToGuest: () => void;
    switchToHost: () => void;
    logout: () => void;
}

// Helper pour convertir ApiUser en User local
const mapApiUser = (apiUser: ApiUser): User => ({
    id: apiUser.id,
    email: apiUser.email,
    pseudo: apiUser.name,
    role: apiUser.isHost ? 'host' : 'guest',
    isHost: apiUser.isHost,
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
    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        if (USE_API) {
            const response = await api.auth.login({ email, password });
            setIsLoading(false);

            if (response.success) {
                setAuthToken(response.data.token);
                setUser(mapApiUser(response.data.user));
                return true;
            } else {
                setError(response.error.message);
                return false;
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
        });
        setIsLoading(false);
        return true;
    }, []);

    // Register - API ou simulation
    const register = useCallback(
        async (pseudo: string, email: string, password: string): Promise<boolean> => {
            setIsLoading(true);
            setError(null);

            if (USE_API) {
                const response = await api.auth.register({ email, password, name: pseudo });
                setIsLoading(false);

                if (response.success) {
                    setAuthToken(response.data.token);
                    setUser(mapApiUser(response.data.user));
                    return true;
                } else {
                    setError(response.error.message);
                    return false;
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
            });
            setIsLoading(false);
            return true;
        },
        []
    );

    // OAuth Google
    const loginWithGoogle = useCallback(async (): Promise<boolean> => {
        if (USE_API) {
            // En production: redirection vers Google OAuth ou popup
            // puis récupérer le token et appeler api.auth.oauthGoogle(token)
            console.log('OAuth Google - Backend requis');
            return false;
        }
        console.log('OAuth Google - Mode simulation');
        await new Promise((resolve) => setTimeout(resolve, 500));
        return false; // Retourne false tant que non configure
    }, []);

    // OAuth Apple
    const loginWithApple = useCallback(async (): Promise<boolean> => {
        // TODO: POST /api/auth/oauth/apple
        // En production: utiliser Sign in with Apple JS
        console.log('OAuth Apple - A configurer');
        await new Promise((resolve) => setTimeout(resolve, 500));
        return false;
    }, []);

    // OAuth Facebook
    const loginWithFacebook = useCallback(async (): Promise<boolean> => {
        // TODO: POST /api/auth/oauth/facebook
        console.log('OAuth Facebook - A configurer');
        await new Promise((resolve) => setTimeout(resolve, 500));
        return false;
    }, []);

    // Devenir hote (activation directe)
    const becomeHost = useCallback(() => {
        // TODO: PUT /api/users/:id/become-host
        // Note: La verification d'identite se fait apres, le compte hote est accessible immediatement
        setUser((prev) => prev ? {
            ...prev,
            isHost: true,
            role: 'host',
        } : null);
    }, []);

    // Basculer vers le mode voyageur
    const switchToGuest = useCallback(() => {
        setUser((prev) => prev ? {
            ...prev,
            role: 'guest',
        } : null);
    }, []);

    // Basculer vers le mode hote
    const switchToHost = useCallback(() => {
        setUser((prev) => prev ? {
            ...prev,
            role: 'host',
        } : null);
    }, []);

    const logout = useCallback(async () => {
        if (USE_API) {
            await api.auth.logout();
        }
        setAuthToken(null);
        setUser(null);
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
