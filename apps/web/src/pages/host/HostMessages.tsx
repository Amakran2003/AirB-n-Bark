import { useState, useCallback } from 'react';
import { MessageCircle, Home } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { ChatModal, ChatMessage } from '../../components/ChatModal';
import { formatMessageTime } from '../../utils/dateFormatters';

/**
 * ==================== HOST MESSAGES ====================
 * Page de messages pour les hotes
 * Utilise ChatModal (même composant que Messages guest - DRY)
 * 
 * TODO API:
 * - GET /api/host/conversations → liste des conversations
 * - GET /api/host/conversations/:id/messages → messages d'une conversation
 * - POST /api/host/conversations/:id/messages → envoyer un message
 * - WebSocket pour temps reel
 */

interface Message {
    id: string;
    senderId: 'host' | 'guest';
    content: string;
    timestamp: Date;
    isRead: boolean;
}

interface Conversation {
    id: string;
    guestName: string;
    guestAvatar: string;
    dogName: string;
    listingTitle: string;
    dates: string;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    messages: Message[];
}

interface HostMessagesProps {
    initialConversationId?: string;
}

// Mock data pour demo
const mockConversations: Conversation[] = [
    {
        id: '1',
        guestName: 'Max le Berger',
        guestAvatar: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200',
        dogName: 'Max',
        listingTitle: 'Niche Cozy Paris',
        dates: '25-27 Jan',
        lastMessage: 'Super ! A quelle heure je peux arriver ?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
        unreadCount: 2,
        messages: [
            {
                id: '1',
                senderId: 'guest',
                content: 'Woof ! Ta niche a l\'air geniale !',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                isRead: true,
            },
            {
                id: '2',
                senderId: 'host',
                content: 'Merci ! Tu vas adorer, y\'a plein d\'espace pour courir !',
                timestamp: new Date(Date.now() - 1000 * 60 * 25),
                isRead: true,
            },
            {
                id: '3',
                senderId: 'guest',
                content: 'Super ! A quelle heure je peux arriver ?',
                timestamp: new Date(Date.now() - 1000 * 60 * 5),
                isRead: false,
            },
        ],
    },
    {
        id: '2',
        guestName: 'Bella la Caniche',
        guestAvatar: 'https://images.unsplash.com/photo-1575859431774-2e57ed632f65?w=200',
        dogName: 'Bella',
        listingTitle: 'Niche Cozy Paris',
        dates: '1-3 Feb',
        lastMessage: 'Merci pour les infos !',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
        unreadCount: 0,
        messages: [
            {
                id: '1',
                senderId: 'guest',
                content: 'Bonjour ! Y\'a le wifi dans la niche ?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
                isRead: true,
            },
            {
                id: '2',
                senderId: 'host',
                content: 'Oui ! Wifi haut debit pour regarder tes series preferees 📺',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
                isRead: true,
            },
            {
                id: '3',
                senderId: 'guest',
                content: 'Merci pour les infos !',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                isRead: true,
            },
        ],
    },
];

