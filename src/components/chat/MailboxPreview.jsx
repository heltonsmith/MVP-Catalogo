import { useState, useMemo } from 'react';
import { MessageCircle, Search, User, Send, Filter, MoreVertical, Check, X, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils';
import { useToast } from '../ui/Toast';

export function MailboxPreview() {
    const { showToast } = useToast();
    const [selectedId, setSelectedId] = useState(null);

    const conversations = [
        {
            id: 1,
            user: "Helton Smith",
            lastMessage: "¿Tienen stock del Cepillo de Bambú?",
            time: "10:30 AM",
            unread: true,
            status: "online",
            messages: [
                { id: 1, text: "Hola, vi sus productos en el catálogo.", sender: 'user', time: '10:25 AM' },
                { id: 2, text: "¿Tienen stock del Cepillo de Bambú? Me interesa comprar 5.", sender: 'user', time: '10:26 AM' },
                { id: 3, text: "Hola Helton, gusto en saludarte. Sí, tenemos stock disponible para entrega inmediata.", sender: 'store', time: '10:28 AM' },
                { id: 4, text: "Excelente, ¿tienen algún tipo de descuento por volumen?", sender: 'user', time: '10:29 AM' },
                { id: 5, text: "¿Tienen stock del Cepillo de Bambú?", sender: 'user', time: '10:30 AM' }
            ]
        },
        {
            id: 2,
            user: "Maria García",
            lastMessage: "Muchas gracias por la atención.",
            time: "Ayer",
            unread: false,
            status: "offline",
            messages: [
                { id: 1, text: "Hola, ¿cuánto demora el envío a Providencia?", sender: 'user', time: 'Ayer 2:15 PM' },
                { id: 2, text: "Hola Maria, despachamos en 24 horas hábiles dentro de la RM.", sender: 'store', time: 'Ayer 2:20 PM' },
                { id: 3, text: "Perfecto, realizaré la compra ahora mismo.", sender: 'user', time: 'Ayer 2:30 PM' },
                { id: 4, text: "Muchas gracias por la atención.", sender: 'user', time: 'Ayer 3:00 PM' }
            ]
        },
        {
            id: 3,
            user: "Juan Perez",
            lastMessage: "¿Hacen envíos a regiones?",
            time: "Lun",
            unread: false,
            status: "offline",
            messages: [
                { id: 1, text: "Buena tarde, ¿hacen envíos a regiones?", sender: 'user', time: 'Lun 11:00 AM' },
                { id: 2, text: "Enviamos a todo Chile por Starken o Chilexpress.", sender: 'store', time: 'Lun 11:15 AM' }
            ]
        }
    ];

    const currentChat = useMemo(() => conversations.find(c => c.id === selectedId), [selectedId]);

    const handleAction = (e) => {
        if (e) e.preventDefault();
        showToast('Esta es una función de demostración. En la versión real, podrías interactuar con tus clientes aquí.', 'demo');
    };

    return (
        <div className="flex h-[80vh] sm:h-[75vh] min-h-[500px] w-full overflow-hidden bg-white">
            {/* Sidebar */}
            <div className={cn(
                "flex w-full md:w-80 flex-col border-r border-slate-100 flex-shrink-0 transition-all duration-300 md:block",
                selectedId ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Buzón</h2>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={handleAction}>
                            <Filter size={18} />
                        </Button>
                    </div>
                    <div className="relative">
                        <Input
                            placeholder="Buscar chats..."
                            className="pl-10 bg-white border-slate-200 h-11 text-xs rounded-2xl shadow-sm focus:ring-1 focus:ring-primary-500 transition-all"
                            readOnly
                            onClick={() => handleAction()}
                        />
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white scrollbar-hide">
                    {conversations.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => setSelectedId(chat.id)}
                            className={cn(
                                "group w-full p-4 flex items-start gap-3 transition-all hover:bg-slate-50 relative",
                                selectedId === chat.id ? "bg-primary-50/50" : "border-b border-slate-50"
                            )}
                        >
                            {selectedId === chat.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 bg-primary-600 rounded-r-full" />
                            )}
                            <div className="relative flex-shrink-0">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm transition-transform group-hover:scale-110",
                                    selectedId === chat.id
                                        ? "bg-gradient-to-br from-primary-500 to-primary-700 ring-4 ring-primary-100"
                                        : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500"
                                )}>
                                    {chat.user.charAt(0)}
                                </div>
                                {chat.status === "online" && (
                                    <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className={cn("font-bold text-sm truncate transition-colors", chat.unread ? "text-slate-900" : "text-slate-600")}>
                                        {chat.user}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-bold">{chat.time}</span>
                                </div>
                                <p className={cn("text-xs truncate leading-snug transition-colors", chat.unread ? "font-bold text-slate-700" : "text-slate-400")}>
                                    {chat.lastMessage}
                                </p>
                            </div>
                            {chat.unread && (
                                <div className="h-2.5 w-2.5 rounded-full bg-primary-600 self-center shadow-lg shadow-primary-200" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-slate-50/10 transition-all duration-300",
                selectedId ? "flex" : "hidden md:flex"
            )}>
                {currentChat ? (
                    <>
                        <div className="flex items-center justify-between bg-white px-4 sm:px-8 py-3 sm:py-5 border-b border-slate-100 shadow-sm z-10 transition-all">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden h-10 w-10 text-slate-400 hover:bg-slate-50"
                                    onClick={() => setSelectedId(null)}
                                >
                                    <ArrowLeft size={20} />
                                </Button>
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-primary-200">
                                    {currentChat.user.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm sm:text-lg leading-tight tracking-tight">{currentChat.user}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[9px] sm:text-[10px] text-emerald-600 font-black uppercase tracking-widest">En línea</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-3">
                                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all" onClick={() => handleAction()}>
                                    <Search size={22} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all" onClick={() => handleAction()}>
                                    <MoreVertical size={22} />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 sm:space-y-8 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                            <div className="flex justify-center mb-6 sm:mb-10">
                                <span className="bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 text-slate-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] px-3 sm:px-4 py-1.5 rounded-full ring-4 ring-slate-50/50">
                                    Hoy, {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                </span>
                            </div>

                            {currentChat.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[85%] sm:max-w-[70%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                                        msg.sender === 'store' ? "ml-auto items-end" : "mr-auto items-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "rounded-[20px] sm:rounded-[24px] px-4 sm:px-6 py-2.5 sm:py-4 text-[12px] sm:text-[13px] shadow-sm leading-relaxed transition-all hover:shadow-md",
                                            msg.sender === 'store'
                                                ? "bg-primary-600 text-white rounded-tr-none shadow-primary-100"
                                                : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-slate-100"
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                    <div className="mt-1.5 sm:mt-2.5 flex items-center gap-1.5 text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                                        <span>{msg.time}</span>
                                        {msg.sender === 'store' && <Check size={10} className="sm:size-12 text-primary-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white p-4 sm:p-6 border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                            <form onSubmit={handleAction} className="flex items-center gap-3 sm:gap-4">
                                <Input
                                    placeholder="Escribe tu mensaje..."
                                    className="flex-1 bg-slate-50 border-none h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20"
                                    readOnly
                                    onClick={() => handleAction()}
                                />
                                <Button
                                    type="submit"
                                    className="h-12 w-12 sm:h-14 sm:w-auto sm:px-8 rounded-xl sm:rounded-2xl shadow-xl shadow-primary-500/20 font-black text-xs uppercase tracking-widest gap-3 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send size={18} />
                                    <span className="hidden sm:inline">Enviar</span>
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center p-8 sm:p-12 text-center bg-white/50 backdrop-blur-sm">
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[28px] sm:rounded-[32px] bg-slate-50 flex items-center justify-center mb-6 shadow-inner ring-1 ring-slate-100">
                            <MessageCircle size={40} className="sm:size-48 text-slate-200" />
                        </div>
                        <h3 className="text-slate-900 font-black text-lg sm:text-xl mb-2">Selecciona un cliente</h3>
                        <p className="text-slate-500 text-xs sm:text-sm max-w-xs leading-relaxed">
                            Aquí aparecerán todas tus conversaciones. Haz clic en un cliente de la izquierda para comenzar a chatear.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
