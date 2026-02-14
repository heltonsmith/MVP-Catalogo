import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils';
import { useToast } from '../ui/Toast';

export function ChatWidget({ companyName, companyLogo, isDemo }) {
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: `¡Hola! 👋 Soy del equipo de ${companyName}. ¿En qué podemos ayudarte hoy?`,
            sender: 'store',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        if (isDemo) {
            showToast('Esta es una función de demostración. En la versión real, podrías chatear directamente con la tienda.', 'demo');
            setMessage('');
            return;
        }

        const newMessage = {
            id: Date.now(),
            text: message,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMessage]);
        setMessage('');

        // Mock auto-reply
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: 'Gracias por escribirnos. Te responderemos lo antes posible.',
                sender: 'store',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 1500);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 flex h-[500px] w-[calc(100vw-2rem)] sm:w-[350px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
                    >
                        {/* Chat Header */}
                        <div className="flex items-center justify-between bg-primary-700 p-4 text-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-white p-0.5 shadow-md ring-2 ring-white/20">
                                    <img src={companyLogo} alt={companyName} className="h-full w-full rounded-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base tracking-tight">{companyName}</h3>
                                    <span className="flex items-center text-[10px] text-primary-100">
                                        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        En línea ahora
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 text-white hover:bg-white/10"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4 scrollbar-hide"
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[80%]",
                                        msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2 text-sm shadow-sm",
                                            msg.sender === 'user'
                                                ? "bg-primary-600 text-white rounded-tr-none"
                                                : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                    <span className="mt-1 text-[10px] text-slate-400 font-medium">
                                        {msg.time}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-4">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 rounded-full bg-slate-50 border-none h-10 px-4 text-sm focus:ring-1 focus:ring-primary-500"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="h-10 w-10 rounded-full shadow-lg shadow-primary-200"
                                    disabled={!message.trim()}
                                >
                                    <Send size={18} />
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
                    isOpen ? "bg-slate-800 rotate-90" : "bg-emerald-500"
                )}
            >
                {isOpen ? (
                    <X className="h-7 w-7 text-white" />
                ) : (
                    <MessageCircle className="h-7 w-7 text-white" />
                )}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        1
                    </span>
                )}
            </motion.button>
        </div>
    );
}