export const HostMessages = ({ initialConversationId }: HostMessagesProps) => {
    const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
        initialConversationId 
            ? mockConversations.find(c => c.id === initialConversationId) || null 
            : null
    );
    const [isModalOpen, setIsModalOpen] = useState(!!initialConversationId);

    // Ouvrir une conversation
    const openConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setIsModalOpen(true);
        // Marquer comme lu
        setConversations(prev =>
            prev.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c)
        );
    };

    // Fermer le modal
    const closeConversation = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedConversation(null), 300);
    };

    // Envoyer un message
    const handleSendMessage = useCallback(async (content: string) => {
        if (!selectedConversation) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: 'host',
            content,
            timestamp: new Date(),
            isRead: true,
        };

        // Mettre à jour la conversation sélectionnée
        setSelectedConversation(prev => {
            if (!prev) return null;
            return {
                ...prev,
                messages: [...prev.messages, newMessage],
                lastMessage: content,
                lastMessageTime: new Date(),
            };
        });

        // Mettre à jour la liste des conversations
        setConversations(prev =>
            prev.map(c =>
                c.id === selectedConversation.id
                    ? {
                          ...c,
                          messages: [...c.messages, newMessage],
                          lastMessage: content,
                          lastMessageTime: new Date(),
                      }
                    : c
            )
        );

        // TODO: Appel API réel
        // await fetch(`/api/host/conversations/${selectedConversation.id}/messages`, { ... });

        // Simuler réponse du guest
        setTimeout(() => {
            const guestResponse: Message = {
                id: (Date.now() + 1).toString(),
                senderId: 'guest',
                content: getGuestAutoResponse(content),
                timestamp: new Date(),
                isRead: false,
            };

            setSelectedConversation(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    messages: [...prev.messages, guestResponse],
                    lastMessage: guestResponse.content,
                    lastMessageTime: new Date(),
                };
            });

            setConversations(prev =>
                prev.map(c =>
                    c.id === selectedConversation.id
                        ? {
                              ...c,
                              messages: [...c.messages, guestResponse],
                              lastMessage: guestResponse.content,
                              lastMessageTime: new Date(),
                          }
                        : c
                )
            );
        }, 1500);
    }, [selectedConversation]);

    // Convertir les messages pour ChatModal (senderId: host/guest → user/other)
    const modalMessages: ChatMessage[] = selectedConversation?.messages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId === 'host' ? 'user' : 'other',
        content: msg.content,
        timestamp: msg.timestamp,
        isRead: msg.isRead,
    })) || [];

    // Header personnalisé avec avatar guest
    const headerContent = selectedConversation ? (
        <div className="flex items-center gap-3 flex-1">
            <img
                src={selectedConversation.guestAvatar}
                alt={selectedConversation.guestName}
                className="w-10 h-10 rounded-full object-cover"
            />
            <div className="min-w-0">
                <h2 className="text-body-md font-medium truncate">
                    {selectedConversation.guestName}
                </h2>
                <p className="text-caption text-secondary truncate">
                    🐕 {selectedConversation.dogName} • {selectedConversation.dates}
                </p>
            </div>
        </div>
    ) : null;

    // Avatar guest (le locataire)
    const guestAvatar = selectedConversation ? (
        <img
            src={selectedConversation.guestAvatar}
            alt={selectedConversation.guestName}
            className="w-8 h-8 rounded-full object-cover"
        />
    ) : <div className="w-8 h-8 rounded-full bg-gray-200" />;

    // Avatar host (moi)
    const hostAvatar = (
        <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
        </div>
    );

    return (
        <>
            {/* Liste des conversations */}
            <div className="fixed inset-0 bg-[#f7f7f7] flex flex-col">
                {/* Header */}
                <div
                    className="shrink-0 px-4 py-4 bg-white border-b border-[#ebebeb]"
                    style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
                >
                    <h1 className="text-h2">Messages</h1>
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto"
                    style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
                >
                    {conversations.length === 0 ? (
                        <EmptyState
                            icon={MessageCircle}
                            title="Aucun message"
                            description="Les messages de tes locataires apparaitront ici"
                        />
                    ) : (
                        <div className="divide-y divide-[#ebebeb]">
                            {conversations.map(conversation => (
                                <button
                                    key={conversation.id}
                                    onClick={() => openConversation(conversation)}
                                    className="w-full flex items-center gap-3 p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                                >
                                    {/* Avatar guest */}
                                    <div className="relative shrink-0">
                                        <img
                                            src={conversation.guestAvatar}
                                            alt={conversation.guestName}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                        {conversation.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#3B82F6] text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                {conversation.unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Infos conversation */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`font-medium truncate ${conversation.unreadCount > 0 ? 'text-primary' : ''}`}>
                                                {conversation.guestName}
                                            </p>
                                            <span className="text-caption text-secondary shrink-0">
                                                {formatMessageTime(conversation.lastMessageTime)}
                                            </span>
                                        </div>
                                        <p className="text-caption text-[#3B82F6] truncate">
                                            🐕 {conversation.dogName} • {conversation.dates}
                                        </p>
                                        <p className={`text-body-sm truncate ${
                                            conversation.unreadCount > 0 ? 'text-primary font-medium' : 'text-secondary'
                                        }`}>
                                            {conversation.lastMessage}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal conversation - utilise ChatModal (DRY) */}
            <ChatModal
                isOpen={isModalOpen}
                onClose={closeConversation}
                messages={modalMessages}
                onSendMessage={handleSendMessage}
                headerContent={headerContent}
                otherAvatar={guestAvatar}
                userAvatar={hostAvatar}
                placeholder="Reponds a ton locataire..."
                emptyMessage={`Commence la conversation avec ${selectedConversation?.guestName || 'ton locataire'} !`}
                showReadStatus
            />
        </>
    );
};

/**
 * Réponses automatiques du guest (en attendant l'API)
 */
function getGuestAutoResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('15h') || lowerMessage.includes('heure')) {
        return 'Parfait ! Je serai la a 15h pile. Merci ! 🐕';
    }

    if (lowerMessage.includes('code') || lowerMessage.includes('clé')) {
        return 'Super, je note le code. A bientot ! 🔑';
    }

    if (lowerMessage.includes('wifi') || lowerMessage.includes('internet')) {
        return 'Genial ! Je vais pouvoir mater mes series preferees 📺';
    }

    if (lowerMessage.includes('bienvenue') || lowerMessage.includes('plaisir')) {
        return 'Trop hate d\'arriver ! Wouf wouf ! 🐶';
    }

    return 'Merci pour ta reponse ! J\'ai hate d\'etre dans ta niche ! 🦴';
}
