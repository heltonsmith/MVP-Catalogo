import { useState } from 'react';
import { MessageCircle, Search, Store, Send, Filter, ChevronRight, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../utils';

export default function UserMessages() {
    const [selectedId, setSelectedId] = useState(1);
    const [messageText, setMessageText] = useState('');

    const interactions = [
        {
            id: 1,
            store: "EcoVerde Spa",
            lastMessage: "Gracias por escribirnos. Te responderemos lo antes posible.",
            time: "10:26 AM",
            unread: true,
            logo: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100"
        },
        {
            id: 2,
            store: "TechStore Chile",
            lastMessage: "Su pedido ha sido procesado.",
            time: "Ayer",
            unread: false,
            logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100"
        }
    ];

    const [chatHistory, setChatHistory] = useState([
        { id: 1, text: "Hola, vi sus productos en el catálogo.", sender: 'user', time: '10:25 AM' },
        { id: 2, text: "¿Tienen stock del Cepillo de Bambú? Me interesa comprar 5.", sender: 'user', time: '10:26 AM' },
        { id: 3, text: "Gracias por escribirnos. Te responderemos lo antes posible.", sender: 'store', time: '10:26 AM' }
    ]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        setChatHistory([...chatHistory, {
            id: Date.now(),
            text: messageText,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setMessageText('');
    };

    const currentChat = interactions.find(i => i.id === selectedId);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex h-[calc(100vh-250px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-100">
                {/* Conversations List */}
                <div className="flex w-full md:w-80 flex-col border-r border-slate-100 bg-slate-50/50">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-slate-900 mb-4">Mis Mensajes</h1>
                        <div className="relative">
                            <Input
                                placeholder="Buscar tiendas..."
                                className="pl-9 h-11 bg-white border-none text-xs rounded-xl shadow-sm"
                            />
                            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-4">
                        {interactions.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={cn(
                                    "w-full p-4 mb-2 flex items-start gap-3 transition-all rounded-2xl relative",
                                    selectedId === item.id
                                        ? "bg-white shadow-md ring-1 ring-slate-200/50"
                                        : "hover:bg-white/50"
                                )}
                            >
                                <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm shrink-0">
                                    <img src={item.logo} alt={item.store} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-slate-900 text-sm truncate">{item.store}</h4>
                                        <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate line-clamp-1">{item.lastMessage}</p>
                                </div>
                                {item.unread && (
                                    <div className="h-2 w-2 rounded-full bg-primary-600 mt-2" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="hidden md:flex flex-1 flex-col bg-white">
                    {currentChat ? (
                        <>
                            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50 shadow-sm z-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl overflow-hidden">
                                        <img src={currentChat.logo} alt={currentChat.store} className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{currentChat.store}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tienda en línea</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-primary-600 font-bold">Ver Tienda</Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-slate-50/20">
                                {chatHistory.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex flex-col max-w-[75%]",
                                            msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "rounded-2xl px-5 py-3 text-sm shadow-sm",
                                                msg.sender === 'user'
                                                    ? "bg-primary-600 text-white rounded-tr-none"
                                                    : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                            )}
                                        >
                                            {msg.text}
                                        </div>
                                        <span className="mt-1.5 text-[10px] text-slate-400 font-medium uppercase">{msg.time}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-white border-t border-slate-100">
                                <form onSubmit={handleSend} className="flex gap-4">
                                    <Input
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder={`Escribir a ${currentChat.store}...`}
                                        className="flex-1 h-12 bg-slate-50 border-none rounded-2xl px-6 text-sm focus:ring-2 focus:ring-primary-100"
                                    />
                                    <Button type="submit" className="h-12 px-8 rounded-2xl shadow-lg shadow-primary-100 font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-3" disabled={!messageText.trim()}>
                                        <Send size={18} />
                                        <span className="tracking-wide">Enviar</span>
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center bg-slate-50/30">
                            <div className="text-center">
                                <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Selecciona un chat</h3>
                                <p className="text-slate-500 text-sm">Escoge una tienda para continuar la conversación.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
