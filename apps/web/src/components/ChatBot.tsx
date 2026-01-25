import { useState, useCallback, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import { ChatModal, ChatMessage } from './ChatModal';
import { useAuth } from '../contexts/AuthContext';

/**
 * ==================== CHATBOT ====================
 * Assistant IA connecté à n8n
 * Utilise ChatModal comme base
 *
 * TODO API:
 * - POST n8n webhook → envoyer un message au chatbot
 * - GET /api/chat/history → historique des conversations
 */

interface ChatBotProps {
    isOpen: boolean;
    onClose: () => void;
}

// URL du webhook n8n (à configurer)
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const WOOBOT_BASE_URL = import.meta.env.VITE_WOOBOT_URL || 'http://localhost:3002';
const LANGUAGE_STORAGE_KEY = 'preferredLanguage';
const DEFAULT_BARKBOT_MESSAGE = 'Wouf ! 🐕 Je suis BarkBot, ton assistant AirB\'n\'Bark. Comment puis-je t\'aider aujourd\'hui ?';

export const ChatBot = ({ isOpen, onClose }: ChatBotProps) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isWoobotMode, setIsWoobotMode] = useState(true);

    const handleSendMessage = useCallback(async (content: string) => {
        // Ajouter le message utilisateur
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: 'user',
            content,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            if (isWoobotMode) {
                const preferredLanguage = user?.language
                    ?? localStorage.getItem(LANGUAGE_STORAGE_KEY)
                    ?? 'english';
                const response = await fetch(`${WOOBOT_BASE_URL}/woobot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: preferredLanguage }),
                });
                const data = await response.json();
                const botMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    senderId: 'other',
                    content: data.message || 'Je n\'ai pas compris, peux-tu reformuler ?',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
            } else if (N8N_WEBHOOK_URL) {
                // Appel au webhook n8n
                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: content,
                        sessionId: 'user-session-id', // TODO: utiliser l'ID user réel
                        timestamp: new Date().toISOString(),
                    }),
                });

                const data = await response.json();

                const botMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    senderId: 'other',
                    content: data.response || data.message || 'Je n\'ai pas compris, peux-tu reformuler ?',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
            } else {
                // Mode demo sans n8n
                await new Promise((resolve) => setTimeout(resolve, 800));
                const botMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    senderId: 'other',
                    content: getDemoResponse(content),
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
            }
        } catch (error) {
            console.error('Erreur ChatBot:', error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                senderId: 'other',
                content: 'Oups ! J\'ai eu un problème. Réessaie dans quelques instants. 🐕',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isWoobotMode, user?.language]);

    // Header du ChatBot
    const headerContent = (
        <div className="flex flex-col items-center gap-2 flex-1 justify-center">
            <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="text-base font-semibold text-primary">BarkBot</span>
            </div>
            <button
                type="button"
                onClick={() => setIsWoobotMode((prev) => !prev)}
                className="px-3 py-1 rounded-full text-xs font-medium border border-(--color-border-light) text-secondary"
            >
                {isWoobotMode ? 'Mode WooBot 🤖' : 'Mode BarkBot 🐶'}
            </button>
        </div>
    );

    // Avatar du bot
    const botAvatar = (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary">
            <Bot className="w-4 h-4 text-primary" />
        </div>
    );

    // Avatar utilisateur
    const userAvatar = (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-brand">
            <User className="w-4 h-4 text-white" />
        </div>
    );

    const setInitialMessage = useCallback(async () => {
        if (messages.length > 0) return;

        if (isWoobotMode) {
            const preferredLanguage = user?.language
                ?? localStorage.getItem(LANGUAGE_STORAGE_KEY)
                ?? 'english';
            try {
                const response = await fetch(`${WOOBOT_BASE_URL}/woobot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: preferredLanguage }),
                });
                const data = await response.json();
                setMessages([
                    {
                        id: '1',
                        senderId: 'other',
                        content: data.message || DEFAULT_BARKBOT_MESSAGE,
                        timestamp: new Date(),
                    },
                ]);
            } catch {
                setMessages([
                    {
                        id: '1',
                        senderId: 'other',
                        content: DEFAULT_BARKBOT_MESSAGE,
                        timestamp: new Date(),
                    },
                ]);
            }
            return;
        }

        setMessages([
            {
                id: '1',
                senderId: 'other',
                content: DEFAULT_BARKBOT_MESSAGE,
                timestamp: new Date(),
            },
        ]);
    }, [isWoobotMode, messages.length, user?.language]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setInitialMessage();
        }
    }, [isOpen, messages.length, setInitialMessage]);

    return (
        <ChatModal
            isOpen={isOpen}
            onClose={onClose}
            messages={messages}
            onSendMessage={handleSendMessage}
            headerContent={headerContent}
            otherAvatar={botAvatar}
            userAvatar={userAvatar}
            placeholder="Pose ta question..."
            emptyMessage="Wouf ! Comment puis-je t'aider ? 🐕"
            otherBubbleColor="bg-secondary"
            isLoading={isLoading}
        />
    );
};

/**
 * Réponses de démo quand n8n n'est pas configuré
 */
function getDemoResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('réservation') || lowerMessage.includes('reservation') || lowerMessage.includes('voyage')) {
        return 'Pour voir tes voyages, va dans l\'onglet "Voyages" en bas de l\'écran. Tu peux aussi me demander d\'annuler un séjour ! 📅🐕';
    }

    if (lowerMessage.includes('annuler')) {
        return 'Pour annuler un séjour, j\'ai besoin de l\'identifiant ou de la date. Dis-moi en plus ! 🐶';
    }

    if (lowerMessage.includes('prix') || lowerMessage.includes('tarif') || lowerMessage.includes('croquette')) {
        return 'Les prix varient selon les niches. Tu peux filtrer par prix avec le bouton "Filtre" en haut à gauche. Les prix affichés sont par nuit (en croquettes 🦴) !';
    }

    if (lowerMessage.includes('anti-chat') || lowerMessage.includes('chat')) {
        return 'L\'option Anti-Chat garantit que la niche n\'a jamais accueilli de ces félins suspects 😼🚫. Parfait pour toi si t\'es sensible ! Active ce filtre dans les options.';
    }

    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello') || lowerMessage.includes('woof')) {
        return 'Wouf wouf ! 🐕 Salut toi ! Qu\'est-ce que je peux faire pour toi aujourd\'hui ?';
    }

    if (lowerMessage.includes('merci')) {
        return 'De rien mon pote à 4 pattes ! N\'hésite pas si t\'as d\'autres questions. Wouf ! 🐕';
    }

    return 'Je suis encore un jeune chiot en apprentissage ! 🐶 Pour l\'instant, je peux t\'aider avec tes voyages, les filtres, et répondre à tes questions sur AirB\'n\'Bark. Que veux-tu savoir ?';
}
