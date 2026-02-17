import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    MessageSquare,
    Search,
    Store,
    Clock,
    Send,
    User,
    MoreVertical,
    CheckCheck,
    Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../utils';
import { useChat } from '../../hooks/useChat';

export default function CustomerMessages() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) setSelectedCompanyId(id);
    }, [searchParams]);

    useEffect(() => {
        if (!user?.id) return;

        const fetchChats = async () => {
            setLoading(true);
            try {
                // Fetch unique companies messaged by this user
                // Similar logic to DashboardMessages but inverted
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
        if (!replyText.trim()) return;

        const success = await sendMessage(replyText, 'customer');
        if (success) {
            setReplyText('');
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] bg-white rounded-[3rem] shadow-sm flex items-center justify-center animate-pulse border border-slate-100">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 text-slate-300 animate-spin mx-auto mb-4" />
                    <div className="h-4 w-32 bg-slate-100 rounded-full mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-12rem)] min-h-[500px] flex flex-col md:flex-row bg-white rounded-[3rem] shadow-sm overflow-hidden border border-slate-100">
            {/* Sidebar: Chat List */}
            <div className="w-full md:w-80 border-r border-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="text-primary-600" size={20} /> Mensajes
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <Input
                            placeholder="Buscar chats..."
                            className="pl-9 h-10 bg-slate-50 border-none rounded-xl text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {chats.length === 0 ? (
                        <EmptyState />
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.company_id}
                                onClick={() => setSelectedCompanyId(chat.company_id)}
                                className={cn(
                                    "p-3 rounded-2xl cursor-pointer transition-all border border-transparent hover:bg-slate-50 group relative",
                                    selectedCompanyId === chat.company_id ? "bg-slate-50 border-slate-100" : ""
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                        {chat.companyLogo ? (
                                            <img src={chat.companyLogo} alt={chat.companyName} className="h-full w-full object-cover" />
                                        ) : (
                                            <Store size={20} className="text-slate-400 m-auto h-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h4 className={cn("font-bold text-sm truncate", selectedCompanyId === chat.company_id ? "text-primary-700" : "text-slate-800")}>
                                                {chat.companyName}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {new Date(chat.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate font-medium">
                                            {chat.sender_type === 'customer' ? 'Tú: ' : ''}{chat.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-slate-50/30 flex flex-col relative">
                {selectedCompanyId ? (
                    <>
                        <div className="h-16 px-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex items-center justify-between shrink-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                                    {chats.find(c => c.company_id === selectedCompanyId)?.companyLogo ? (
                                        <img src={chats.find(c => c.company_id === selectedCompanyId)?.companyLogo} className="h-full w-full object-cover" />
                                    ) : <Store className="h-full w-full p-2 text-slate-400" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight">
                                        {chats.find(c => c.company_id === selectedCompanyId)?.companyName}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-600 tracking-wide uppercase">En línea</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messagesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-400 text-sm">No hay mensajes en esta conversación.</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.sender_type === 'customer' ? "ml-auto items-end" : "mr-auto items-start")}>
                                        <div className={cn(
                                            "px-4 py-2.5 shadow-sm text-sm break-words relative",
                                            msg.sender_type === 'customer'
                                                ? "bg-primary-600 text-white rounded-2xl rounded-tr-sm"
                                                : "bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium select-none">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <Input
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Escribe tu mensaje..."
                                    className="flex-1 bg-slate-50 border-transparent focus:bg-white transition-all h-11 rounded-xl"
                                />
                                <Button type="submit" disabled={!replyText.trim()} className="h-11 w-11 rounded-xl p-0 shrink-0 shadow-lg shadow-primary-100">
                                    <Send size={18} className={cn(replyText.trim() ? "translate-x-0.5" : "text-primary-200")} />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="h-24 w-24 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 border border-slate-50">
                            <MessageSquare size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Selecciona una conversación</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium">Aquí podrás chatear directamente con los dueños de las tiendas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-12">
            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Store size={20} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sin chats activos</p>
            <p className="text-xs text-slate-400 px-4">Aún no has enviado mensajes a ninguna tienda.</p>
        </div>
    );
}
