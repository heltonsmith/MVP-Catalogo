import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Search, User, Send, Filter, MoreVertical, Check, Zap, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../utils';
import { useAuth } from '../context/AuthContext';
import { PlanUpgradeModal } from '../components/dashboard/PlanUpgradeModal';
import { useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useChat } from '../hooks/useChat';

export default function DashboardMessages() {
    const { company: authCompany } = useAuth();
    const location = useLocation();

    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            setSelectedCustomerId(id);
            setShowChatOnMobile(true);
        }
    }, [searchParams]);

    // Fetch conversations (unique customers who have messaged this company)
    useEffect(() => {
        if (!authCompany?.id) return;

        const fetchConversations = async () => {
            setLoadingConversations(true);
            try {
                // Determine unique customers by grouping messages
                // This is a bit complex in raw SQL without a VIEW, so we fetch messages and group in JS for MVP
                // Optimally, create a view: `CREATE VIEW conversations AS SELECT DISTINCT ...`

                // Fetch latest message per customer for this company
                // Using a slightly inefficient but working method for now: fetch all distinct customer_ids
                // OR better: fetch users logic.

                // Let's fetch messages, order by desc, then unique by customer_id
                const { data, error } = await supabase
                    .from('messages')
                    .select('customer_id, created_at, content, is_read, sender_type')
                    .eq('company_id', authCompany.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Group by customer_id and keep only the latest message
                const uniqueConversations = [];
                const seenCustomers = new Set();

                // We also need customer details (name/email). 
                // We can fetch them separately or use a join if we had the relation set up strictly in JS types
                // Let's fetch all unique customer profiles after identifying IDs

                for (const msg of data) {
                    if (!seenCustomers.has(msg.customer_id)) {
                        seenCustomers.add(msg.customer_id);
                        uniqueConversations.push({
                            ...msg,
                            count: 1 // We could count unread here
                        });
                    }
                }

                // Fetch profiles for these customers
                if (uniqueConversations.length > 0) {
                    const customerIds = uniqueConversations.map(c => c.customer_id);
                    const { data: profiles } = await supabase
                        .from('profiles') // Assuming 'profiles' table exists and matches auth.users
                        .select('id, full_name, email, avatar_url, role') // Adjust column names based on your schema
                        .in('id', customerIds);

                    // Merge profile data
                    const conversationsWithProfiles = uniqueConversations.map(conv => {
                        const profile = profiles?.find(p => p.id === conv.customer_id);
                        return {
                            ...conv,
                            customerName: profile?.role === 'admin' ? 'Admin Ktalogoo' : (profile?.full_name || profile?.email || 'Cliente'),
                            customerEmail: profile?.role === 'admin' ? 'admin@ktalogoo.com' : profile?.email,
                            avatarUrl: profile?.role === 'admin' ? '/favicon-transparente.png' : profile?.avatar_url
                        };
                    });
                    setConversations(conversationsWithProfiles);
                } else {
                    setConversations([]);
                }

            } catch (err) {
                console.error("Error fetching conversations:", err);
            } finally {
                setLoadingConversations(false);
            }
        };

        fetchConversations();

        // Real-time subscription for new messages
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `company_id=eq.${authCompany.id}`
                },
                async (payload) => {
                    // Check if sender is 'customer' (we only care about incoming messages for the list)
                    // Actually we care about 'store' too to update the snippet
                    const newMessage = payload.new;

                    // Fetch profile if it's a new customer we haven't identified yet
                    let customerName = 'Cliente';
                    let customerEmail = null;
                    let customerAvatar = null;

                    if (newMessage.sender_type === 'customer') {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('full_name, email, avatar_url, role')
                            .eq('id', newMessage.customer_id)
                            .single();

                        if (profile) {
                            customerName = profile.role === 'admin' ? 'Admin Ktalogoo' : (profile.full_name || profile.email);
                            customerEmail = profile.role === 'admin' ? 'admin@ktalogoo.com' : profile.email;
                            customerAvatar = profile.role === 'admin' ? '/favicon-transparente.png' : profile.avatar_url;
                        }
                    }

                    setConversations(prev => {
                        const otherConvs = prev.filter(c => c.customer_id !== newMessage.customer_id);
                        // Construct updated conversation object
                        const existingConv = prev.find(c => c.customer_id === newMessage.customer_id);

                        const updatedConv = {
                            customer_id: newMessage.customer_id,
                            created_at: newMessage.created_at,
                            content: newMessage.content,
                            is_read: newMessage.is_read,
                            sender_type: newMessage.sender_type,
                            customerName: existingConv?.customerName || customerName,
                            customerEmail: existingConv?.customerEmail || customerEmail,
                            avatarUrl: existingConv?.avatarUrl || customerAvatar,
                            count: (existingConv?.count || 0) + 1
                        };

                        return [updatedConv, ...otherConvs];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [authCompany?.id]);


    // Chat Hook for selected customer
    const { messages, loading: messagesLoading, sendMessage, markAsRead } = useChat({
        companyId: authCompany?.id,
        customerId: selectedCustomerId,
        enabled: !!selectedCustomerId
    });

    useEffect(() => {
        if (selectedCustomerId && messages.length > 0) {
            markAsRead('customer');
        }
    }, [selectedCustomerId, messages, markAsRead]);

    const handleSelectChat = (customerId) => {
        setSelectedCustomerId(customerId);
        setShowChatOnMobile(true);
    };

    const handleBackToMobileList = () => {
        setShowChatOnMobile(false);
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        const success = await sendMessage(replyText, 'store');
        if (success) {
            setReplyText('');
        }
    };

    const isFreePlan = (authCompany?.plan === 'free' || !authCompany?.plan);

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ring-1 ring-slate-100">
            {/* Sidebar List */}
            <div className={cn(
                "w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 transition-all duration-300 absolute md:relative z-20 h-full",
                showChatOnMobile ? "-translate-x-full md:translate-x-0" : "translate-x-0"
            )}>
                <div className="p-5 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Mensajes</h2>
                        <div className="flex gap-2">
                            {/* Tools like filter could go here */}
                        </div>
                    </div>
                    <div className="relative group">
                        <Input
                            placeholder="Buscar chats..."
                            className="pl-9 h-10 bg-white border-slate-200 focus:border-primary-300 transition-all rounded-xl text-sm"
                        />
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loadingConversations ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 text-sm">No hay conversaciones aún.</div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.customer_id}
                                onClick={() => handleSelectChat(conv.customer_id)}
                                className={cn(
                                    "p-3 rounded-2xl cursor-pointer transition-all border border-transparent hover:bg-white hover:shadow-sm group relative",
                                    selectedCustomerId === conv.customer_id ? "bg-white shadow-md border-slate-100 ring-1 ring-slate-100" : "hover:border-slate-100"
                                )}
                            >
                                {/* Indicator for active selection */}
                                {selectedCustomerId === conv.customer_id && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary-500 rounded-r-full" />
                                )}

                                <div className="flex justify-between mb-1">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {conv.avatarUrl ? (
                                            <img src={conv.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <User size={12} className="text-slate-400" />
                                            </div>
                                        )}
                                        <h3 className={cn("font-bold text-sm truncate", selectedCustomerId === conv.customer_id ? "text-primary-700" : "text-slate-700")}>
                                            {conv.customerName}
                                        </h3>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                                        {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className={cn("text-xs line-clamp-1", conv.is_read ? "text-slate-400" : "text-slate-600 font-semibold", isFreePlan && "blur-[3px] select-none")}>
                                    {conv.sender_type === 'store' ? 'Tú: ' : ''}{conv.content}
                                </p>
                            </div>
                        )))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-slate-50/30 transition-all duration-300 absolute md:relative z-10 w-full h-full",
                showChatOnMobile ? "translate-x-0" : "translate-x-full md:translate-x-0"
            )}>
                {selectedCustomerId ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-sm z-20">
                            <div className="flex items-center gap-3">
                                {/* Only show back button on mobile */}
                                <button onClick={handleBackToMobileList} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>

                                {conversations.find(c => c.customer_id === selectedCustomerId)?.avatarUrl ? (
                                    <img
                                        src={conversations.find(c => c.customer_id === selectedCustomerId)?.avatarUrl}
                                        alt="Avatar"
                                        className="h-10 w-10 rounded-full object-cover border border-indigo-50 shadow-inner"
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 border border-indigo-50 shadow-inner">
                                        <User size={20} />
                                    </div>
                                )}
                                <div>
                                    <h2 className="font-bold text-slate-800 leading-tight">
                                        {conversations.find(c => c.customer_id === selectedCustomerId)?.customerName || 'Cliente'}
                                    </h2>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-600 tracking-wide uppercase">Activo ahora</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                                    <Search size={18} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-hidden relative">
                            <div className={cn("h-full overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth", isFreePlan && "blur-[8px] select-none pointer-events-none")}>
                                {messagesLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="animate-spin text-primary-400" size={32} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-slate-400 mt-10">No hay mensajes anteriores.</div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", msg.sender_type === 'store' ? "ml-auto items-end" : "mr-auto items-start")}>
                                            {msg.sender_type === 'store' && (
                                                <span className="text-[10px] text-slate-400 mb-1 px-1">Tú</span>
                                            )}
                                            <div className={cn(
                                                "px-5 py-3 shadow-sm text-sm relative group",
                                                msg.sender_type === 'store'
                                                    ? "bg-primary-600 text-white rounded-2xl rounded-tr-sm"
                                                    : "bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm"
                                            )}>
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium flex items-center gap-1">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msg.sender_type === 'store' && (
                                                    <Check size={12} className={cn(msg.is_read ? "text-blue-500" : "text-slate-300")} />
                                                )}
                                            </span>
                                        </div>
                                    )))}
                            </div>

                            {/* Paywall Overlay */}
                            {isFreePlan && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-white/10 backdrop-blur-[2px]">
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm text-center animate-in zoom-in-95 duration-300">
                                        <div className="h-16 w-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                            <Zap size={32} className="fill-current" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mb-3">Función Exclusiva</h3>
                                        <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
                                            Solo las tiendas con un plan de pago pueden ver los mensajes de sus potenciales clientes y cerrar ventas en tiempo real.
                                        </p>
                                        <Button
                                            onClick={() => setShowUpgradeModal(true)}
                                            className="w-full h-14 rounded-2xl font-black bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-200"
                                        >
                                            Ver planes de pago
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <form onSubmit={handleSendReply} className="flex gap-3 items-end max-w-4xl mx-auto">
                                <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-200 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-50 transition-all flex items-center px-2">
                                    <Input
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={isFreePlan ? "Mejora para chatear..." : "Escribe un mensaje..."}
                                        disabled={isFreePlan}
                                        className="border-none bg-transparent h-12 focus:ring-0 px-4 text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={!replyText.trim() || isFreePlan}
                                    className={cn(
                                        "h-12 px-6 rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2",
                                        replyText.trim() && !isFreePlan
                                            ? "bg-primary-600 hover:bg-primary-700 shadow-primary-200 hover:scale-105 active:scale-95"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    <span className="hidden md:inline">Enviar</span>
                                    <Send size={18} className={cn(replyText.trim() && !isFreePlan && "fill-current")} />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
                        <div className="h-24 w-24 bg-white rounded-[2rem] shadow-xl shadow-slate-100 flex items-center justify-center mb-6 rotate-3 transform transition-transform hover:rotate-6">
                            <MessageCircle size={48} className="text-primary-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Selecciona una conversación</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">
                            Elige un cliente de la lista para ver su historial de mensajes y responder en tiempo real.
                        </p>
                    </div>
                )}
            </div>

            <PlanUpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                companyId={authCompany?.id}
            />
        </div>
    );
}
