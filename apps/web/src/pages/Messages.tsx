import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, MessageCircle, Dog, Calendar } from 'lucide-react';
import { BottomNavbar } from '../components/BottomNavbar';
import { useBookings } from '../contexts/BookingContext';
import { MOCK_LISTINGS_FULL } from '../data/listings';

/**
 * ==================== PAGE MESSAGES ====================
 * Page de messagerie pour contacter les hôtes
 * - Liste des conversations (liées aux réservations)
 * - Vue conversation détaillée
 * 
 * TODO: Intégration n8n pour:
 * - Envoi/réception de messages en temps réel
 * - Notifications push
 * - Historique des messages persistant
 
 */

interface Message {
    id: string;
    senderId: 'user' | 'host';
    content: string;
    timestamp: Date;
    isRead: boolean;
}

interface Conversation {
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

// URL webhook n8n pour les messages (à configurer)
const N8N_MESSAGES_WEBHOOK_URL = import.meta.env.VITE_N8N_MESSAGES_WEBHOOK_URL || '';

interface MessagesProps {
    onBack: () => void;
    onTabChange: (tab: 'home' | 'trips' | 'messages' | 'profile') => void;
}

export const Messages = ({ onTabChange }: MessagesProps) => {
    const { bookings } = useBookings();
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Générer les conversations à partir des réservations confirmées
    const conversations: Conversation[] = bookings
        .filter((b) => b.status === 'confirmed')
        .map((booking) => {
            const listing = MOCK_LISTINGS_FULL[booking.listingId];
            if (!listing) return null;

            return {
                id: `conv-${booking.id}`,
                bookingId: booking.id,
                hostId: listing.host?.name || 'host-1',
                hostName: listing.host?.name || 'Hôte',
                hostAvatar: listing.host?.avatar || '/placeholder-avatar.jpg',
                listingTitle: listing.title,
                listingImage: listing.image,
                lastMessage: `Wouf ! Bienvenue dans ta future niche 🐕`,
                lastMessageTime: new Date(booking.createdAt),
                unreadCount: 1,
                messages: [
                    {
                        id: 'm1',
                        senderId: 'host' as const,
                        content: `Wouf wouf ! 🐕 Bienvenue ${listing.host?.name ? 'chez ' + listing.host.name.split(' ')[0] : ''} ! Ta réservation est confirmée. N'hésite pas si t'as des questions sur la niche !`,
                        timestamp: new Date(booking.createdAt),
                        isRead: false,
                    },
                ],
            };
        })
        .filter(Boolean) as Conversation[];

    // Scroll to bottom on new message
    useEffect(() => {
        if (selectedConversation) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedConversation?.messages]);

    // Focus input when opening conversation
    useEffect(() => {
        if (selectedConversation) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [selectedConversation]);

    // Envoyer un message
    const sendMessage = async () => {
        if (!input.trim() || isLoading || !selectedConversation) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: 'user',
            content: input.trim(),
            timestamp: new Date(),
            isRead: true,
        };

        // Ajouter le message à la conversation
        setSelectedConversation((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                messages: [...prev.messages, newMessage],
                lastMessage: newMessage.content,
                lastMessageTime: newMessage.timestamp,
            };
        });

        setInput('');
        setIsLoading(true);

        try {
            // TODO: Intégrer n8n pour envoyer les messages
            if (N8N_MESSAGES_WEBHOOK_URL) {
                await fetch(N8N_MESSAGES_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationId: selectedConversation.id,
                        bookingId: selectedConversation.bookingId,
                        hostId: selectedConversation.hostId,
                        message: newMessage.content,
                        timestamp: newMessage.timestamp.toISOString(),
                    }),
                });
            }

            // Réponse simulée de l'hôte (en attendant n8n)
            setTimeout(() => {
                const hostResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    senderId: 'host',
                    content: getHostAutoResponse(newMessage.content),
                    timestamp: new Date(),
                    isRead: false,
                };

                setSelectedConversation((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        messages: [...prev.messages, hostResponse],
                        lastMessage: hostResponse.content,
                        lastMessageTime: hostResponse.timestamp,
                    };
                });
            }, 1500);
        } catch (error) {
            console.error('Erreur envoi message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Formater la date du dernier message
    const formatMessageTime = (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Hier';
        } else if (days < 7) {
            return date.toLocaleDateString('fr-FR', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }
    };

    // Vue liste des conversations
    if (!selectedConversation) {
        return (
            <div className="fixed inset-0 bg-white flex flex-col">
                {/* Header */}
                <div
                    className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-[#ebebeb]"
                    style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
                >
                    <div className="w-10" />
                    <h1 className="text-h2">Messages 🐾</h1>
                    <div className="w-10" />
                </div>

                {/* Liste des conversations */}
                <div
                    className="flex-1 overflow-y-auto"
                    style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
                >
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <MessageCircle className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-h2 mb-2">Pas encore de messages</h3>
                            <p className="text-body text-secondary">
                                Réserve une niche et tu pourras discuter avec ton hôte ici ! 🐕
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#ebebeb]">
                            {conversations.map((conversation) => (
                                <button
                                    key={conversation.id}
                                    className="w-full p-4 flex gap-4 hover:bg-gray-50 transition-colors text-left"
                                    onClick={() => setSelectedConversation(conversation)}
                                >
                                    {/* Avatar hôte */}
                                    <div className="relative shrink-0">
                                        <img
                                            src={conversation.hostAvatar}
                                            alt={conversation.hostName}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                        {conversation.unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#3B82F6] rounded-full flex items-center justify-center">
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
                </div>

                {/* Bottom Navbar */}
                <BottomNavbar activeTab="messages" onTabChange={onTabChange} />
            </div>
        );
    }

    // Vue conversation détaillée
    return (
        <div className="fixed inset-0 bg-white flex flex-col">
            {/* Header conversation */}
            <div
                className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-[#ebebeb]"
                style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
            >
                <button
                    className="btn-icon"
                    onClick={() => setSelectedConversation(null)}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <img
                    src={selectedConversation.hostAvatar}
                    alt={selectedConversation.hostName}
                    className="w-10 h-10 rounded-full object-cover"
                />

                <div className="flex-1 min-w-0">
                    <h2 className="text-body-md font-medium truncate">
                        {selectedConversation.hostName}
                    </h2>
                    <p className="text-caption text-secondary truncate">
                        {selectedConversation.listingTitle}
                    </p>
                </div>
            </div>

            {/* Booking info card */}
            <div className="shrink-0 p-4 bg-gray-50 border-b border-[#ebebeb]">
                <div className="flex gap-3 items-center">
                    <img
                        src={selectedConversation.listingImage}
                        alt={selectedConversation.listingTitle}
                        className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium truncate">
                            {selectedConversation.listingTitle}
                        </p>
                        <div className="flex items-center gap-2 text-caption text-secondary">
                            <Calendar className="w-3 h-3" />
                            <span>Réservation confirmée ✅</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {selectedConversation.messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-end gap-2 ${
                            message.senderId === 'user' ? 'flex-row-reverse' : ''
                        }`}
                    >
                        {/* Avatar */}
                        {message.senderId === 'host' && (
                            <img
                                src={selectedConversation.hostAvatar}
                                alt={selectedConversation.hostName}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                        )}
                        {message.senderId === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center shrink-0">
                                <Dog className="w-4 h-4 text-white" />
                            </div>
                        )}

                        {/* Message bubble */}
                        <div
                            className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                                message.senderId === 'host'
                                    ? 'bg-gray-100 rounded-bl-md'
                                    : 'bg-[#3B82F6] text-white rounded-br-md'
                            }`}
                        >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p
                                className={`text-[10px] mt-1 ${
                                    message.senderId === 'host' ? 'text-secondary' : 'text-white/70'
                                }`}
                            >
                                {formatMessageTime(message.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex items-end gap-2">
                        <img
                            src={selectedConversation.hostAvatar}
                            alt={selectedConversation.hostName}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                            <div className="flex gap-1">
                                <span
                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                    style={{ animationDelay: '0ms' }}
                                />
                                <span
                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                    style={{ animationDelay: '150ms' }}
                                />
                                <span
                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                    style={{ animationDelay: '300ms' }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
                className="shrink-0 p-4 border-t border-[#ebebeb] bg-white"
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
            >
                <div className="flex items-center gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Envoie un woof... 🐕"
                        className="flex-1 px-4 py-3 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-[#3B82F6]"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            input.trim() && !isLoading
                                ? 'bg-[#3B82F6] text-white'
                                : 'bg-gray-100 text-gray-400'
                        }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Réponses automatiques de l'hôte (en attendant n8n)
 * TODO: Remplacer par les vraies réponses via n8n
 */
function getHostAutoResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('arrivée') || lowerMessage.includes('heure') || lowerMessage.includes('check')) {
        return "L'arrivée c'est à partir de 15h ! Je serai là pour t'accueillir avec des friandises 🦴";
    }

    if (lowerMessage.includes('clé') || lowerMessage.includes('code') || lowerMessage.includes('accès')) {
        return "Le code d'accès c'est 1234#. Je te l'enverrai aussi la veille de ton arrivée ! 🔑";
    }

    if (lowerMessage.includes('wifi') || lowerMessage.includes('internet')) {
        return "Le WiFi c'est 'NicheWifi' et le mot de passe 'woofwoof2024'. Tu pourras regarder Netflix dans ta niche ! 📺";
    }

    if (lowerMessage.includes('parking') || lowerMessage.includes('voiture')) {
        return "Y'a une place de parking gratuite juste devant la niche. Ton humain pourra se garer tranquille ! 🚗";
    }

    if (lowerMessage.includes('gamelle') || lowerMessage.includes('eau') || lowerMessage.includes('croquette')) {
        return "T'inquiète ! Gamelle d'eau fraîche toujours remplie et des croquettes premium t'attendent. Tu vas te régaler ! 🍖";
    }

    if (lowerMessage.includes('merci') || lowerMessage.includes('super') || lowerMessage.includes('génial')) {
        return "Avec plaisir mon pote ! 🐕 J'ai hâte de te rencontrer. À très vite !";
    }

    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('woof')) {
        return "Wouf wouf ! 🐕 Ravi de te parler ! Tu as des questions sur la niche ?";
    }

    return "Super ! Je note ça. N'hésite pas si t'as d'autres questions avant ton arrivée ! 🐾";
}
