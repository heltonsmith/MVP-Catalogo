import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Quote, Package, MessageCircle, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';

export function NotificationCenter() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                setNotifications(prev => [payload.new, ...prev]);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.is_read).length);
    }, [notifications]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                if (error.code === 'PGRST116' || error.status === 404) {
                    // Table doesn't exist yet, handle gracefully
                    setNotifications([]);
                    return;
                }
                throw error;
            }
            if (data) {
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        }
    };

    const markAsRead = async (id) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        // Optimistic update handled by real-time subscription or local state
        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        }
    };

    const markAllAsRead = async () => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    };

    const clearAll = async () => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id);

        if (!error) {
            setNotifications([]);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'quote': return <Quote className="text-blue-500" size={16} />;
            case 'stock': return <Package className="text-amber-500" size={16} />;
            case 'chat':
            case 'message': return <MessageCircle className="text-emerald-500" size={16} />;
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

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-primary-600 transition-colors rounded-full hover:bg-slate-100 active:scale-95"
                title="Notificaciones"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            Notificaciones
                            {unreadCount > 0 && (
                                <span className="text-[10px] bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-bold">
                                    {unreadCount} nuevas
                                </span>
                            )}
                        </h3>
                        {notifications.length > 0 && (
                            <div className="flex gap-3">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700"
                                >
                                    Todo leido
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="text-[10px] font-bold text-slate-400 hover:text-rose-500"
                                >
                                    Limpiar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
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
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 hover:bg-slate-50 transition-colors flex gap-3 relative cursor-pointer group",
                                            !notification.is_read && "bg-blue-50/30"
                                        )}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-0.5",
                                            notification.type === 'quote' ? 'bg-blue-50' :
                                                notification.type === 'stock' ? 'bg-amber-50' :
                                                    notification.type === 'chat' || notification.type === 'message' ? 'bg-emerald-50' : 'bg-slate-50'
                                        )}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-xs font-bold text-slate-900 mb-0.5 leading-tight",
                                                !notification.is_read && "text-blue-900"
                                            )}>
                                                {notification.title}
                                            </p>
                                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                                {notification.content}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {formatTime(notification.created_at)}
                                                </span>
                                                {!notification.is_read && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                            <button className="text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors">
                                Ver todas las actividades
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
