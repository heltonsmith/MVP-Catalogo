import { useState, useEffect, useMemo } from 'react';
import { Settings, User, Bell, Shield, Smartphone, Save, Image as ImageIcon, Camera, Crown, Sparkles, QrCode, Download, Loader2, Zap, Rocket, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle, Mail, MailOpen, Trash2, Link as LinkIcon, Utensils, Megaphone, Users, Send } from 'lucide-react';
import QRCode from "react-qr-code";
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils';
import { PlanUpgradeModal } from '../components/dashboard/PlanUpgradeModal';
import { useUpgradeRequest } from '../hooks/useUpgradeRequest';

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { COMPANIES } from '../data/mock';
import { useSettings } from '../hooks/useSettings';
import { useNotifications } from '../hooks/useNotifications';

export default function DashboardProfile() {
    const { showToast } = useToast();
    const { getSetting } = useSettings();
    const { company: authCompany, refreshCompany } = useAuth();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Check for demo mode
    const isDemo = location.pathname.includes('/demo') || searchParams.get('demo') === 'true';

    // Detect which demo type - use useMemo to prevent recreation on every render
    const isDemoRestaurant = location.pathname.includes('/demo/restaurante');
    const demoCompany = useMemo(() =>
        isDemoRestaurant ? COMPANIES[2] : COMPANIES[0],
        [isDemoRestaurant]
    );

    // Use mock company if in demo mode
    const company = isDemo ? demoCompany : authCompany;

    const [activeTab, setActiveTab] = useState('profile');
    const isPro = company?.plan !== 'free';
    const [loading, setLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeHistory, setUpgradeHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const { pendingRequest } = useUpgradeRequest();
    const {
        notifications,
        loading: loadingNotifs,
        markAsRead,
        markAsUnread,
        deleteNotification,
        markAllAsRead,
        unreadCount
    } = useNotifications();

    const DEMO_NOTIFICATIONS = [
        {
            id: 'demo-upgrade',
            title: '¡Plan Pro Activado! 🚀',
            content: `Hola ${company.name}, nos complace informarte que tu solicitud de actualización al Plan Pro ha sido aprobada. Ya puedes disfrutar de todas las funciones avanzadas, incluyendo métricas detalladas e integración completa con WhatsApp.`,
            type: 'system',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            is_read: false,
            metadata: { status: 'approved' }
        },
        {
            id: 'demo-welcome',
            title: 'Bienvenido al Administrador de ktaloog',
            content: 'Estamos felices de ayudarte a digitalizar tu catálogo. Por ser nuevo usuario, tienes acceso a soporte prioritario vía WhatsApp. Si tienes dudas, contáctanos.',
            type: 'system',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            is_read: true
        },
        {
            id: 'demo-tip',
            title: 'Tip: Personaliza tu Marca',
            content: 'Recuerda que puedes subir tu logo y banner desde esta misma sección para que tus clientes reconozcan tu marca inmediatamente.',
            type: 'system',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            is_read: true
        }
    ];

    const systemNotifications = useMemo(() =>
        isDemo ? DEMO_NOTIFICATIONS : notifications.filter(n => n.type === 'system' || n.type === 'message' || n.type === 'grace_period'),
        [notifications, isDemo]
    );

    const unreadSystemCount = useMemo(() =>
        systemNotifications.filter(n => !n.is_read).length,
        [systemNotifications]
    );

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        whatsapp: '',
        businessType: 'retail',
        instagram: '',
        tiktok: '',
        website: '',
        menuMode: false
    });
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Broadcast Channel States
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                slug: company.slug || '',
                description: company.description || '',
                whatsapp: company.whatsapp || '',
                businessType: company.business_type || 'retail',
                instagram: company.socials?.instagram || '',
                tiktok: company.socials?.tiktok || '',
                website: company.socials?.website || company.website || '',
                menuMode: company.menu_mode || false
            });
        }
    }, [company?.id, demoCompany.id]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!company?.id || isDemo) return;
            setLoadingHistory(true);
            try {
                const { data, error } = await supabase
                    .from('upgrade_requests')
                    .select('*')
                    .eq('company_id', company.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setUpgradeHistory(data || []);
            } catch (error) {
                console.error('Error fetching upgrade history:', error);
            } finally {
                setLoadingHistory(false);
            }
        };

        if (activeTab === 'messages') {
            fetchHistory();
        }
    }, [activeTab, company?.id, isDemo]);

    useEffect(() => {
        const fetchFollowers = async () => {
            if (!company?.id) return;
            if (isDemo) {
                setFollowerCount(1250);
                return;
            }
            try {
                const { count } = await supabase
                    .from('store_follows')
                    .select('id', { count: 'exact' })
                    .eq('company_id', company.id);
                setFollowerCount(count || 0);
            } catch (err) {
                console.error('Error fetching follower count:', err);
            }
        };

        if (activeTab === 'broadcast') {
            fetchFollowers();
        }
    }, [activeTab, company?.id, isDemo]);

    const handleSendBroadcast = async () => {
        if (!broadcastMsg.trim()) {
            showToast("Escribe un mensaje primero", "error");
            return;
        }

        if (isDemo) {
            handleDemoAction("Enviar difusión a seguidores");
            setBroadcastMsg('');
            return;
        }

        setSendingBroadcast(true);
        try {
            // 1. Get all followers
            const { data: followers, error: fetchErr } = await supabase
                .from('store_follows')
                .select('user_id')
                .eq('company_id', company.id);

            if (fetchErr) throw fetchErr;

            if (!followers || followers.length === 0) {
                showToast("No tienes seguidores a los cuales notificar", "info");
                setSendingBroadcast(false);
                return;
            }

            // 2. Prepare bulk notifications
            const notifications = followers.map(f => ({
                user_id: f.user_id,
                type: 'broadcast',
                title: `Mensaje de ${company.name}`,
                content: broadcastMsg,
                metadata: {
                    company_id: company.id,
                    company_slug: company.slug,
                    company_name: company.name
                }
            }));

            // 3. Send in batches of 100 to avoid limits
            const batchSize = 100;
            for (let i = 0; i < notifications.length; i += batchSize) {
                const batch = notifications.slice(i, i + batchSize);
                const { error: sendErr } = await supabase
                    .from('notifications')
                    .insert(batch);
                if (sendErr) throw sendErr;
            }

            showToast("¡Difusión enviada con éxito!", "success");
            setBroadcastMsg('');
        } catch (error) {
            console.error('Error sending broadcast:', error);
            showToast("Error al enviar la difusión", "error");
        } finally {
            setSendingBroadcast(false);
        }
    };

    if (!company && !isDemo) return null;
    if (!company && isDemo) return <div className="p-8 text-center">Cargando datos de demostración...</div>;

    const downloadQR = () => {
        if (isDemo) {
            handleDemoAction("Descargar QR");
            return;
        }
        const svg = document.getElementById("QRCode");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QRCode-${company.slug}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handleDemoAction = (action) => {
        showToast(`Esta es una acción demo: ${action}. En la versión real, esta acción se realizaría correctamente.`, "demo");
    };

    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();
        if (isDemo) {
            handleDemoAction("Guardar Información General");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description,
                    whatsapp: formData.whatsapp,
                    business_type: formData.businessType,
                    socials: {
                        instagram: formData.instagram,
                        tiktok: formData.tiktok,
                        website: formData.website
                    },
                    menu_mode: formData.menuMode
                })
                .eq('id', company.id);

            if (error) throw error;

            await refreshCompany();
            showToast("Información actualizada correctamente", "success");
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast("Error al guardar los cambios", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (isDemo) {
            handleDemoAction("Subir Imagen");
            return;
        }

        // Limit file size to 2MB
        if (file.size > 2 * 1024 * 1024) {
            showToast("La imagen debe ser menor a 2MB", "error");
            return;
        }

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${company.id}/${type}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('store-assets')
                .upload(filePath, file);

            if (uploadError) {
                if (uploadError.message.includes('bucket not found')) {
                    throw new Error("El sistema de almacenamiento no está configurado. Contacta al soporte.");
                }
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('store-assets')
                .getPublicUrl(filePath);

            // Update Company
            const { error: updateError } = await supabase
                .from('companies')
                .update({ [type]: publicUrl })
                .eq('id', company.id);

            if (updateError) throw updateError;

            await refreshCompany();
            showToast("Imagen actualizada correctamente", "success");
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast(error.message || "Error al subir la imagen", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (isDemo) {
            handleDemoAction("Actualizar Contraseña");
            return;
        }
        if (passwords.new !== passwords.confirm) {
            showToast("Las contraseñas no coinciden", "error");
            return;
        }
        if (passwords.new.length < 6) {
            showToast("La contraseña debe tener al menos 6 caracteres", "error");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });
            if (error) throw error;
            showToast("Contraseña actualizada correctamente", "success");
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            console.error('Error updating password:', error);
            const message = error.message === 'New password should be different from the old password.'
                ? "La nueva contraseña debe ser diferente a la anterior"
                : error.message || "Error al actualizar la contraseña";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'messages':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={18} className="text-primary-500" />
                                    Mensajes del Sistema
                                </div>
                                {unreadSystemCount > 0 && !isDemo && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={markAllAsRead}
                                        className="text-[10px] font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 h-7"
                                    >
                                        <CheckCircle2 size={14} className="mr-1" />
                                        Marcar todo como leído
                                    </Button>
                                )}
                            </div>
                            <CardContent className="p-6">
                                {(loadingNotifs && !isDemo) ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="animate-spin text-primary-500" size={32} />
                                    </div>
                                ) : systemNotifications.length > 0 ? (
                                    <div className="space-y-4">
                                        {systemNotifications.map((notif) => {
                                            const isRejected = notif.metadata?.status === 'rejected' || notif.title.toLowerCase().includes('rechazada');
                                            const isApproved = notif.metadata?.status === 'approved' || notif.title.toLowerCase().includes('activado');

                                            return (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => !notif.is_read && !isDemo && markAsRead(notif.id)}
                                                    className={cn(
                                                        "p-5 rounded-2xl border transition-all duration-300 cursor-pointer group/card",
                                                        !notif.is_read
                                                            ? (isRejected ? "bg-rose-50/50 border-rose-100 shadow-md shadow-rose-50 hover:bg-rose-50" : "bg-white border-primary-100 shadow-md shadow-primary-50 hover:border-primary-200")
                                                            : "bg-slate-50 border-slate-100 opacity-80"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm",
                                                                !notif.is_read
                                                                    ? (isRejected ? "bg-rose-100 border-rose-200 text-rose-600" : "bg-primary-50 border-primary-100 text-primary-600")
                                                                    : "bg-white border-slate-100 text-slate-400"
                                                            )}>
                                                                {isRejected ? <XCircle size={20} /> : isApproved ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}
                                                            </div>
                                                            <div>
                                                                <h4 className={cn(
                                                                    "font-bold text-sm",
                                                                    isRejected && !notif.is_read ? "text-rose-700" : "text-slate-900"
                                                                )}>{notif.title}</h4>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                    {new Date(notif.created_at).toLocaleDateString()} • {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {!notif.is_read && <div className={cn("h-2 w-2 rounded-full animate-pulse mr-2", isRejected ? "bg-rose-500" : "bg-primary-500")} />}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    notif.is_read ? (isDemo ? null : markAsUnread(notif.id)) : (isDemo ? null : markAsRead(notif.id));
                                                                }}
                                                                className={cn(
                                                                    "p-2 rounded-lg transition-colors",
                                                                    isRejected ? "text-rose-400 hover:text-rose-600 hover:bg-rose-50" : "text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                                                                )}
                                                                title={notif.is_read ? "Marcar como no leído" : "Marcar como leído"}
                                                            >
                                                                {notif.is_read ? <MailOpen size={16} /> : <Mail size={16} />}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (isDemo) {
                                                                        handleDemoAction("Eliminar Notificación");
                                                                    } else {
                                                                        deleteNotification(notif.id);
                                                                    }
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "p-4 rounded-xl border",
                                                        isRejected && !notif.is_read ? "bg-white/80 border-rose-100" : "bg-white/50 border-slate-100/50"
                                                    )}>
                                                        <p className="text-xs text-slate-600 leading-relaxed">
                                                            {notif.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-6">
                                        <div className="h-16 w-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <MessageSquare size={32} />
                                        </div>
                                        <p className="text-sm text-slate-500 font-bold">No hay mensajes del sistema</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">Te avisaremos por este medio sobre actualizaciones de tu plan o alertas importantes.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card >
                    </div >
                );
            case 'broadcast':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="border-none shadow-xl bg-white overflow-hidden">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                                <Megaphone size={18} className="text-primary-500" />
                                Canal de Difusión Seguidores
                            </div>
                            <CardContent className="p-8">
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

                                    <div className="relative group">
                                        <textarea
                                            value={broadcastMsg}
                                            onChange={(e) => setBroadcastMsg(e.target.value)}
                                            placeholder="Ej: ¡Hola! Tenemos 10 productos nuevos en oferta por tiempo limitado. ¡No te los pierdas! 🚀"
                                            rows={5}
                                            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-5 text-sm font-bold text-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none shadow-inner"
                                        />
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            {broadcastMsg.length} caracteres
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSendBroadcast}
                                        disabled={sendingBroadcast || !broadcastMsg.trim()}
                                        className="w-full h-14 rounded-2xl text-base font-black shadow-xl shadow-primary-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {sendingBroadcast ? (
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
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'notifications':
                const notifPrefs = company?.notification_prefs || { notify_follow: true, notify_favorite: true, notify_quote: true };

                const handleTogglePref = async (key) => {
                    if (isDemo) {
                        handleDemoAction("Cambiar preferencia de notificación");
                        return;
                    }
                    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
                    try {
                        const { error } = await supabase
                            .from('companies')
                            .update({ notification_prefs: newPrefs })
                            .eq('id', company.id);
                        if (error) throw error;
                        await refreshCompany();
                        showToast(newPrefs[key] ? "Notificación activada" : "Notificación desactivada", "success");
                    } catch (error) {
                        console.error('Error updating notification prefs:', error);
                        showToast("Error al guardar preferencia", "error");
                    }
                };

                const NOTIF_ITEMS = [
                    {
                        key: 'notify_follow',
                        title: 'Nuevo seguidor',
                        desc: 'Recibir una notificación cuando un cliente nuevo siga tu tienda.',
                        icon: '👤'
                    },
                    {
                        key: 'notify_favorite',
                        title: 'Guardado en favoritos',
                        desc: 'Recibir una notificación cuando un cliente guarde tu tienda en favoritos.',
                        icon: '❤️'
                    },
                    {
                        key: 'notify_quote',
                        title: 'Cotización vía WhatsApp',
                        desc: 'Recibir una notificación cuando un cliente envíe una cotización por WhatsApp.',
                        icon: '💬'
                    }
                ];

                return (
                    <Card className="border-none shadow-sm bg-white animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                            <Bell size={18} className="text-primary-500" />
                            Preferencias de Notificaciones
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <p className="text-xs text-slate-500 -mt-2 mb-2">
                                Controla qué notificaciones aparecen en tu campanita de alertas.
                            </p>
                            {NOTIF_ITEMS.map((item) => (
                                <div key={item.key} className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg mt-0.5">{item.icon}</span>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleTogglePref(item.key)}
                                        className={cn(
                                            "h-6 w-11 rounded-full relative transition-colors duration-200 shrink-0 ml-4",
                                            notifPrefs[item.key] ? "bg-primary-500" : "bg-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 h-4 w-4 rounded-full shadow-sm transition-all duration-200",
                                            notifPrefs[item.key] ? "right-1 bg-white" : "left-1 bg-white"
                                        )} />
                                    </button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            case 'security':
                return (
                    <Card className="border-none shadow-sm bg-white animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                            <Shield size={18} className="text-primary-500" />
                            Seguridad de la Cuenta
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <form className="space-y-4" onSubmit={handleUpdatePassword}>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nueva Contraseña</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="bg-slate-50 border-slate-100"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Confirmar Contraseña</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="bg-slate-50 border-slate-100"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="font-bold" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                                        Actualizar Contraseña
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                );
            case 'whatsapp':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="border-none shadow-sm overflow-hidden bg-white">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Smartphone size={18} className="text-emerald-500" />
                                    Conexión WhatsApp
                                </div>
                                {!isPro && (
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 uppercase tracking-widest">
                                        Planes de Pago
                                    </span>
                                )}
                            </div>
                            <CardContent className="p-6 relative">
                                <div className={cn("space-y-6 transition-all duration-500", !isPro && "blur-[2px] opacity-50 pointer-events-none")}>
                                    {/* Edit Number Section */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Número de WhatsApp</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Ej: +56912345678"
                                                className="bg-slate-50 border-slate-100 flex-1 font-medium"
                                                value={formData.whatsapp}
                                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            />
                                            <Button
                                                size="sm"
                                                className="px-4 font-bold"
                                                onClick={async () => {
                                                    if (isDemo) {
                                                        handleDemoAction("Guardar número de WhatsApp");
                                                        return;
                                                    }
                                                    try {
                                                        setLoading(true);
                                                        const { error } = await supabase
                                                            .from('companies')
                                                            .update({ whatsapp: formData.whatsapp })
                                                            .eq('id', company.id);
                                                        if (error) throw error;
                                                        await refreshCompany();
                                                        showToast("Número actualizado correctamente", "success");
                                                    } catch (err) {
                                                        console.error('Error updating whatsapp:', err);
                                                        showToast("Error al actualizar número", "error");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                disabled={loading}
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 px-1">Incluye el código de país (ej: +56).</p>
                                    </div>

                                    {/* Connection Status Box */}
                                    <div className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                        company.whatsapp_enabled !== false ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                                company.whatsapp_enabled !== false ? "bg-emerald-100" : "bg-slate-200"
                                            )}>
                                                <Smartphone size={20} className={company.whatsapp_enabled !== false ? "text-emerald-600" : "text-slate-500"} />
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-xs font-bold transition-colors",
                                                    company.whatsapp_enabled !== false ? "text-emerald-800" : "text-slate-600"
                                                )}>
                                                    {isDemo
                                                        ? (company.whatsapp_enabled !== false ? `Conectado a ${formData.whatsapp || '+56 9 1234 5678'}` : "WhatsApp Desconectado")
                                                        : (company.whatsapp ? `Conectado a ${company.whatsapp}` : "WhatsApp no configurado")
                                                    }
                                                </p>
                                                <p className="text-[10px] font-medium opacity-80 text-slate-500">
                                                    {company.whatsapp_enabled !== false ? "Recibiendo cotizaciones activamente." : "Las cotizaciones están pausadas temporalmente."}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "px-4 font-bold transition-colors",
                                                company.whatsapp_enabled !== false ? "text-red-500 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                                            )}
                                            onClick={async () => {
                                                if (isDemo) {
                                                    handleDemoAction(company.whatsapp_enabled !== false ? "Desconectar WhatsApp" : "Conectar WhatsApp");
                                                    return;
                                                }

                                                try {
                                                    setLoading(true);
                                                    const newState = company.whatsapp_enabled === false;
                                                    const { error } = await supabase
                                                        .from('companies')
                                                        .update({ whatsapp_enabled: newState })
                                                        .eq('id', company.id);

                                                    if (error) throw error;
                                                    await refreshCompany();
                                                    showToast(newState ? "WhatsApp Conectado" : "WhatsApp Desconectado", "success");
                                                } catch (err) {
                                                    console.error('Error toggling WhatsApp state:', err);
                                                    showToast("Error al cambiar estado de WhatsApp", "error");
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading}
                                        >
                                            {company.whatsapp_enabled !== false ? "Desconectar" : "Conectar"}
                                        </Button>
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
                                                onClick={() => isDemo ? handleDemoAction("Activar WhatsApp") : setShowUpgradeModal(true)}
                                                className={cn(
                                                    "bg-white/80 backdrop-blur-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-black rounded-xl",
                                                    pendingRequest && "border-amber-200 shadow-none opacity-90"
                                                )}
                                            >
                                                {pendingRequest ? (
                                                    <>
                                                        <Clock size={16} className="mr-2" />
                                                        Ver Estado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={16} className="mr-2" />
                                                        Habilitar conexión WhatsApp
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
            case 'profile':
            default:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="border-none shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800">
                                Información General
                            </div>
                            <CardContent className="p-6">
                                <form className="space-y-6" onSubmit={handleSaveProfile}>
                                    {/* Logos & Images */}
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Logo de Tienda</label>
                                            <div
                                                className="relative group cursor-pointer"
                                                onClick={() => document.getElementById('logo-upload').click()}
                                            >
                                                <div className="h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-slate-50 group-hover:ring-primary-50 transition-all">
                                                    {company.logo ? (
                                                        <img src={company.logo} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                                    ) : (
                                                        <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                                                            <ImageIcon className="text-slate-300" size={32} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl font-bold text-white text-[10px] uppercase">
                                                    <Camera size={16} className="mr-1" />
                                                    Cambiar
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                id="logo-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'logo')}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Banner del Catálogo</label>
                                            <div
                                                className="relative h-24 w-full rounded-2xl overflow-hidden ring-4 ring-slate-50 group cursor-pointer"
                                                onClick={() => document.getElementById('banner-upload').click()}
                                            >
                                                {company.banner ? (
                                                    <img src={company.banner} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-300 gap-2">
                                                        <ImageIcon size={32} />
                                                        <span className="text-sm font-bold uppercase tracking-widest">Sin Banner</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-white text-[10px] uppercase">
                                                    <ImageIcon size={16} className="mr-1" />
                                                    Cambiar Banner
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                id="banner-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'banner')}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Comercial</label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => {
                                                    const name = e.target.value;
                                                    const slug = name.toLowerCase()
                                                        .replace(/[^a-z0-9]+/g, '-')
                                                        .replace(/(^-|-$)+/g, '');
                                                    setFormData({ ...formData, name, slug });
                                                }}
                                                className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Slug de URL (Automático)</label>
                                            <Input
                                                value={formData.slug}
                                                readOnly
                                                disabled
                                                className="bg-slate-100 border-transparent text-slate-500 font-mono text-xs cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción corta</label>
                                            <Input
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">WhatsApp</label>
                                            <Input
                                                value={formData.whatsapp}
                                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                                placeholder="+56 9 1234 5678"
                                                className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Social Media Links */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Presencia Digital</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-medium text-slate-500 pl-1">Instagram</label>
                                                <Input
                                                    value={formData.instagram}
                                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                                    placeholder="@tu_cuenta"
                                                    className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-medium text-slate-500 pl-1">TikTok</label>
                                                <Input
                                                    value={formData.tiktok}
                                                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                                                    placeholder="@tu_cuenta"
                                                    className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-medium text-slate-500 pl-1">Web</label>
                                                <Input
                                                    value={formData.website}
                                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                    placeholder="https://..."
                                                    className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo de Negocio</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                            {[
                                                { id: 'retail', label: 'Detalle' },
                                                { id: 'wholesale', label: 'Mayorista' },
                                                { id: 'mixed', label: 'Detalle y Mayorista' },
                                                { id: 'restaurant', label: 'Restaurante' }
                                            ].map((type) => (
                                                <label key={type.id} className="flex items-center justify-center p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50/50">
                                                    <input
                                                        type="radio"
                                                        name="businessType"
                                                        value={type.id}
                                                        className="sr-only"
                                                        checked={formData.businessType === type.id}
                                                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                                    />
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {type.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>

                                        {/* Restaurant Menu Mode Toggle */}
                                        {formData.businessType === 'restaurant' && (
                                            <div className="pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between p-4 bg-primary-50/30 rounded-2xl border border-primary-100/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-primary-600 border border-primary-100 shadow-sm">
                                                            <Utensils size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-sm">Modo CARTA (Menú)</h4>
                                                            <p className="text-[10px] text-slate-500 font-medium">Desactiva el carrito y usa términos gastronómicos (Tipo/Porción).</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, menuMode: !formData.menuMode })}
                                                        className={cn(
                                                            "h-6 w-11 rounded-full relative transition-colors duration-200 shrink-0",
                                                            formData.menuMode ? "bg-primary-500" : "bg-slate-200"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all duration-200",
                                                            formData.menuMode ? "right-1" : "left-1"
                                                        )} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex justify-end">
                                        <Button type="submit" disabled={loading} className="font-bold">
                                            {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                            Guardar información
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm overflow-hidden bg-white">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <QrCode size={18} className="text-slate-500" />
                                    Código QR de tu Tienda
                                </div>
                                {!isPro && (
                                    <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-1 rounded-full border border-primary-200 uppercase tracking-widest">
                                        Planes de Pago
                                    </span>
                                )}
                            </div>
                            <CardContent className="p-6 relative">
                                <div className={cn("flex flex-col sm:flex-row items-center gap-8 transition-all duration-500", !isPro && "blur-sm grayscale opacity-40 pointer-events-none select-none")}>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                        <div style={{ height: "auto", margin: "0 auto", maxWidth: 150, width: "100%" }}>
                                            <QRCode
                                                size={256}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                value={`${window.location.origin}/catalogo/${company.slug}`}
                                                viewBox={`0 0 256 256`}
                                                id="QRCode"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h4 className="font-bold text-slate-900 mb-2">Comparte tu tienda</h4>
                                        <p className="text-sm text-slate-500 mb-4">
                                            Descarga este código QR y colócalo en tu local, mesas o tarjetas de presentación para que tus clientes accedan rápido a tu catálogo.
                                        </p>
                                        <Button onClick={downloadQR} className="w-full sm:w-auto">
                                            <Download size={16} className="mr-2" />
                                            Descargar QR
                                        </Button>
                                    </div>
                                </div>

                                {!isPro && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20">
                                        <div className={cn(
                                            "bg-white/95 backdrop-blur-md rounded-3xl border border-primary-100 shadow-xl max-w-[280px] sm:max-w-sm transition-all animate-in zoom-in-95 duration-300",
                                            pendingRequest ? "p-5" : "p-8"
                                        )}>
                                            <div className={cn(
                                                "bg-primary-100 rounded-2xl flex items-center justify-center mx-auto transition-all",
                                                pendingRequest ? "h-10 w-10 mb-3" : "h-12 w-12 mb-4"
                                            )}>
                                                <Sparkles className="text-primary-600" size={pendingRequest ? 20 : 24} />
                                            </div>
                                            <h4 className="font-bold text-slate-900 mb-1 text-sm sm:text-base leading-tight">Función Premium</h4>
                                            <p className="text-[10px] sm:text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">
                                                Genera códigos QR personalizados para simplificar el acceso a tu tienda.
                                            </p>
                                            {pendingRequest && (
                                                <div className="flex items-center justify-center gap-1.5 mb-3 py-1 px-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[9px] font-black uppercase tracking-wider animate-pulse">
                                                    <Clock size={10} />
                                                    Petición en proceso
                                                </div>
                                            )}
                                            <Button
                                                onClick={() => isDemo ? handleDemoAction("Mejorar Plan") : setShowUpgradeModal(true)}
                                                className={cn(
                                                    "w-full h-10 font-black shadow-lg shadow-primary-100 transition-all text-xs",
                                                    pendingRequest ? "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 shadow-none" : "bg-primary-600 hover:bg-primary-700"
                                                )}
                                            >
                                                {pendingRequest ? (
                                                    <>
                                                        <Clock size={14} className="mr-2" />
                                                        Ver Estado
                                                    </>
                                                ) : (
                                                    'Mejorar Plan'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Marca Blanca Section */}
                        <Card className="border-none shadow-sm overflow-hidden bg-white">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-primary-500" />
                                    Marca Propia (White Label)
                                </div>
                                {!isPro && (
                                    <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-1 rounded-full border border-primary-200 uppercase tracking-widest">
                                        Planes de Pago
                                    </span>
                                )}
                            </div>
                            <CardContent className="p-6 relative">
                                <div className={cn("space-y-4 transition-all duration-500", !isPro && "blur-[2px] opacity-50 pointer-events-none select-none")}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">Modo Landing Page (Enlace Limpio)</h4>
                                            <p className="text-xs text-slate-500 mt-1">Habilita una URL especial que oculta el menú superior y el footer de ktaloog.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={cn(
                                                    "h-6 w-11 rounded-full relative transition-colors duration-200 cursor-pointer",
                                                    company.landing_enabled ? "bg-emerald-500" : "bg-slate-200"
                                                )}
                                                onClick={async () => {
                                                    if (isDemo) {
                                                        handleDemoAction("Modo Landing");
                                                        return;
                                                    }
                                                    try {
                                                        setLoading(true);
                                                        const newState = !company.landing_enabled;
                                                        const { error } = await supabase
                                                            .from('companies')
                                                            .update({ landing_enabled: newState })
                                                            .eq('id', company.id);

                                                        if (error) throw error;
                                                        await refreshCompany();
                                                        showToast(newState ? "Modo Landing activado" : "Modo Landing desactivado", "success");
                                                    } catch (err) {
                                                        console.error('Error toggling landing mode:', err);
                                                        showToast("Error al cambiar modo landing", "error");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all duration-200",
                                                    company.landing_enabled ? "left-6" : "left-1"
                                                )} />
                                            </div>
                                        </div>
                                    </div>

                                    {company.landing_enabled && (
                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <LinkIcon size={12} />
                                                    Tu Enlace Limpio
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const link = `${window.location.origin}/catalogo/${company.slug}/landing`;
                                                        navigator.clipboard.writeText(link);
                                                        showToast("Enlace copiado al portapapeles", "success");
                                                    }}
                                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                                                >
                                                    Copiar Enlace
                                                </button>
                                            </div>
                                            <div className="bg-white px-3 py-2 rounded-lg border border-slate-100 text-xs font-mono text-slate-600 break-all">
                                                {window.location.origin}/catalogo/{company.slug}/landing
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!isPro && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <div className="flex flex-col items-center gap-3">
                                            {pendingRequest && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                                                    <Clock size={12} />
                                                    En Revisión
                                                </div>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={() => isDemo ? handleDemoAction("Mejorar Plan") : setShowUpgradeModal(true)}
                                                className={cn(
                                                    "bg-white/80 backdrop-blur-sm border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 font-black rounded-xl",
                                                    pendingRequest && "border-amber-200 shadow-none opacity-90"
                                                )}
                                            >
                                                {pendingRequest ? (
                                                    <>
                                                        <Clock size={16} className="mr-2" />
                                                        Ver Estado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={16} className="mr-2" />
                                                        Mejorar Plan
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div >
                );
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
                    <p className="text-slate-500">Gestiona la información de tu tienda y preferencias de cuenta.</p>
                </div>
                <div className="hidden md:block">
                    {activeTab === 'profile' && (
                        <Button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="shadow-lg shadow-primary-100 h-10 px-4 shrink-0 font-bold"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            <span>{isDemo ? 'Modo Demo' : 'Guardar Cambios'}</span>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Navigation */}
                <div className="space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm flex lg:flex-col overflow-x-auto no-scrollbar lg:overflow-x-visible gap-1 lg:gap-0 sticky top-0 md:relative z-20">
                        {[
                            { id: 'profile', name: 'Perfil', fullName: 'Perfil de Tienda', icon: <User size={18} /> },
                            {
                                id: 'broadcast',
                                name: 'Difusión',
                                fullName: 'Canal de Difusión',
                                icon: <Megaphone size={18} />
                            },
                            {
                                id: 'messages',
                                name: 'Mensajes',
                                fullName: 'Mensajes Sistema',
                                icon: <MessageSquare size={18} />,
                                badge: unreadSystemCount > 0 ? unreadSystemCount : null
                            },
                            {
                                id: 'notifications',
                                name: 'Alertas',
                                fullName: 'Notificaciones',
                                icon: <Bell size={18} />
                            },
                            { id: 'security', name: 'Seguridad', fullName: 'Seguridad', icon: <Shield size={18} /> },
                            { id: 'whatsapp', name: 'WhatsApp', fullName: 'Integración WhatsApp', icon: <Smartphone size={18} /> },
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "flex items-center justify-between px-4 py-2.5 lg:py-3 rounded-2xl text-[11px] lg:text-sm font-bold transition-all whitespace-nowrap shrink-0 lg:shrink",
                                    activeTab === item.id
                                        ? "bg-primary-50 text-primary-600 shadow-sm ring-1 ring-primary-100"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <div className="flex items-center gap-2 lg:gap-3">
                                    {item.icon}
                                    <span className="lg:hidden">{item.name}</span>
                                    <span className="hidden lg:inline">{item.fullName}</span>
                                </div>
                                {item.badge && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white ml-2 lg:ml-0">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="hidden lg:block">
                        <Card className="bg-white border-none overflow-hidden relative shadow-lg shadow-slate-200/50 group ring-1 ring-slate-100">
                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform duration-500",
                                        company.plan === 'free' ? "bg-slate-50 border-slate-100" :
                                            company.plan === 'plus' ? "bg-blue-50 border-blue-100" :
                                                company.plan === 'pro' ? "bg-amber-50 border-amber-100" :
                                                    "bg-emerald-50 border-emerald-100"
                                    )}>
                                        {company.plan === 'free' && <Rocket size={24} className="text-secondary-500 fill-secondary-500/10" />}
                                        {company.plan === 'plus' && <Zap size={24} className="text-blue-500 fill-blue-500/10" />}
                                        {company.plan === 'pro' && <Sparkles size={24} className="text-amber-500 fill-amber-500/10" />}
                                        {company.plan === 'custom' && <Shield size={24} className="text-slate-800 fill-slate-800/10" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-lg leading-tight text-slate-900">
                                                Plan {company.plan === 'free' ? 'Gratuito' : company.plan.charAt(0).toUpperCase() + company.plan.slice(1)}
                                            </h4>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                                company.plan === 'free' ? "bg-slate-100 text-slate-600 border-slate-200" :
                                                    company.plan === 'plus' ? "bg-blue-100 text-blue-800 border-blue-200" :
                                                        company.plan === 'pro' ? "bg-amber-100 text-amber-800 border-amber-200" :
                                                            "bg-emerald-100 text-emerald-800 border-emerald-200"
                                            )}>
                                                {company.plan.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-[11px] font-medium mt-0.5">
                                            Límite de productos activo
                                        </p>
                                    </div>
                                </div>

                                <p className="text-slate-600 text-xs mb-6 leading-relaxed border-t border-slate-100 pt-4">
                                    Mejora tu plan para desbloquear más productos, fotos y analíticas avanzadas.
                                </p>

                                <Button
                                    className={cn(
                                        "w-full font-bold shadow-lg transition-all",
                                        pendingRequest ? "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 shadow-none" : (
                                            company.plan === 'free' ? "bg-primary-600 hover:bg-primary-700 shadow-primary-100" :
                                                company.plan === 'plus' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" :
                                                    "bg-slate-900 hover:bg-slate-800 shadow-slate-200"
                                        )
                                    )}
                                    onClick={() => isDemo ? handleDemoAction("Mejorar Plan") : setShowUpgradeModal(true)}
                                >
                                    {pendingRequest ? (
                                        <>
                                            <Clock size={16} className="mr-2" />
                                            Solicitud en Revisión
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} className="mr-2 text-yellow-300" />
                                            {company.plan === 'free' ? 'Mejorar Plan' : 'Gestionar Plan'}
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="lg:col-span-2">
                    {renderContent()}
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
