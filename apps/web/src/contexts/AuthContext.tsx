import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * ==================== TYPES ====================
 */
interface User {
    id: string;
    email: string;
    pseudo: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    login: (email: string, password: string) => Promise<boolean>;
    register: (pseudo: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

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

    const openAuthModal = useCallback(() => {
        setIsAuthModalOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
    }, []);

    // Simulation login - sera connecté à l'API plus tard
    const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
        // TODO: Connecter à l'API
        // Pour l'instant on simule un login réussi
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setUser({
            id: '1',
            email,
            pseudo: email.split('@')[0],
        });
        
        return true;
    }, []);

    // Simulation register - sera connecté à l'API plus tard
    const register = useCallback(async (pseudo: string, email: string, _password: string): Promise<boolean> => {
        // TODO: Connecter à l'API
        // Pour l'instant on simule une inscription réussie
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setUser({
            id: '1',
            email,
            pseudo,
        });
        
        return true;
    }, []);

    const logout = useCallback(() => {
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isAuthModalOpen,
                openAuthModal,
                closeAuthModal,
                login,
                register,
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
