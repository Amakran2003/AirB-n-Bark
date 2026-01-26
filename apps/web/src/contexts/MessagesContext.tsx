import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useBookings } from './BookingContext';
import { MOCK_LISTINGS_FULL } from '../data/listings';
import { api } from '../services/api';
import type { Conversation as ApiConversation, Message as ApiMessage } from '../types/api.types';

/**
 * ==================== MESSAGES CONTEXT ====================
 * Gestion centralisée des messages et conversations
 *
 * Architecture API-Ready:
 * - USE_API = true  → appels API réels + WebSocket
 * - USE_API = false → localStorage (par défaut)
 *
 * Endpoints API:
 * - GET /api/conversations → récupérer les conversations
 * - GET /api/conversations/:id/messages → récupérer les messages
 * - POST /api/conversations/:id/messages → envoyer un message
 * - POST /api/conversations/:id/read → marquer comme lu
 */

// Toggle pour activer l'API
// Note: API conversations non implémentée - utilise mock data
const USE_API = false; // import.meta.env.VITE_USE_API === 'true';

export interface Message {
    id: string;
    senderId: 'user' | 'host';
    content: string;
    timestamp: Date;
    isRead: boolean;
}

export interface Conversation {
    id: string;
    bookingId: string;
    hostId: string;
    hostName: string;
    hostAvatar: string;
    listingTitle: string;
    listingImage: string;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    messages: Message[];
}

