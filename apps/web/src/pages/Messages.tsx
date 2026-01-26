import { useState, useCallback } from 'react';
import { MessageCircle, Dog } from 'lucide-react';
import { useMessages, Message, Conversation } from '../contexts/MessagesContext';
import { PageLayout } from '../components/PageLayout';
import { EmptyState } from '../components/EmptyState';
import { ChatModal, ChatMessage } from '../components/ChatModal';
import { formatMessageTime } from '../utils/dateFormatters';

/**
 * ==================== PAGE MESSAGES ====================
 * Page de messagerie pour contacter les hotes
 * Utilise ChatModal
 * API Status: Non implémenté (mock data)
 * Endpoints prévus:
 * - GET /api/conversations
 * - GET /api/conversations/:id/messages
 * - POST /api/conversations/:id/messages
 * - WebSocket pour temps réel
 */

interface MessagesProps {
    onTabChange?: (tab: 'home' | 'trips' | 'messages' | 'profile') => void;
}

export const Messages = ({ onTabChange }: MessagesProps) => {
    const { conversations, markConversationAsRead, addMessage } = useMessages();
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Ouvrir une conversation
    const openConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setIsModalOpen(true);
        markConversationAsRead(conversation.id);
    };

    // Fermer le modal
    const closeConversation = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedConversation(null), 300);
    };

    // Envoyer un message
    const handleSendMessage = useCallback(
        async (content: string) => {
            if (!selectedConversation) return;

            const newMessage: Message = {
                id: Date.now().toString(),
                senderId: 'user',
                content,
                timestamp: new Date(),
                isRead: true,
            };

            // Ajouter le message
            addMessage(selectedConversation.id, newMessage);
            setSelectedConversation((prev: Conversation | null) => {
                if (!prev) return null;
                return {
                    ...prev,
                    messages: [...prev.messages, newMessage],
                    lastMessage: newMessage.content,
                    lastMessageTime: newMessage.timestamp,
                };
            });

            // API non implémentée - simulation locale
            // await fetch(`/api/conversations/${selectedConversation.id}/messages`, { ... });

            // Simuler réponse de l'hôte
            setTimeout(() => {
                const hostResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    senderId: 'host',
                    content: getHostAutoResponse(content),
                    timestamp: new Date(),
                    isRead: false,
                };

                addMessage(selectedConversation.id, hostResponse);
                setSelectedConversation((prev: Conversation | null) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        messages: [...prev.messages, hostResponse],
                        lastMessage: hostResponse.content,
                        lastMessageTime: hostResponse.timestamp,
                    };
                });
            }, 1500);
        },
        [selectedConversation, addMessage]
    );

    // Convertir les messages pour ChatModal (senderId: user/host → user/other)
    const modalMessages: ChatMessage[] =
        selectedConversation?.messages.map((msg: Message) => ({
            id: msg.id,
            senderId: msg.senderId === 'user' ? 'user' : 'other',
            content: msg.content,
            timestamp: msg.timestamp,
            isRead: msg.isRead,
        })) || [];

    // Header personnalisé avec avatar hôte
    const headerContent = selectedConversation ? (
        <div className="flex items-center gap-3 flex-1">
            <img
                src={selectedConversation.hostAvatar}
                alt={selectedConversation.hostName}
                className="w-10 h-10 rounded-full object-cover"
            />
            <div className="min-w-0">
                <h2 className="text-body-md font-medium truncate">
                    {selectedConversation.hostName}
                </h2>
                <p className="text-caption text-secondary truncate">
                    {selectedConversation.listingTitle}
                </p>
            </div>
        </div>
    ) : null;

    // Avatar hôte
    const hostAvatar = selectedConversation ? (
        <img
            src={selectedConversation.hostAvatar}
            alt={selectedConversation.hostName}
            className="w-8 h-8 rounded-full object-cover"
        />
    ) : (
        <div className="w-8 h-8 rounded-full bg-tertiary" />
    );

    // Avatar utilisateur
    const userAvatar = (
        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
            <Dog className="w-4 h-4 text-white" />
        </div>
    );

    return (
        <>
            <PageLayout title="Messages" showNavbar activeTab="messages" onTabChange={onTabChange}>
                {conversations.length === 0 ? (
                    <EmptyState
                        icon={MessageCircle}
                        title="Pas encore de messages"
                        description="Reserve une niche et tu pourras discuter avec ton hote ici"
                    />
                ) : (
                    <div className="divide-y divide-(--color-border-light)">
                        {conversations.map((conversation: Conversation) => (
                            <button
                                key={conversation.id}
                                className="w-full p-4 flex gap-4 hover:bg-secondary transition-colors text-left"
                                onClick={() => openConversation(conversation)}
                            >
                                {/* Avatar hôte */}
                                <div className="relative shrink-0">
                                    <img
                                        src={conversation.hostAvatar}
                                        alt={conversation.hostName}
                                        className="w-14 h-14 rounded-full object-cover"
                                    />
                                    {conversation.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-medium">
                                                {conversation.unreadCount}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Infos conversation */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-body-md font-medium truncate">
                                            {conversation.hostName}
                                        </h3>
                                        <span className="text-caption text-secondary shrink-0 ml-2">
                                            {formatMessageTime(conversation.lastMessageTime)}
                                        </span>
                                    </div>
                                    <p className="text-caption text-secondary truncate mb-1">
                                        {conversation.listingTitle}
                                    </p>
                                    <p
                                        className={`text-body-sm truncate ${
                                            conversation.unreadCount > 0
                                                ? 'text-primary font-medium'
                                                : 'text-secondary'
                                        }`}
                                    >
                                        {conversation.lastMessage}
                                    </p>
                                </div>

                                {/* Thumbnail niche */}
                                <img
                                    src={conversation.listingImage}
                                    alt={conversation.listingTitle}
                                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </PageLayout>

            {/* Modal conversation - utilise ChatModal (DRY) */}
            <ChatModal
                isOpen={isModalOpen}
                onClose={closeConversation}
                messages={modalMessages}
                onSendMessage={handleSendMessage}
                headerContent={headerContent}
                otherAvatar={hostAvatar}
                userAvatar={userAvatar}
                placeholder="Envoie un woof..."
                emptyMessage={`Commence la conversation avec ${selectedConversation?.hostName || 'ton hôte'} !`}
                showReadStatus
            />
        </>
    );
};

/**
 * Réponses automatiques de l'hôte (en attendant l'API)
 */
function getHostAutoResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (
        lowerMessage.includes('arrivée') ||
        lowerMessage.includes('heure') ||
        lowerMessage.includes('check')
    ) {
        return "L'arrivée c'est à partir de 15h ! Je serai là pour t'accueillir avec des friandises 🦴";
    }

    if (
        lowerMessage.includes('clé') ||
        lowerMessage.includes('code') ||
        lowerMessage.includes('accès')
    ) {
        return "Le code d'accès c'est 1234#. Je te l'enverrai aussi la veille de ton arrivée ! 🔑";
    }

    if (lowerMessage.includes('wifi') || lowerMessage.includes('internet')) {
        return "Le WiFi c'est 'NicheWifi' et le mot de passe 'woofwoof2024'. Tu pourras regarder Netflix dans ta niche ! 📺";
    }

    if (lowerMessage.includes('parking') || lowerMessage.includes('voiture')) {
        return "Y'a une place de parking gratuite juste devant la niche. Ton humain pourra se garer tranquille ! 🚗";
    }

    if (
        lowerMessage.includes('gamelle') ||
        lowerMessage.includes('eau') ||
        lowerMessage.includes('croquette')
    ) {
        return "T'inquiète ! Gamelle d'eau fraîche toujours remplie et des croquettes premium t'attendent. Tu vas te régaler ! 🍖";
    }

    if (
        lowerMessage.includes('merci') ||
        lowerMessage.includes('super') ||
        lowerMessage.includes('génial')
    ) {
        return "Avec plaisir mon pote ! J'ai hate de te rencontrer. A tres vite ! 🐕";
    }

    if (
        lowerMessage.includes('bonjour') ||
        lowerMessage.includes('salut') ||
        lowerMessage.includes('woof')
    ) {
        return 'Wouf wouf ! Ravi de te parler ! Tu as des questions sur la niche ? 🐶';
    }

    return "Super ! Je note ca. N'hesite pas si t'as d'autres questions avant ton arrivee ! 🦴";
}
