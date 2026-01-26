import { useState, useRef, useEffect, ReactNode } from 'react';
import { X, Send } from 'lucide-react';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { useSwipeToClose } from '../hooks/useSwipeToClose';
import { formatMessageTime } from '../utils/dateFormatters';

/**
 * ==================== CHAT MODAL ====================
 * Composant modal de chat réutilisable (DRY)
 * Utilisé par:
 * - ChatBot (assistant IA via n8n)
 * - Messages (conversations avec hôtes)
 * 
 * Features:
 * - Interface responsive avec gestion du clavier iOS
 * - Swipe down pour fermer
 * - Messages avec avatars customisables
 * - Loading state
 */

export interface ChatMessage {
    id: string;
    senderId: 'user' | 'other';
    content: string;
    timestamp: Date;
    isRead?: boolean;
}

interface ChatModalProps {
    /** État d'ouverture */
    isOpen: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Messages à afficher */
    messages: ChatMessage[];
    /** Callback envoi de message */
    onSendMessage: (content: string) => Promise<void>;
    /** Header personnalisé */
    headerContent: ReactNode;
    /** Avatar de l'autre personne (bot ou hôte) */
    otherAvatar: ReactNode;
    /** Avatar de l'utilisateur */
    userAvatar: ReactNode;
    /** Placeholder de l'input */
    placeholder?: string;
    /** Message quand pas de messages */
    emptyMessage?: string;
    /** Afficher indicateur de lecture */
    showReadStatus?: boolean;
    /** Loading state externe */
    isLoading?: boolean;
    /** Couleur des bulles utilisateur */
    userBubbleColor?: string;
    /** Couleur des bulles de l'autre */
    otherBubbleColor?: string;
}

export const ChatModal = ({
    isOpen,
    onClose,
    messages,
    onSendMessage,
    headerContent,
    otherAvatar,
    userAvatar,
    placeholder = "Ecris un message...",
    emptyMessage = "Commence la conversation !",
    showReadStatus = false,
    isLoading = false,
    userBubbleColor = 'bg-[#3B82F6]',
    otherBubbleColor = 'bg-gray-100',
}: ChatModalProps) => {
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Hook pour gérer le clavier mobile
    const { viewportHeight, isKeyboardOpen } = useKeyboardHeight({ enabled: isOpen });

    // Swipe to close
    const { swipeY, handlers } = useSwipeToClose(onClose, { enabled: isOpen });

    // Calculer la hauteur du modal
    const modalHeight = viewportHeight > 0 
        ? Math.min(viewportHeight * 0.92, viewportHeight - 10) 
        : window.innerHeight * 0.92;

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

    // Reset input on close
    useEffect(() => {
        if (!isOpen) {
            setInput('');
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        const content = input.trim();
        setInput('');
        setIsSending(true);

        try {
            await onSendMessage(content);
        } catch (error) {
            console.error('Erreur envoi message:', error);
            setInput(content); // Remettre si erreur
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
                    height: `${modalHeight}px`,
                    maxHeight: '92vh',
                    animation: swipeY === 0 ? 'slideUp 0.4s ease-out' : 'none',
                    transform: `translateY(${swipeY}px)`,
                    transition: swipeY === 0 ? 'transform 0.3s ease-out' : 'none',
                }}
            >
                {/* Swipe indicator + Header */}
                <div className="touch-auto" {...handlers}>
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 bg-gray-300 rounded-full" />
                    </div>

                    {/* Header personnalisé */}
                    <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                        <button className="btn-icon" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </button>
                        {headerContent}
                        <div className="w-10" />
                    </div>
                </div>

                {/* Messages */}
                <div 
                    className="flex-1 overflow-y-auto p-4 space-y-4 touch-auto overscroll-contain"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <p className="text-secondary text-sm">{emptyMessage}</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-end gap-2 ${
                                    message.senderId === 'user' ? 'flex-row-reverse' : ''
                                }`}
                            >
                                {/* Avatar */}
                                <div className="shrink-0">
                                    {message.senderId === 'user' ? userAvatar : otherAvatar}
                                </div>

                                {/* Message bubble */}
                                <div
                                    className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                                        message.senderId === 'user'
                                            ? `${userBubbleColor} text-white rounded-br-md`
                                            : `${otherBubbleColor} rounded-bl-md`
                                    }`}
                                >
                                    <p className={`text-sm leading-relaxed ${
                                        message.senderId === 'user' ? 'text-white' : 'text-primary'
                                    }`}>
                                        {message.content}
                                    </p>
                                    <div className={`flex items-center gap-1 mt-1 ${
                                        message.senderId === 'user' ? 'justify-end' : ''
                                    }`}>
                                        <span className={`text-[10px] ${
                                            message.senderId === 'user' ? 'text-white/70' : 'text-secondary'
                                        }`}>
                                            {formatMessageTime(message.timestamp)}
                                        </span>
                                        {showReadStatus && message.senderId === 'user' && (
                                            <span className={`text-[10px] ${
                                                message.isRead ? 'text-white/70' : 'text-white/50'
                                            }`}>
                                                {message.isRead ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Loading indicator */}
                    {(isLoading || isSending) && (
                        <div className="flex items-end gap-2">
                            <div className="shrink-0">{otherAvatar}</div>
                            <div className={`${otherBubbleColor} px-4 py-3 rounded-2xl rounded-bl-md`}>
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
                    className="shrink-0 p-4 border-t border-gray-200 bg-white"
                    style={{ paddingBottom: isKeyboardOpen ? '16px' : 'calc(24px + env(safe-area-inset-bottom))' }}
                >
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={placeholder}
                            className="flex-1 px-4 py-3 rounded-full border border-gray-300 text-primary placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6]"
                            style={{ fontSize: '16px' }}
                            disabled={isSending}
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onTouchStart={(e) => e.preventDefault()}
                            onClick={handleSend}
                            disabled={!input.trim() || isSending}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                input.trim() && !isSending
                                    ? 'bg-[#3B82F6] text-white'
                                    : 'bg-gray-100 text-gray-400'
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