import { useState, useRef, useEffect } from 'react';
import { Megaphone, Send, Users, Loader2, Bold, Italic, Smile, Crown, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useUpgradeRequest } from '../hooks/useUpgradeRequest';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils';

const COMMON_EMOJIS = ['📢', '✨', '🚀', '🔥', '🎁', '⚡', '🆕', '🏷️', '📦', '🛒', '🍔', '🍕', '🍣', '🍦', '👗', '👟', '💎', '🎨', '🎉', '👋'];

export default function StoreBroadcast() {
    const { showToast } = useToast();
    const { company } = useAuth();
    const { pendingRequest } = useUpgradeRequest();
    const textareaRef = useRef(null);

    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    const isPro = company?.plan !== 'free';

    // Fetch follower count
    useEffect(() => {
        if (!company?.id) return;
        const fetchFollowers = async () => {
            const { count, error } = await supabase
                .from('store_follows')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', company.id);
            if (!error) setFollowerCount(count || 0);
        };
        fetchFollowers();
    }, [company?.id]);

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

    const insertFormat = (marker) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = message.substring(start, end);
        let newText;
        if (selected) {
            newText = message.substring(0, start) + marker + selected + marker + message.substring(end);
        } else {
            newText = message.substring(0, start) + marker + 'texto' + marker + message.substring(end);
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

    const handleSend = async () => {
        if (!message.trim()) {
            showToast("Escribe un mensaje primero", "error");
            return;
        }

        setSending(true);
        try {
            const { data: followers, error: fetchErr } = await supabase
                .from('store_follows')
                .select('user_id')
                .eq('company_id', company.id);

            if (fetchErr) throw fetchErr;

            if (!followers || followers.length === 0) {
                showToast("No tienes seguidores a los cuales notificar", "info");
                setSending(false);
                return;
            }

            const notifications = followers.map(f => ({
                user_id: f.user_id,
                type: 'broadcast',
                title: `Mensaje de ${company.name}`,
                content: message,
                metadata: {
                    company_id: company.id,
                    company_slug: company.slug,
                    company_name: company.name
                }
            }));

            const batchSize = 100;
            for (let i = 0; i < notifications.length; i += batchSize) {
                const batch = notifications.slice(i, i + batchSize);
                const { error: sendErr } = await supabase.from('notifications').insert(batch);
                if (sendErr) throw sendErr;
            }

            showToast("¡Difusión enviada con éxito!", "success");
            setMessage('');
        } catch (error) {
            console.error('Error sending broadcast:', error);
            showToast("Error al enviar la difusión", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="bg-primary-100 p-2.5 rounded-xl">
                        <Megaphone size={24} className="text-primary-600" />
                    </div>
                    Canal de Difusión
                </h1>
                <p className="text-slate-500 mt-2 text-sm font-medium">
                    Envía mensajes a todos tus seguidores de forma instantánea.
                </p>
            </div>

            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <div className="p-5 border-b border-slate-50 font-bold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Megaphone size={16} className="text-primary-500" />
                        Canal de Difusión Seguidores
                    </div>
                    {!isPro && (
                        <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-1 rounded-full border border-primary-200 uppercase tracking-widest">
                            Planes de Pago
                        </span>
                    )}
                </div>
                <CardContent className="p-8 relative">
                    <div className={cn("transition-all duration-500", !isPro && "blur-[2px] opacity-50 pointer-events-none")}>
                        <div className="max-w-xl mx-auto text-center space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-black shadow-sm ring-1 ring-primary-100">
                                <Users size={16} />
                                <span>{followerCount.toLocaleString()} Seguidores Activos</span>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Envía novedades a tus clientes</h3>
                                <p className="text-sm text-slate-500 font-bold leading-relaxed">
                                    Tus seguidores recibirán una notificación inmediata con el mensaje que escribas abajo.
                                    ¡Úsalo para ofertas relámpago, nuevos ingresos o anuncios importantes!
                                </p>
                            </div>

                            {/* Formatting Toolbar */}
                            <div className="flex items-center justify-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100">
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
                                <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-slate-100/50 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
                                    {COMMON_EMOJIS.map((emoji, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleEmojiClick(emoji)}
                                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white hover:scale-125 hover:shadow-sm rounded-lg transition-all duration-200 active:scale-95"
                                            title="Click para insertar"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative group">
                                    <textarea
                                        ref={textareaRef}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Ej: ¡Hola! Tenemos 10 productos nuevos en oferta por tiempo limitado. ¡No te los pierdas! 🚀"
                                        rows={5}
                                        maxLength={150}
                                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-5 text-sm font-bold text-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none shadow-inner"
                                    />
                                    <div className={cn(
                                        "absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase transition-colors",
                                        message.length >= 150 ? "text-rose-500" : "text-slate-400"
                                    )}>
                                        {message.length} / 150
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSend}
                                disabled={sending || !message.trim()}
                                className="w-full h-14 rounded-2xl text-base font-black shadow-xl shadow-primary-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Enviando a {followerCount} seguidores...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-5 w-5" />
                                        Enviar Notificación de Difusión
                                    </>
                                )}
                            </Button>

                            <div className="pt-4 flex items-center justify-center gap-6 border-t border-slate-100">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Alcance</span>
                                    <span className="text-xs font-bold text-slate-700">Inmediato</span>
                                </div>
                                <div className="h-4 w-px bg-slate-200" />
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tipo</span>
                                    <span className="text-xs font-bold text-slate-700">Directo</span>
                                </div>
                                <div className="h-4 w-px bg-slate-200" />
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Botón CTA</span>
                                    <span className="text-xs font-bold text-slate-700">Ir a Tienda</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isPro && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="flex flex-col items-center gap-3">
                                {pendingRequest && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                                        <Clock size={12} />
                                        Solicitud en Revisión
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "bg-white/80 backdrop-blur-sm border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 font-black rounded-xl shadow-lg",
                                        pendingRequest && "border-amber-200 shadow-none opacity-90"
                                    )}
                                >
                                    {pendingRequest ? (
                                        <>
                                            <Clock size={16} className="mr-2" />
                                            Ver Estado de Mejora
                                        </>
                                    ) : (
                                        <>
                                            <Crown size={16} className="mr-2" />
                                            Habilitar Canal de Difusión
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
