import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, Quote, Package, MessageCircle, AlertCircle, Trash2, Mail, MailOpen, Sparkles, ChevronRight, CheckCircle2, XCircle, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../utils';

export function NotificationCenter() {
    const { unreadNotifications: globalUnreadCount, profile } = useAuth();
    const navigate = useNavigate();
    const {
        notifications,
        loading,
        markAsRead,
        markAsUnread,
        deleteNotification,
        markAllAsRead,
        clearAll,
        refresh
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSelectedId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (notification) => {
        const type = notification.type;
        const isRejected = notification.metadata?.status === 'rejected' || notification.title.toLowerCase().includes('rechazada');
        const isApproved = notification.metadata?.status === 'approved' || notification.title.toLowerCase().includes('activado');

        if (isRejected) return <XCircle className="text-rose-500" size={16} />;
        if (isApproved) return <CheckCircle2 className="text-emerald-500" size={16} />;

        switch (type) {
            case 'quote': return <Quote className="text-blue-500" size={16} />;
            case 'stock': return <Package className="text-amber-500" size={16} />;
            case 'chat':
            case 'message': return <MessageCircle className="text-emerald-500" size={16} />;
            case 'system': return <Sparkles className="text-primary-500" size={16} />;
            default: return <AlertCircle className="text-slate-500" size={16} />;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Ahora';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
        return date.toLocaleDateString();
    };

    const handleToggleRead = (e, n) => {
        e.stopPropagation();
        if (n.is_read) markAsUnread(n.id);
        else markAsRead(n.id);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        deleteNotification(id);
        if (selectedId === id) setSelectedId(null);
    };

    const handleSelect = (id) => {
        if (selectedId === id) setSelectedId(null);
        else {
            setSelectedId(id);
            const n = notifications.find(notif => notif.id === id);
            if (n) {
                if (!n.is_read) markAsRead(id);

                // Navigation logic
                if (n.type === 'message' || n.type === 'chat') {
                    const companyId = n.metadata?.company_id;
                    const customerId = n.metadata?.customer_id;
                    const role = profile?.role;

                    if (role === 'owner' && customerId) {
                        navigate(`/dashboard/mensajes?id=${customerId}`);
                    } else if (role === 'client' && companyId) {
                        navigate(`/dashboard/cliente/mensajes?id=${companyId}`);
                    }
                } else if (n.type === 'stock') {
                    // Navigate to the store or product
                    const companySlug = n.metadata?.company_slug;
                    const productSlug = n.metadata?.product_slug;

                    if (companySlug) {
                        const url = productSlug
                            ? `/catalogo/${companySlug}/producto/${productSlug}`
                            : `/catalogo/${companySlug}`;
                        window.open(url, '_blank');
                    }
                } else if (n.type === 'review') {
                    const companySlug = n.metadata?.company_slug;
                    const productSlug = n.metadata?.product_slug;

                    if (companySlug) {
                        const url = productSlug
                            ? `/catalogo/${companySlug}/producto/${productSlug}#reviews`
                            : `/catalogo/${companySlug}#reviews`;
                        window.open(url, '_blank');
                    }
                } else if (n.metadata?.ticket_id) {
                    if (profile?.role === 'admin') {
                        navigate(`/admin/tickets?ticket=${n.metadata.ticket_id}`);
                    } else {
                        navigate(`/ayuda?ticket=${n.metadata.ticket_id}`);
                    }
                }
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    const willOpen = !isOpen;
                    setIsOpen(willOpen);
                    if (willOpen) refresh();
                }}
                className="relative p-2 text-slate-500 hover:text-primary-600 transition-colors rounded-full hover:bg-slate-100 active:scale-95"
                title="Notificaciones"
            >
                <Bell size={20} />
                {globalUnreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {globalUnreadCount > 9 ? '9+' : globalUnreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute -right-12 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-w-[400px]">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            Notificaciones
                            {globalUnreadCount > 0 && (
                                <span className="text-[10px] bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-bold">
                                    {globalUnreadCount} nuevas
                                </span>
                            )}
                        </h3>
                        {notifications.length > 0 && (
                            <div className="flex gap-3">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700 active:scale-95 transition-transform"
                                >
                                    Marcar todo
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="text-[10px] font-bold text-slate-400 hover:text-rose-500 active:scale-95 transition-transform"
                                >
                                    Limpiar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar bg-slate-50/30">
                        {loading ? (
                            <div className="p-10 text-center">
                                <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent animate-spin rounded-full mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <Bell size={24} className="text-slate-200" />
                                </div>
                                <p className="text-sm text-slate-500 font-semibold">Sin notificaciones</p>
                                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                                    Te avisaremos cuando recibas cotizaciones, mensajes o alertas de stock.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notification) => {
                                    const isRejected = notification.metadata?.status === 'rejected' || notification.title.toLowerCase().includes('rechazada');

                                    return (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "group relative transition-all duration-300",
                                                !notification.is_read ? (isRejected ? "bg-rose-50/30" : "bg-white") : "bg-transparent opacity-80"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "p-4 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors",
                                                    selectedId === notification.id && "bg-slate-50/80"
                                                )}
                                                onClick={() => handleSelect(notification.id)}
                                            >
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {notification.metadata?.actor_avatar ? (
                                                        <div className="h-9 w-9 rounded-2xl overflow-hidden shadow-sm border border-white ring-2 ring-slate-100">
                                                            <img
                                                                src={notification.metadata.actor_avatar}
                                                                alt={notification.metadata.customer_name || 'Avatar'}
                                                                className="h-full w-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.parentElement.innerHTML = '<div class="h-full w-full bg-slate-100 flex items-center justify-center"><Bell size={16} class="text-slate-400" /></div>';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className={cn(
                                                            "h-9 w-9 rounded-2xl flex items-center justify-center shadow-sm border border-white",
                                                            isRejected && !notification.is_read ? "bg-rose-100 text-rose-600" :
                                                                notification.type === 'quote' ? 'bg-blue-50 text-blue-600' :
                                                                    notification.type === 'stock' ? 'bg-amber-50 text-amber-600' :
                                                                        notification.type === 'system' ? 'bg-primary-50 text-primary-600' :
                                                                            notification.type === 'chat' || notification.type === 'message' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                                                        )}>
                                                            {getIcon(notification)}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                                        <p className={cn(
                                                            "text-xs font-black text-slate-900 leading-tight",
                                                            !notification.is_read && (isRejected ? "text-rose-700" : "text-primary-800")
                                                        )}>
                                                            {notification.type === 'review' && notification.metadata?.customer_name ? (
                                                                <>
                                                                    <span className="font-extrabold">{notification.metadata.customer_name}</span>
                                                                    <span className="font-normal opacity-80"> calificó tu {notification.metadata.product_slug ? 'producto' : 'tienda'}</span>
                                                                </>
                                                            ) : notification.title}
                                                        </p>
                                                        <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                                                            {formatTime(notification.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">
                                                        {notification.metadata?.comment || notification.content}
                                                    </p>

                                                    {notification.type === 'stock' && notification.metadata?.company_slug && (
                                                        <div className="mt-2 flex">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const companySlug = notification.metadata.company_slug;
                                                                    const productSlug = notification.metadata.product_slug;
                                                                    const url = productSlug
                                                                        ? `/catalogo/${companySlug}/producto/${productSlug}`
                                                                        : `/catalogo/${companySlug}`;
                                                                    window.open(url, '_blank');
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm"
                                                            >
                                                                <Package size={12} />
                                                                Ver Producto
                                                            </button>
                                                        </div>
                                                    )}

                                                    {notification.type === 'review' && (
                                                        <div className="mt-2 flex">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelect(notification.id);
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-100 text-[10px] font-bold text-yellow-700 hover:bg-yellow-100 transition-all shadow-sm"
                                                            >
                                                                <MessageCircle size={12} />
                                                                Ver Reseña
                                                            </button>
                                                        </div>
                                                    )}

                                                    {(notification.type === 'message' || notification.type === 'chat') && (
                                                        <div className="mt-2 flex">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelect(notification.id);
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm"
                                                            >
                                                                <MessageCircle size={12} />
                                                                Responder Mensaje
                                                            </button>
                                                        </div>
                                                    )}

                                                    {notification.metadata?.ticket_id && (
                                                        <div className="mt-2 flex">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelect(notification.id);
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 border border-primary-100 text-[10px] font-bold text-primary-600 hover:bg-primary-100 transition-all shadow-sm"
                                                            >
                                                                <LifeBuoy size={12} />
                                                                Ver Ticket
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleToggleRead(e, notification)}
                                                            className={cn(
                                                                "flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border text-[10px] font-bold transition-all shadow-sm",
                                                                isRejected ? "text-rose-600 border-rose-100 hover:bg-rose-50" : "text-slate-600 border-slate-100 hover:text-primary-600 hover:border-primary-100"
                                                            )}
                                                        >
                                                            {notification.is_read ? <Mail size={12} /> : <MailOpen size={12} />}
                                                            {notification.is_read ? 'Marcar no leído' : 'Marcar leído'}
                                                        </button>
                                                        {selectedId === notification.id && (
                                                            <button
                                                                onClick={(e) => handleDelete(e, notification.id)}
                                                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-100 text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm fade-in animate-in slide-in-from-top-1"
                                                            >
                                                                <Trash2 size={12} />
                                                                Eliminar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center justify-between py-1">
                                                    {!notification.is_read && (
                                                        <div className={cn("h-2 w-2 rounded-full shadow-sm", isRejected ? "bg-rose-500 shadow-rose-200" : "bg-primary-500 shadow-primary-200")} />
                                                    )}
                                                    <ChevronRight size={14} className={cn("text-slate-300 transition-transform", selectedId === notification.id && "rotate-90 text-primary-400")} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-white border-t border-slate-100 text-center">
                            <button className="text-[10px] font-black text-slate-400 hover:text-primary-600 uppercase tracking-widest transition-colors">
                                Centro de Actividad
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
