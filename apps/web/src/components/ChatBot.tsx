import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';

/**
 * ==================== CHATBOT ====================
 * Interface de chat connectée à n8n
 * - Messages utilisateur/bot
 * - Connexion webhook n8n
 * - Swipe down pour fermer
 */

interface Message {
    id: string;
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
}

interface ChatBotProps {
    isOpen: boolean;
    onClose: () => void;
}

// URL du webhook n8n (à configurer)
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

export const ChatBot = ({ isOpen, onClose }: ChatBotProps) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'bot',
            content: 'Wouf ! 🐕 Je suis BarkBot, ton assistant AirB\'n\'Bark. Comment puis-je t\'aider aujourd\'hui ?',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [modalHeight, setModalHeight] = useState('85vh');
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Swipe to close
    const [swipeY, setSwipeY] = useState(0);
    const touchStartRef = useRef<number | null>(null);

    // Ajuster la hauteur du modal quand le clavier s'ouvre
    useEffect(() => {
        if (!isOpen) return;

        const initialHeight = window.visualViewport?.height || window.innerHeight;

        const updateHeight = () => {
            if (window.visualViewport) {
                const vh = window.visualViewport.height;
                // Garder 85% mais max viewport height - 20px de marge en haut
                const maxHeight = vh - 20;
                const targetHeight = Math.min(vh * 0.85, maxHeight);
                setModalHeight(`${targetHeight}px`);
                
                // Détecter si le clavier est ouvert (viewport réduit de plus de 100px)
                setIsKeyboardOpen(initialHeight - vh > 100);
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
            setModalHeight('85vh');
            setIsKeyboardOpen(false);
        };
    }, [isOpen]);

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
            onClose();
        }
        setSwipeY(0);
        touchStartRef.current = null;
    };

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Appel au webhook n8n
            if (N8N_WEBHOOK_URL) {
                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: userMessage.content,
                        sessionId: 'user-session-id', // TODO: utiliser l'ID user réel
                        timestamp: userMessage.timestamp.toISOString(),
                    }),
                });

                const data = await response.json();
                
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'bot',
                    content: data.response || data.message || 'Je n\'ai pas compris, peux-tu reformuler ?',
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, botMessage]);
            } else {
                // Mode demo sans n8n
                setTimeout(() => {
                    const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        role: 'bot',
                        content: getDemoResponse(userMessage.content),
                        timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, botMessage]);
                }, 800);
            }
        } catch (error) {
            console.error('Erreur ChatBot:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                content: 'Oups ! J\'ai eu un problème. Réessaie dans quelques instants. 🐕',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
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

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-200 flex items-end bg-black/50 touch-none"
            onClick={onClose}
        >
            <div
                className="w-full bg-white rounded-t-3xl overflow-hidden flex flex-col touch-none"
                onClick={(e) => e.stopPropagation()}
                style={{
                    height: modalHeight,
                    maxHeight: '85vh',
                    animation: swipeY === 0 ? 'slideUp 0.4s ease-out' : 'none',
                    transform: `translateY(${swipeY}px)`,
                    transition: swipeY === 0 ? 'transform 0.3s ease-out' : 'none',
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
                    <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
                        <button className="btn-icon" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-primary" />
                            <span className="text-base font-semibold text-primary">BarkBot</span>
                        </div>
                        <div className="w-10" />
                    </div>
                </div>

                {/* Messages */}
                <div 
                    className="flex-1 overflow-y-auto p-4 space-y-4 touch-auto overscroll-contain"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex items-end gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    message.role === 'bot'
                                        ? 'bg-secondary'
                                        : 'bg-blue-500'
                                }`}
                            >
                                {message.role === 'bot' ? (
                                    <Bot className="w-4 h-4 text-primary" />
                                ) : (
                                    <User className="w-4 h-4 text-white" />
                                )}
                            </div>

                            {/* Message bubble */}
                            <div
                                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                                    message.role === 'bot'
                                        ? 'bg-secondary rounded-bl-md'
                                        : 'bg-blue-500 rounded-br-md'
                                }`}
                            >
                                <p className={`text-sm leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-primary'}`}>
                                    {message.content}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex items-end gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div 
                    className={`shrink-0 p-4 border-t border-gray-200 bg-white ${isKeyboardOpen ? '' : 'pb-9'}`}
                >
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Pose ta question..."
                            className="flex-1 px-4 py-3 rounded-full border border-gray-300 text-sm text-primary placeholder:text-gray-400 focus:outline-none focus:border-primary"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onTouchStart={(e) => e.preventDefault()}
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                input.trim() && !isLoading
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-secondary text-gray-400'
                            }`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
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
/**
 * Réponses de démo quand n8n n'est pas configuré
 */
function getDemoResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('réservation') || lowerMessage.includes('reservation')) {
        return 'Pour voir tes réservations, va dans l\'onglet "Réservations" en bas de l\'écran. Tu peux aussi me demander d\'annuler une réservation spécifique ! 📅';
    }

    if (lowerMessage.includes('annuler')) {
        return 'Pour annuler une réservation, j\'ai besoin de l\'identifiant ou de la date de ta réservation. Peux-tu me donner plus de détails ? 🐕';
    }

    if (lowerMessage.includes('prix') || lowerMessage.includes('tarif')) {
        return 'Les prix varient selon les niches. Tu peux filtrer par prix avec le bouton "Filtre" en haut à gauche. Les prix affichés sont par nuit ! 💰';
    }

    if (lowerMessage.includes('anti-chat') || lowerMessage.includes('chat')) {
        return 'L\'option Anti-Chat garantit que la niche n\'a jamais accueilli de chats. Parfait pour les toutous sensibles ! Tu peux activer ce filtre dans les options. 🐱🚫';
    }

    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
        return 'Wouf wouf ! 🐕 Ravi de te voir ! Comment puis-je t\'aider aujourd\'hui ?';
    }

    if (lowerMessage.includes('merci')) {
        return 'Avec plaisir ! N\'hésite pas si tu as d\'autres questions. Wouf ! 🐕';
    }

    return 'Je suis encore en apprentissage ! 🐕 Pour l\'instant, je peux t\'aider avec tes réservations, les filtres, et répondre à tes questions sur AirB\'n\'Bark. Que veux-tu savoir ?';
}
