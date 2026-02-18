import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../utils';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    Search,
    Send,
    MoreVertical,
    Check,
    ArrowLeft,
    User,
    Store,
    Trash2,
    Loader2,
    Image as ImageIcon,
    Pencil,
    X
} from 'lucide-react';

export default function InboxPage() {
    const { user, company, profile, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // State
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [selectedChatId, setSelectedChatId] = useState(null); // This is the OTHER party's ID (company_id or customer_id)
    const [selectedChatData, setSelectedChatData] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [isMobileListVisible, setIsMobileListVisible] = useState(true);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editText, setEditText] = useState('');
    const messagesEndRef = useRef(null);
    const messageContainerRef = useRef(null);

    // Derive current role context
    // If user has a company, they might be acting as store owner. 
    // BUT this inbox is primarily for the "User" aspect (buying from other stores).
    // However, the request implies a unified inbox.
    // Let's assume:
    // - If I am a customer, I see chats with companies.
    // - If I am a store owner, I see chats with customers AND chats with other companies (if I buy stuff).
    // To keep it simple for now: We fetch all threads where user.id is sender or receiver.

    // Actually, the schema is: company_id <-> customer_id.
    // If I am a customer -> my ID is customer_id.
    // If I am a store -> my company.id is company_id.

    // Let's simplified view: 
    // Tabs: "Mis Compras" (Customer Role) vs "Mis Ventas" (Store Role)
    // Or just mix them if possible, but schema makes it tricky to direct query in one go without a join view.
    // Let's stick to "Customer Context" for now as per the "Inbox icon in Navbar" (which is the customer/public nav).
    // The "Dashboard" (which we removed Messages from) was for the Store role.
    // Challenge: User said "remove messages from dashboard, move here". So this MUST handle Store role too.

    // Simplified currentCompany logic
    const currentCompany = company;
    const hasStore = !!currentCompany || (profile?.role !== 'client' && profile?.role !== 'user' && profile?.role !== undefined);

    useEffect(() => {
        // Handle new chat initiation from URL
        const requestedChatId = searchParams.get('chatId') || searchParams.get('new_chat');
        if (requestedChatId) {
            setSelectedChatId(requestedChatId);
            // If it's from a store page (new_chat param usually), default to buying context
            if (searchParams.get('new_chat')) {
                setActiveTab('buying');
            }
        }
    }, [searchParams]);

    const [activeTab, setActiveTab] = useState('buying');

    // Initial tab selection: if user is a store owner, favor selling tab
    useEffect(() => {
        if (currentCompany && !searchParams.get('new_chat') && !searchParams.get('chatId')) {
            setActiveTab('selling');
        }
    }, [currentCompany, searchParams]);

    useEffect(() => {
        if (!user || authLoading) return;

        let isCancelled = false;

        const load = async () => {
            if (activeTab === 'selling' && !currentCompany) {
                // Wait for company if we are on selling tab
                setLoadingConversations(false);
                return;
            }

            setLoadingConversations(true);
            try {
                const results = await performFetchConversations(user, activeTab, currentCompany, selectedChatId);
                if (!isCancelled) {
                    setConversations(results);
                }
            } catch (err) {
                if (!isCancelled) console.error(err);
            } finally {
                if (!isCancelled) setLoadingConversations(false);
            }
        };

        load();

        // Subscribe to new messages for the list updates
        const channel = supabase
            .channel(`inbox_list_${activeTab}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => {
                    load();
                }
            )
            .subscribe();

        return () => {
            isCancelled = true;
            supabase.removeChannel(channel);
        };
    }, [user, currentCompany, activeTab, authLoading, selectedChatId]);

    useEffect(() => {
        if (selectedChatId) {
            fetchMessages(selectedChatId);
            setIsMobileListVisible(false);

            // Subscribe to this specific chat
            const channel = supabase
                .channel(`chat:${selectedChatId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'messages',
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            const msg = payload.new;

                            // Guard for selling mode
                            if (activeTab === 'selling' && !currentCompany) return;

                            const isMatch = activeTab === 'buying'
                                ? msg.company_id === selectedChatId && msg.customer_id === user.id
                                : msg.company_id === currentCompany?.id && msg.customer_id === selectedChatId;

                            if (isMatch) {
                                setMessages(prev => {
                                    if (prev.find(m => m.id === msg.id)) return prev;
                                    return [...prev, msg];
                                });
                            }
                        } else if (payload.eventType === 'UPDATE') {
                            setMessages(prev => prev.map(m => {
                                if (m.id !== payload.new.id) return m;
                                // Only mark as edited if the content has changed from our local state
                                const contentChanged = payload.new.content !== m.content;
                                return { ...payload.new, is_edited: contentChanged || m.is_edited };
                            }));
                        } else if (payload.eventType === 'DELETE') {
                            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setIsMobileListVisible(true);
        }
    }, [selectedChatId, activeTab, user, currentCompany]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Robust mark-as-read when messages change or chat is selected
    useEffect(() => {
        if (selectedChatId && messages.length > 0) {
            const hasUnreadForMe = messages.some(m => !m.is_read && (
                (activeTab === 'buying' && m.sender_type === 'store') ||
                (activeTab === 'selling' && m.sender_type === 'customer')
            ));
            if (hasUnreadForMe) {
                markAsRead(selectedChatId);
            }
        }
    }, [messages, selectedChatId, activeTab]);

    const scrollToBottom = () => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    };

    const performFetchConversations = async (currentUser, currentTab, currentComp, openChatId) => {
        if (!currentUser) return [];
        try {
            let data = [];

            if (currentTab === 'buying') {
                // I am the customer, finding companies I talked to
                const { data: msgs, error } = await supabase
                    .from('messages')
                    .select('company_id, content, created_at, is_read, sender_type')
                    .eq('customer_id', currentUser.id)
                    .eq('visible_to_customer', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Group by company_id
                const groups = {};
                msgs.forEach(m => {
                    if (!groups[m.company_id]) {
                        groups[m.company_id] = { ...m, count: 0 };
                    }
                    if (!m.is_read && m.sender_type === 'store' && m.company_id !== openChatId) {
                        groups[m.company_id].count++;
                    }
                });

                // Fetch company details
                const companyIds = Object.keys(groups);
                if (companyIds.length > 0) {
                    const { data: companies } = await supabase
                        .from('companies')
                        .select('id, name, logo, slug')
                        .in('id', companyIds);

                    data = companyIds.map(id => {
                        const comp = companies?.find(c => c.id === id);
                        return {
                            id: id,
                            name: comp?.name || 'Tienda Desconocida',
                            avatar: comp?.logo,
                            slug: comp?.slug,
                            lastMessage: groups[id].content,
                            date: groups[id].created_at,
                            unread: groups[id].count,
                            role: 'store'
                        };
                    });
                }

            } else if (currentTab === 'selling' && currentComp) {
                // I am the store, finding customers who talked to me
                const { data: msgs, error } = await supabase
                    .from('messages')
                    .select('customer_id, content, created_at, is_read, sender_type')
                    .eq('company_id', currentComp.id)
                    .eq('visible_to_store', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Group by customer_id
                const groups = {};
                msgs.forEach(m => {
                    if (!groups[m.customer_id]) {
                        groups[m.customer_id] = { ...m, count: 0 };
                    }
                    if (!m.is_read && m.sender_type === 'customer' && m.customer_id !== openChatId) {
                        groups[m.customer_id].count++;
                    }
                });

                // Fetch customer details
                const customerIds = Object.keys(groups);
                if (customerIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, avatar_url')
                        .in('id', customerIds);

                    data = customerIds.map(id => {
                        const prof = profiles?.find(p => p.id === id);
                        return {
                            id: id,
                            name: prof?.full_name || prof?.email || 'Cliente',
                            avatar: prof?.avatar_url,
                            lastMessage: groups[id].content,
                            date: groups[id].created_at,
                            unread: groups[id].count,
                            role: 'customer'
                        };
                    });
                }
            }

            // Sort by date desc
            return data.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (err) {
            console.error('Error in performFetchConversations:', err);
            return [];
        }
    };

    const fetchMessages = async (chatId) => {
        if (!user) return;
        if (activeTab === 'selling' && !currentCompany) return;
        setLoadingMessages(true);
        try {
            const query = supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true }); // We want oldest first for chat log

            if (activeTab === 'buying') {
                query.eq('company_id', chatId).eq('customer_id', user.id).eq('visible_to_customer', true);
            } else {
                query.eq('company_id', currentCompany?.id).eq('customer_id', chatId).eq('visible_to_store', true);
            }

            const { data, error } = await query;
            if (error) throw error;
            setMessages(data || []);

            // Set chat header data from conversations list if available
            const chatInfo = conversations.find(c => c.id === chatId);
            if (chatInfo) {
                setSelectedChatData(chatInfo);
            } else {
                // Fetch info if not in sidebar (could be a new chat or a deleted/hidden one)
                if (activeTab === 'buying') {
                    const { data: comp } = await supabase.from('companies').select('id, name, logo, slug').eq('id', chatId).maybeSingle();
                    if (comp) setSelectedChatData({ id: chatId, name: comp.name, avatar: comp.logo, slug: comp.slug, role: 'store' });
                } else {
                    const { data: prof } = await supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', chatId).maybeSingle();
                    if (prof) setSelectedChatData({ id: chatId, name: prof.full_name || prof.email, avatar: prof.avatar_url, role: 'customer' });
                }
            }

        } catch (err) {
            console.error(err);
            showToast('Error al cargar mensajes', 'error');
        } finally {
            setLoadingMessages(false);
        }
    };

    const markAsRead = async (chatId) => {
        if (!user) return;
        try {
            const unreadFilter = activeTab === 'buying'
                ? { company_id: chatId, customer_id: user.id, sender_type: 'store' }
                : { company_id: currentCompany?.id, customer_id: chatId, sender_type: 'customer' };

            if (activeTab === 'selling' && !currentCompany?.id) return;

            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .match({ ...unreadFilter, is_read: false });

            if (error) throw error;

            // Optimistically update conversation list unread count
            setConversations(prev => prev.map(c => c.id === chatId ? { ...c, unread: 0 } : c));

        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleSelectChat = (id, tab = activeTab) => {
        setSelectedChatId(id);
        // Optimistic clear in the list
        setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedChatId) return;

        const content = messageText.trim();
        setMessageText(''); // Optimistic clear

        try {
            const msgData = {
                content,
                is_read: false,
                sender_type: activeTab === 'buying' ? 'customer' : 'store',
                company_id: activeTab === 'buying' ? selectedChatId : currentCompany.id,
                customer_id: activeTab === 'buying' ? user.id : selectedChatId
            };

            const { data, error } = await supabase.from('messages').insert(msgData).select().single();
            if (error) throw error;

            // Restoration Logic: If this conversation was "deleted" (hidden), restore visibility for all previous messages
            // This ensures the conversation reappears in the sidebar for both parties.
            const { error: restoreError } = await supabase
                .from('messages')
                .update({ visible_to_customer: true, visible_to_store: true })
                .eq('company_id', msgData.company_id)
                .eq('customer_id', msgData.customer_id);

            if (restoreError) console.error('Error restoring visibility:', restoreError);

            if (data) {
                setMessages(prev => {
                    if (prev.find(m => m.id === data.id)) return prev;
                    return [...prev, data];
                });

                // Force a reload of conversations to update the sidebar immediately
                const results = await performFetchConversations(user, activeTab, currentCompany, selectedChatId);
                setConversations(results);
            }

        } catch (err) {
            console.error(err);
            showToast('Error al enviar', 'error');
            setMessageText(content); // Restore text on error
        }
    };

    const handleDeleteConversation = async () => {
        if (!confirm('¿Estás seguro de borrar esta conversación? Se eliminarán los mensajes para ti.')) return;

        try {
            const visibilityField = activeTab === 'buying' ? 'visible_to_customer' : 'visible_to_store';
            const otherVisibilityField = activeTab === 'buying' ? 'visible_to_store' : 'visible_to_customer';

            // 1. Hide for me
            const hideQuery = supabase.from('messages').update({ [visibilityField]: false });
            if (activeTab === 'buying') {
                hideQuery.eq('company_id', selectedChatId).eq('customer_id', user.id);
            } else {
                hideQuery.eq('company_id', currentCompany.id).eq('customer_id', selectedChatId);
            }
            const { error: hideError } = await hideQuery;
            if (hideError) throw hideError;

            // 2. Cleanup: If both hidden, delete permanently
            const deleteQuery = supabase.from('messages').delete().eq('visible_to_customer', false).eq('visible_to_store', false);
            if (activeTab === 'buying') {
                deleteQuery.eq('company_id', selectedChatId).eq('customer_id', user.id);
            } else {
                deleteQuery.eq('company_id', currentCompany.id).eq('customer_id', selectedChatId);
            }
            await deleteQuery;

            showToast('Conversación eliminada para ti', 'success');
            setConversations(prev => prev.filter(c => c.id !== selectedChatId));
            setSelectedChatId(null);
            setIsMobileListVisible(true);

        } catch (err) {
            console.error(err);
            showToast('Error al eliminar', 'error');
        }
    };

    const handleDeleteMessage = async (msgId) => {
        try {
            const { error } = await supabase.from('messages').delete().eq('id', msgId);
            if (error) throw error;
        } catch (err) {
            console.error(err);
        }
    };

    const startEditing = (msg) => {
        setEditingMessageId(msg.id);
        setEditText(msg.content);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditText('');
    };

    const saveEdit = async (msgId) => {
        if (!editText.trim()) return;
        try {
            const { error } = await supabase.from('messages').update({ content: editText }).eq('id', msgId);
            if (error) throw error;
            setEditingMessageId(null);
        } catch (err) {
            console.error(err);
            showToast('Error al editar', 'error');
        }
    };

    return (
        <div className="bg-slate-50 flex flex-col min-h-screen">
            {/* Simple Top Bar */}
            <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">Bandeja de Entrada</h1>
                    </div>

                    {hasStore && (
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => { setActiveTab('buying'); setSelectedChatId(null); }}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    activeTab === 'buying' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Mis Compras
                            </button>
                            <button
                                onClick={() => { setActiveTab('selling'); setSelectedChatId(null); }}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    activeTab === 'selling' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Mis Ventas
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:px-8 flex flex-col md:flex-row gap-4 h-[500px] my-8 relative shrink-0">
                {/* Conversations Sidebar */}
                <div className={cn(
                    "w-full md:w-72 lg:w-80 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full min-h-0",
                    !isMobileListVisible && "hidden md:flex"
                )}>
                    <div className="p-4 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input placeholder="Buscar..." className="pl-9 bg-slate-50 border-transparent focus:bg-white transition-all h-10" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {(loadingConversations || authLoading || (activeTab === 'selling' && !currentCompany)) ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
                                <Loader2 className="animate-spin h-6 w-6 text-primary-600" />
                                <p className="text-xs font-medium animate-pulse">Cargando...</p>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <MessageCircle size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No hay conversaciones activas.</p>
                            </div>
                        ) : (
                            conversations.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => handleSelectChat(chat.id)}
                                    className={cn(
                                        "w-full p-4 flex gap-3 text-left transition-colors border-b border-slate-50 hover:bg-slate-50",
                                        selectedChatId === chat.id && "bg-slate-50 border-l-4 border-l-primary-500"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                                            {chat.avatar ? (
                                                <img src={chat.avatar} alt={chat.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                    {chat.role === 'store' ? <Store size={20} /> : <User size={20} />}
                                                </div>
                                            )}
                                        </div>
                                        {/* Online Indicator Mockup */}
                                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-slate-900 truncate">{chat.name}</h3>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {new Date(chat.date).toLocaleDateString() === new Date().toLocaleDateString()
                                                    ? new Date(chat.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : new Date(chat.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={cn(
                                                "text-xs truncate max-w-[140px]",
                                                chat.unread > 0 ? "font-bold text-slate-900" : "text-slate-500"
                                            )}>
                                                {chat.lastMessage}
                                            </p>
                                            {chat.unread > 0 && (
                                                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                                                    {chat.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={cn(
                    "flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full min-h-0",
                    isMobileListVisible && "hidden md:flex"
                )}>
                    {selectedChatId ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsMobileListVisible(true)} className="md:hidden -ml-2 p-2 text-slate-400">
                                        <ArrowLeft size={20} />
                                    </button>

                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                                        {selectedChatData?.avatar ? (
                                            <img src={selectedChatData.avatar} alt={selectedChatData?.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                {selectedChatData?.role === 'store' ? <Store size={18} /> : <User size={18} />}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-slate-900">{selectedChatData?.name}</h2>
                                        {activeTab === 'buying' && selectedChatData?.slug && (
                                            <Link to={`/catalogo/${selectedChatData.slug}`} className="text-xs text-primary-600 hover:underline">
                                                Ver Tienda
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeleteConversation}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Borrar conversación"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div
                                ref={messageContainerRef}
                                className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar"
                            >
                                {messages.map((msg, idx) => {
                                    const isMe = activeTab === 'buying' ? msg.sender_type === 'customer' : msg.sender_type === 'store';
                                    const showTime = idx === messages.length - 1 || messages[idx + 1].sender_type !== msg.sender_type;

                                    return (
                                        <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                            <div className={cn(
                                                "px-4 py-2.5 text-sm rounded-2xl shadow-sm relative group break-words min-w-[80px]",
                                                isMe ? "bg-primary-600 text-white rounded-tr-sm" : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm"
                                            )}>
                                                {editingMessageId === msg.id ? (
                                                    <div className="flex items-center gap-2 min-w-[120px]">
                                                        <input
                                                            value={editText}
                                                            onChange={e => setEditText(e.target.value)}
                                                            className="bg-white/20 text-white border-none rounded px-2 py-1 text-sm w-full focus:ring-1 focus:ring-white/50 placeholder-white/50"
                                                            autoFocus
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') saveEdit(msg.id);
                                                                if (e.key === 'Escape') cancelEditing();
                                                            }}
                                                        />
                                                        <button onClick={() => saveEdit(msg.id)} className="p-1 hover:bg-white/20 rounded"><Check size={14} /></button>
                                                        <button onClick={cancelEditing} className="p-1 hover:bg-white/20 rounded"><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        {msg.content}
                                                        {(msg.updated_at && msg.updated_at !== msg.created_at || msg.is_edited) && (
                                                            <span className={cn("text-[9px] mt-0.5", isMe ? "text-white/60" : "text-slate-400")}>
                                                                (editado)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {isMe && !editingMessageId && (
                                                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startEditing(msg); }}
                                                            className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-primary-600 bg-white shadow-md rounded-full border border-slate-100 transition-all active:scale-90"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                                            className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-red-500 bg-white shadow-md rounded-full border border-slate-100 transition-all active:scale-90"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {showTime && (
                                                <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1 font-medium">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && <Check size={12} className={cn(msg.is_read ? "text-blue-500" : "text-slate-300")} />}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 bg-white border-t border-slate-100">
                                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all flex items-center px-1">
                                        <Input
                                            value={messageText}
                                            onChange={e => setMessageText(e.target.value)}
                                            placeholder="Escribe un mensaje..."
                                            className="border-none bg-transparent h-11 focus:ring-0 text-slate-800 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <Button type="submit" disabled={!messageText.trim()} className="h-11 w-11 rounded-xl p-0 flex items-center justify-center bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 hover:scale-105 active:scale-95 transition-all">
                                        <Send size={18} className={cn(messageText.trim() && "ml-0.5")} />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                            <div className="h-24 w-24 bg-gradient-to-br from-primary-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-100 rotate-6 transform">
                                <MessageCircle size={40} className="text-primary-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tus Mensajes</h2>
                            <p className="text-slate-500 max-w-sm">
                                Selecciona una conversación para leer y enviar mensajes en tiempo real.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