interface MessagesContextType {
    conversations: Conversation[];
    totalUnreadCount: number;
    isLoading: boolean;
    error: string | null;
    markConversationAsRead: (conversationId: string) => void;
    addMessage: (conversationId: string, message: Message) => void;
    sendMessage: (conversationId: string, content: string) => Promise<void>;
    refreshConversations: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

const STORAGE_KEY = 'airbarkMessages';

// Helper pour convertir ApiConversation en Conversation local
const mapApiConversation = (apiConv: ApiConversation): Conversation => ({
    id: apiConv.id,
    bookingId: apiConv.id,
    hostId: apiConv.participants.find((p) => p.id !== 'user')?.id || 'host',
    hostName: apiConv.participants.find((p) => p.id !== 'user')?.name || 'Hôte',
    hostAvatar:
        apiConv.participants.find((p) => p.id !== 'user')?.avatar || '/placeholder-avatar.jpg',
    listingTitle: apiConv.listingTitle,
    listingImage: apiConv.listingImage,
    lastMessage: apiConv.lastMessage,
    lastMessageTime: new Date(apiConv.lastMessageTime),
    unreadCount: apiConv.unreadCount,
    messages: [],
});

// Helper pour convertir ApiMessage en Message local
const mapApiMessage = (apiMsg: ApiMessage): Message => ({
    id: apiMsg.id,
    senderId: apiMsg.senderId === 'user' ? 'user' : 'host',
    content: apiMsg.content,
    timestamp: new Date(apiMsg.timestamp),
    isRead: apiMsg.isRead,
});

export const MessagesProvider = ({ children }: { children: ReactNode }) => {
    const { bookings } = useBookings();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Rafraîchir les conversations depuis l'API
    const refreshConversations = useCallback(async () => {
        if (!USE_API) return;

        setIsLoading(true);
        setError(null);

        const response = await api.messages.getConversations();
        if (response.success) {
            setConversations(response.data.conversations.map(mapApiConversation));
        } else {
            setError(response.error.message);
        }

        setIsLoading(false);
    }, []);

    // Charger les conversations au montage
    useEffect(() => {
        const loadConversations = async () => {
            if (USE_API) {
                await refreshConversations();
                setIsInitialized(true);
                return;
            }

            // Fallback localStorage
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    const convs = parsed.map((c: Conversation) => ({
                        ...c,
                        lastMessageTime: new Date(c.lastMessageTime),
                        messages: c.messages.map((m: Message) => ({
                            ...m,
                            timestamp: new Date(m.timestamp),
                        })),
                    }));
                    setConversations(convs);
                } catch {
                    // Ignore parsing errors
                }
            }
            setIsInitialized(true);
        };

        loadConversations();
    }, [refreshConversations]);

    // Synchroniser avec les nouveaux bookings (mode local uniquement)
    useEffect(() => {
        if (!isInitialized || USE_API) return;

        const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
        const existingConvIds = new Set(conversations.map((c) => c.id));

        const newConvs: Conversation[] = [];

        for (const booking of confirmedBookings) {
            const convId = `conv-${booking.id}`;
            if (existingConvIds.has(convId)) continue;

            const listing = MOCK_LISTINGS_FULL[booking.listingId];
            if (!listing) continue;

            newConvs.push({
                id: convId,
                bookingId: booking.id,
                hostId: listing.host?.name || 'host-1',
                hostName: listing.host?.name || 'Hote',
                hostAvatar: listing.host?.avatar || '/placeholder-avatar.jpg',
                listingTitle: listing.title,
                listingImage: listing.image,
                lastMessage: `Wouf ! Bienvenue dans ta future niche`,
                lastMessageTime: new Date(booking.createdAt),
                unreadCount: 1,
                messages: [
                    {
                        id: 'm1',
                        senderId: 'host' as const,
                        content: `Wouf wouf ! Bienvenue ! Ta reservation est confirmee. N'hesite pas si t'as des questions sur la niche !`,
                        timestamp: new Date(booking.createdAt),
                        isRead: false,
                    },
                ],
            });
        }

        if (newConvs.length > 0) {
            setConversations((prev) => [...prev, ...newConvs]);
        }
    }, [isInitialized, bookings, conversations]);

    // Sauvegarder dans localStorage (mode local uniquement)
    useEffect(() => {
        if (!USE_API && conversations.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        }
    }, [conversations]);

    // Calculer le total des messages non lus
    const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    // Marquer une conversation comme lue
    const markConversationAsRead = useCallback(async (conversationId: string) => {
        if (USE_API) {
            await api.messages.markAsRead(conversationId);
        }

        setConversations((prev) =>
            prev.map((c) => {
                if (c.id === conversationId) {
                    return {
                        ...c,
                        unreadCount: 0,
                        messages: c.messages.map((m) => ({ ...m, isRead: true })),
                    };
                }
                return c;
            })
        );
    }, []);

    // Ajouter un message localement (pour updates optimistes)
    const addMessage = useCallback((conversationId: string, message: Message) => {
        setConversations((prev) =>
            prev.map((c) => {
                if (c.id === conversationId) {
                    const newUnreadCount =
                        message.senderId === 'host' ? c.unreadCount + 1 : c.unreadCount;
                    return {
                        ...c,
                        messages: [...c.messages, message],
                        lastMessage: message.content,
                        lastMessageTime: message.timestamp,
                        unreadCount: newUnreadCount,
                    };
                }
                return c;
            })
        );
    }, []);

    // Envoyer un message via API
    const sendMessage = useCallback(
        async (conversationId: string, content: string) => {
            if (USE_API) {
                const response = await api.messages.sendMessage({ conversationId, content });
                if (response.success) {
                    addMessage(conversationId, mapApiMessage(response.data));
                } else {
                    setError(response.error.message);
                }
            } else {
                // Mode local: juste ajouter le message
                const newMessage: Message = {
                    id: Date.now().toString(),
                    senderId: 'user',
                    content,
                    timestamp: new Date(),
                    isRead: true,
                };
                addMessage(conversationId, newMessage);
            }
        },
        [addMessage]
    );

    return (
        <MessagesContext.Provider
            value={{
                conversations,
                totalUnreadCount,
                isLoading,
                error,
                markConversationAsRead,
                addMessage,
                sendMessage,
                refreshConversations,
            }}
        >
            {children}
        </MessagesContext.Provider>
    );
};

export const useMessages = () => {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error('useMessages must be used within a MessagesProvider');
    }
    return context;
};
