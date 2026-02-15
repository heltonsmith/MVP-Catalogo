import { useState, useEffect } from 'react';
import { MessageCircle, Search, Store, Send, Filter, ChevronRight, User, Loader2, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';

export default function UserMessages() {
    const { user } = useAuth();
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const fetchChats = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('company_id, created_at, content, is_read, sender_type')
                    .eq('customer_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const uniqueChats = [];
                const seenCompanies = new Set();

                for (const msg of data) {
                    if (!seenCompanies.has(msg.company_id)) {
                        seenCompanies.add(msg.company_id);
                        uniqueChats.push({
                            ...msg,
                            count: 1
                        });
                    }
                }

                if (uniqueChats.length > 0) {
                    const companyIds = uniqueChats.map(c => c.company_id);
                    const { data: companies } = await supabase
                        .from('companies')
                        .select('id, name, logo_url')
                        .in('id', companyIds);

                    const chatsWithDetails = uniqueChats.map(chat => {
                        const company = companies?.find(c => c.id === chat.company_id);
                        return {
                            ...chat,
                            companyName: company?.name || 'Tienda',
                            companyLogo: company?.logo_url
                        };
                    });
                    setChats(chatsWithDetails);
                } else {
                    setChats([]);
                }
            } catch (error) {
                console.error("Error loading chats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, [user?.id]);

    const { messages, loading: messagesLoading, sendMessage, markAsRead } = useChat({
        companyId: selectedCompanyId,
        customerId: user?.id,
        enabled: !!selectedCompanyId
    });

    useEffect(() => {
        if (selectedCompanyId && messages.length > 0) {
            markAsRead('store');
        }
    }, [selectedCompanyId, messages, markAsRead]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        const success = await sendMessage(messageText, 'customer');
        if (success) {
            setMessageText('');
        }
    };

    const currentChat = chats.find(c => c.company_id === selectedCompanyId);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary-600" /></div>
    }

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
                        {chats.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 text-sm">No tienes mensajes.</div>
                        ) : (
                            chats.map((item) => (
                                <button
                                    key={item.company_id}
                                    onClick={() => setSelectedCompanyId(item.company_id)}
                                    className={cn(
                                        "w-full p-4 mb-2 flex items-start gap-3 transition-all rounded-2xl relative",
                                        selectedCompanyId === item.company_id
                                            ? "bg-white shadow-md ring-1 ring-slate-200/50"
                                            : "hover:bg-white/50"
                                    )}
                                >
                                    <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm shrink-0 bg-white">
                                        {item.companyLogo ? (
                                            <img src={item.companyLogo} alt={item.companyName} className="h-full w-full object-cover" />
                                        ) : (
                                            <Store className="h-full w-full p-2 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-slate-900 text-sm truncate">{item.companyName}</h4>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate line-clamp-1">
                                            {item.sender_type === 'customer' ? 'Tú: ' : ''}{item.content}
                                        </p>
                                    </div>
                                    {/** Unread indicator could go here if we tracked it */}
                                </button>
                            )))}
                    </div>
                </div>

                {/* Chat Interface */}
                <div className="hidden md:flex flex-1 flex-col bg-white">
                    {currentChat ? (
                        <>
                            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50 shadow-sm z-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100">
                                        {currentChat.companyLogo ? (
                                            <img src={currentChat.companyLogo} alt={currentChat.companyName} className="h-full w-full object-cover" />
                                        ) : <Store className="h-full w-full p-2 text-slate-300" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{currentChat.companyName}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tienda en línea</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-primary-600 font-bold">Ver Tienda</Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-slate-50/20">
                                {messagesLoading ? (
                                    <div className="flex justify-center h-full items-center"><Loader2 className="animate-spin text-slate-300" /></div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex flex-col max-w-[75%]",
                                                msg.sender_type === 'customer' ? "ml-auto items-end" : "mr-auto items-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "rounded-2xl px-5 py-3 text-sm shadow-sm",
                                                    msg.sender_type === 'customer'
                                                        ? "bg-primary-600 text-white rounded-tr-none"
                                                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                                )}
                                            >
                                                {msg.content}
                                            </div>
                                            <span className="mt-1.5 text-[10px] text-slate-400 font-medium uppercase flex items-center gap-1">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msg.sender_type === 'customer' && <Check size={10} className="text-slate-300" />}
                                            </span>
                                        </div>
                                    )))}
                            </div>

                            <div className="p-6 bg-white border-t border-slate-100">
                                <form onSubmit={handleSend} className="flex gap-4">
                                    <Input
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder={`Escribir a ${currentChat.companyName}...`}
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
