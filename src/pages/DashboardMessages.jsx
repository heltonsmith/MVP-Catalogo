import { useState, useMemo } from 'react';
import { MessageCircle, Search, User, Send, Filter, MoreVertical, Check, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../utils';
import { CONVERSATIONS, CHATS, COMPANIES } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { PlanUpgradeModal } from '../components/dashboard/PlanUpgradeModal';
import { useLocation } from 'react-router-dom';

export default function DashboardMessages() {
    const { company: authCompany } = useAuth();
    const location = useLocation();

    // Check for demo mode
    const isDemo = location.pathname.includes('/demo');
    const isDemoRestaurant = location.pathname.includes('/demo/restaurante');
    const demoCompany = isDemoRestaurant ? COMPANIES[2] : COMPANIES[0];

    const company = isDemo ? { ...demoCompany, plan: 'pro' } : authCompany;
    const [selectedId, setSelectedId] = useState(1);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [localReplies, setLocalReplies] = useState({}); // { 1: [msg], 2: [msg] }

    const [showChatOnMobile, setShowChatOnMobile] = useState(false);

    // Filter conversations by company in demo mode
    const conversations = isDemo
        ? CONVERSATIONS.filter(c => c.companyId === demoCompany.id)
        : CONVERSATIONS;

    const currentChat = useMemo(() =>
        conversations.find(c => c.id === selectedId)
        , [selectedId, conversations]);

    const chatHistory = useMemo(() => {
        const baseChat = CHATS[selectedId] || [];
        const extraReplies = localReplies[selectedId] || [];
        return [...baseChat, ...extraReplies];
    }, [selectedId, localReplies]);

    const handleSelectChat = (id) => {
        setSelectedId(id);
        setShowChatOnMobile(true);
    };

    const handleBackToMobileList = () => {
        setShowChatOnMobile(false);
    };

    const handleSendReply = (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        if (isDemo) {
            showToast("Esta es una demostración. En la versión real podrás enviar mensajes.", "info");
            setReplyText('');
            return;
        }

        const newMsg = {
            id: Date.now(),
            text: replyText,
            sender: 'store',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setLocalReplies(prev => ({
            ...prev,
            [selectedId]: [...(prev[selectedId] || []), newMsg]
        }));
        setReplyText('');
    };

    if (company?.plan === 'free' && !isDemo) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)] bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />

                <div className="relative z-10 max-w-sm">
                    <div className="h-20 w-20 bg-primary-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-100/50">
                        <MessageCircle size={40} className="text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Mensajería PRO</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        Chatea directamente con tus clientes desde tu panel y cierra más ventas. Esta función está disponible exclusivamente para usuarios <strong>PRO</strong>.
                    </p>
                    <div className="space-y-3">
                        <Button
                            className="w-full h-12 font-bold shadow-lg shadow-primary-100 bg-primary-600 hover:bg-primary-700"
                            onClick={() => setShowUpgradeModal(true)}
                        >
                            <Zap size={18} className="mr-2 fill-current" />
                            Mejorar a PRO ahora
                        </Button>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Activación manual en menos de 24h
                        </p>
                    </div>
                </div>

                <PlanUpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    companyId={company.id}
                />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100dvh-130px)] md:h-[calc(100vh-180px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Sidebar / List - Hidden on mobile if chat is open */}
            <div className={cn(
                "w-full md:w-80 flex-col border-r border-slate-100 absolute inset-0 md:static z-10 bg-white md:flex transition-transform duration-300",
                showChatOnMobile ? "-translate-x-full md:translate-x-0" : "translate-x-0"
            )}>
                <div className="p-4 border-b border-slate-100">
                    <h1 className="text-xl font-bold text-slate-900 mb-4">Mensajes</h1>
                    <div className="relative">
                        <Input
                            placeholder="Buscar chats..."
                            className="pl-9 bg-slate-50 border-none h-10 text-xs"
                        />
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => handleSelectChat(chat.id)}
                            className={cn(
                                "group w-full p-4 flex items-start gap-3 transition-colors hover:bg-slate-50 relative border-b border-slate-50 last:border-0",
                                selectedId === chat.id ? "bg-slate-50 md:bg-slate-50" : ""
                            )}
                        >
                            {selectedId === chat.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 hidden md:block" />
                            )}
                            <div className="relative flex-shrink-0">
                                <div className="h-12 w-12 md:h-10 md:w-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100 shadow-sm">
                                    {chat.avatar ? (
                                        <img src={chat.avatar} alt={chat.user} className="h-full w-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-slate-400" />
                                    )}
                                </div>
                                {chat.status === "online" && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className={cn("font-bold text-sm truncate", chat.unread ? "text-slate-900" : "text-slate-700")}>
                                        {chat.user}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-medium">{chat.time}</span>
                                </div>
                                <p className={cn("text-xs truncate", chat.unread ? "font-bold text-slate-700" : "text-slate-500")}>
                                    {chat.lastMessage}
                                </p>
                            </div>
                            {chat.unread && (
                                <div className="h-2 w-2 rounded-full bg-primary-600 self-center" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area - Slide in on mobile */}
            <div className={cn(
                "flex-1 flex-col bg-slate-50/30 absolute inset-0 md:static z-20 bg-slate-50 transition-transform duration-300",
                showChatOnMobile ? "translate-x-0" : "translate-x-full md:translate-x-0"
            )}>
                {currentChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center justify-between bg-white px-4 md:px-6 py-3 md:py-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden -ml-2 text-slate-500"
                                    onClick={handleBackToMobileList}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </Button>
                                <div className="h-9 w-9 md:h-10 md:w-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100 shadow-sm">
                                    {currentChat.avatar ? (
                                        <img src={currentChat.avatar} alt={currentChat.user} className="h-full w-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">{currentChat.user}</h3>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Activo ahora</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
                                    <Search size={18} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400">
                                    <MoreVertical size={18} />
                                </Button>
                            </div>
                        </div>

                        {/* Messages History */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-hide">
                            {chatHistory.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[85%] md:max-w-[70%]",
                                        msg.sender === 'store' ? "ml-auto items-end" : "mr-auto items-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2.5 md:px-5 md:py-3 text-sm shadow-sm",
                                            msg.sender === 'store'
                                                ? "bg-primary-600 text-white rounded-tr-none"
                                                : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                                        <span>{msg.time}</span>
                                        {msg.sender === 'store' && <Check size={10} className="text-primary-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Form */}
                        <div className="bg-white p-3 md:p-6 border-t border-slate-100">
                            <form onSubmit={handleSendReply} className="flex items-center gap-2 md:gap-3">
                                <Input
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Respuesta..."
                                    className="flex-1 bg-slate-50 border-none h-10 md:h-12 px-4 md:px-6 rounded-2xl text-sm focus:ring-1 focus:ring-primary-500"
                                />
                                <Button
                                    type="submit"
                                    className="h-10 md:h-12 w-10 md:w-auto px-0 md:px-8 rounded-full md:rounded-2xl shadow-lg shadow-primary-100 font-bold shrink-0 transition-all hover:scale-105 active:scale-95"
                                    disabled={!replyText.trim()}
                                >
                                    <Send size={18} className="md:mr-3" />
                                    <span className="hidden md:inline tracking-wide">Enviar</span>
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <div className="text-center p-6">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 mb-4 animate-bounce">
                                <MessageCircle size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-slate-900 font-bold">Tus Mensajes</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">Selecciona una conversación para responder a tus clientes.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
