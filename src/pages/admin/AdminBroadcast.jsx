import { useState, useRef, useEffect } from 'react';
import { Megaphone, Send, Users, Store, Globe, Loader2, Bold, Italic, Smile } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../utils';

const COMMON_EMOJIS = ['📢', '✨', '🚀', '🔥', '🎁', '⚡', '🆕', '🏷️', '📦', '🛒', '🍔', '🍕', '🍣', '🍦', '👗', '👟', '💎', '🎨', '🎉', '👋', '⚠️', '🔔', '📣', '💡', '🛠️', '📌', '🎯', '💬', '🤝', '🌟'];

const AUDIENCES = [
    { key: 'clients', label: 'Clientes', description: 'Solo usuarios registrados como clientes', icon: Users, color: 'bg-blue-500', ring: 'ring-blue-200' },
    { key: 'stores', label: 'Tiendas', description: 'Solo dueños de tiendas registradas', icon: Store, color: 'bg-emerald-500', ring: 'ring-emerald-200' },
    { key: 'all', label: 'Todos', description: 'Clientes y tiendas por igual', icon: Globe, color: 'bg-purple-500', ring: 'ring-purple-200' },
];

export default function AdminBroadcast() {
    const { showToast } = useToast();
    const textareaRef = useRef(null);

    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState('all');
    const [sending, setSending] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const [recipientCount, setRecipientCount] = useState(null);
    const [loadingCount, setLoadingCount] = useState(false);

    // Fetch recipient count when audience changes
    useEffect(() => {
        const fetchCount = async () => {
            setLoadingCount(true);
            try {
                let query = supabase.from('profiles').select('id', { count: 'exact', head: true });

                if (audience === 'clients') {
                    query = query.in('role', ['client', 'user']);
                } else if (audience === 'stores') {
                    query = query.eq('role', 'owner');
                } else {
                    query = query.in('role', ['client', 'user', 'owner']);
                }
                query = query.neq('role', 'admin');

                const { count, error } = await query;
                if (error) throw error;
                setRecipientCount(count || 0);
            } catch (err) {
                console.error('Error fetching count:', err);
                setRecipientCount(0);
            } finally {
                setLoadingCount(false);
            }
        };
        fetchCount();
    }, [audience]);

    // Insert formatting markers around selected text
    const insertFormat = (marker) => {
        const ta = textareaRef.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = message;
        const selected = text.substring(start, end);

        let newText;
        if (selected) {
            newText = text.substring(0, start) + marker + selected + marker + text.substring(end);
        } else {
            newText = text.substring(0, start) + marker + 'texto' + marker + text.substring(end);
        }

        setMessage(newText);
        setTimeout(() => {
            ta.focus();
            const cursorPos = selected
                ? start + marker.length + selected.length + marker.length
                : start + marker.length + 5 + marker.length;
            ta.setSelectionRange(cursorPos, cursorPos);
        }, 0);
    };

    const handleEmojiClick = (emoji) => {
        const ta = textareaRef.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newText = message.substring(0, start) + emoji + message.substring(end);

        setMessage(newText);
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 0);
    };

    const handleSend = async () => {
        if (!message.trim()) {
            showToast("Escribe un mensaje primero", "error");
            return;
        }

        setSending(true);
        try {
            // 1. Fetch target users
            let query = supabase.from('profiles').select('id');

            if (audience === 'clients') {
                query = query.in('role', ['client', 'user']);
            } else if (audience === 'stores') {
                query = query.eq('role', 'owner');
            } else {
                query = query.in('role', ['client', 'user', 'owner']);
            }
            query = query.neq('role', 'admin');

            const { data: users, error: fetchErr } = await query;
            if (fetchErr) throw fetchErr;

            if (!users || users.length === 0) {
                showToast("No hay usuarios en la audiencia seleccionada", "info");
                setSending(false);
                return;
            }

            // 2. Prepare notifications
            const audienceLabel = AUDIENCES.find(a => a.key === audience)?.label || 'Todos';
            const notifications = users.map(u => ({
                user_id: u.id,
                type: 'broadcast',
                title: `📢 Mensaje de Ktaloog`,
                content: message,
                metadata: {
                    source: 'admin',
                    actor_role: 'admin',
                    audience: audience,
                    audience_label: audienceLabel
                }
            }));

            // 3. Send in batches
            const batchSize = 100;
            for (let i = 0; i < notifications.length; i += batchSize) {
                const batch = notifications.slice(i, i + batchSize);
                const { error: sendErr } = await supabase.from('notifications').insert(batch);
                if (sendErr) throw sendErr;
            }

            showToast(`¡Difusión enviada a ${users.length} ${audienceLabel.toLowerCase()}!`, "success");
            setMessage('');
        } catch (error) {
            console.error('Error sending admin broadcast:', error);
            showToast("Error al enviar la difusión", "error");
        } finally {
            setSending(false);
        }
    };

    const audienceData = AUDIENCES.find(a => a.key === audience);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="bg-primary-100 p-2.5 rounded-xl">
                        <Megaphone size={24} className="text-primary-600" />
                    </div>
                    Canal de Difusión
                </h1>
                <p className="text-slate-500 mt-2 text-sm font-medium">
                    Envía mensajes masivos a tus clientes, tiendas o a todos los usuarios de la plataforma.
                </p>
            </div>

            {/* Audience Selector */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <div className="p-5 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                    <Users size={16} className="text-primary-500" />
                    Seleccionar Audiencia
                </div>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {AUDIENCES.map(a => {
                            const Icon = a.icon;
                            const isSelected = audience === a.key;
                            return (
                                <button
                                    key={a.key}
                                    onClick={() => setAudience(a.key)}
                                    className={cn(
                                        "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer group",
                                        isSelected
                                            ? `border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]`
                                            : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:shadow-md"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                        isSelected ? `${a.color} text-white shadow-lg` : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                    )}>
                                        <Icon size={22} />
                                    </div>
                                    <div className="text-center">
                                        <p className={cn("font-black text-sm", isSelected ? "text-white" : "text-slate-800")}>{a.label}</p>
                                        <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", isSelected ? "text-white/60" : "text-slate-400")}>{a.description}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Message Composer */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <div className="p-5 border-b border-slate-50 font-bold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Megaphone size={16} className="text-primary-500" />
                        Redactar Mensaje
                    </div>
                    <div className="flex items-center gap-2">
                        {loadingCount ? (
                            <Loader2 size={12} className="animate-spin text-slate-400" />
                        ) : (
                            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ring-1", audienceData?.ring, audienceData?.color, "text-white")}>
                                {recipientCount?.toLocaleString()} destinatarios
                            </span>
                        )}
                    </div>
                </div>
                <CardContent className="p-6 space-y-4">
                    {/* Formatting Toolbar */}
                    <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <button
                            type="button"
                            onClick={() => insertFormat('**')}
                            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all active:scale-95"
                            title="Negrita (**texto**)"
                        >
                            <Bold size={16} strokeWidth={3} />
                        </button>
                        <button
                            type="button"
                            onClick={() => insertFormat('*')}
                            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all active:scale-95"
                            title="Cursiva (*texto*)"
                        >
                            <Italic size={16} strokeWidth={3} />
                        </button>
                        <div className="h-5 w-px bg-slate-200 mx-1" />
                        <button
                            type="button"
                            onClick={() => setShowEmojis(!showEmojis)}
                            className={cn(
                                "flex items-center justify-center w-9 h-9 rounded-lg transition-all active:scale-95",
                                showEmojis ? "bg-primary-100 text-primary-600 shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                            )}
                            title="Emojis"
                        >
                            <Smile size={16} />
                        </button>
                    </div>

                    {/* Emoji Palette */}
                    {showEmojis && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 p-3 bg-slate-50/80 rounded-xl border border-slate-100/50 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
                            {COMMON_EMOJIS.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="w-9 h-9 flex items-center justify-center text-lg hover:bg-white hover:scale-125 hover:shadow-sm rounded-lg transition-all duration-200 active:scale-95"
                                    title="Click para insertar"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Textarea */}
                    <div className="relative group">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Escribe tu mensaje aquí... Usa **negrita** y *cursiva* para dar énfasis. 🚀"
                            rows={6}
                            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-5 text-sm font-bold text-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none shadow-inner"
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            {message.length} caracteres
                        </div>
                    </div>

                    {/* Send Button */}
                    <Button
                        onClick={handleSend}
                        disabled={sending || !message.trim()}
                        className="w-full h-14 rounded-2xl text-base font-black shadow-xl shadow-primary-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Enviando a {recipientCount?.toLocaleString()} {audienceData?.label.toLowerCase()}...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" />
                                Enviar a {audienceData?.label} ({recipientCount?.toLocaleString()})
                            </>
                        )}
                    </Button>

                    {/* Info Bar */}
                    <div className="pt-4 flex items-center justify-center gap-6 border-t border-slate-100">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Alcance</span>
                            <span className="text-xs font-bold text-slate-700">Inmediato</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tipo</span>
                            <span className="text-xs font-bold text-slate-700">Notificación</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Audiencia</span>
                            <span className="text-xs font-bold text-slate-700">{audienceData?.label}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
