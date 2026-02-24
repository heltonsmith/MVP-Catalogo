import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
    const { user, setUnreadNotifications, unreadNotifications } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async (silent = false) => {
        if (!user) return;

        if (!silent) setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const fetchedNotifications = data || [];
            console.log(`[useNotifications] Fetched ${fetchedNotifications.length} notifications`);
            setNotifications(fetchedNotifications);

            const count = fetchedNotifications.filter(n => n.is_read === false || n.is_read === 'f').length;
            setUnreadCount(count);

            if (setUnreadNotifications) {
                setUnreadNotifications(count);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user, setUnreadNotifications]);

    // Fetch on mount
    useEffect(() => {
        if (!user) return;
        fetchNotifications();
    }, [user, fetchNotifications]);

    // Re-fetch when global count changes (essential for cross-component sync)
    // We fetch silently to avoid UI "blinking" while ensuring list stays fresh.
    useEffect(() => {
        if (!user || loading) return;
        fetchNotifications(true);
    }, [unreadNotifications]);

    // Direct Realtime subscription for instant local updates
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`notifications-hook-${user.id}-${Math.random().toString(36).slice(2, 9)}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log('[useNotifications] Realtime event captured:', payload.eventType);

                if (payload.eventType === 'INSERT') {
                    fetchNotifications(true);
                } else if (payload.eventType === 'UPDATE') {
                    // Gradual update for single item
                    setNotifications(prev => {
                        const newList = prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n);
                        // Sync derived counts
                        const newCount = newList.filter(n => n.is_read === false || n.is_read === 'f').length;
                        setUnreadCount(newCount);
                        // We DON'T setUnreadNotifications here to avoid immediate double-triggering 
                        // the unreadNotifications effect, although AuthContext will catch it anyway.
                        return newList;
                    });
                } else if (payload.eventType === 'DELETE') {
                    setNotifications(prev => {
                        const newList = prev.filter(n => n.id !== payload.old.id);
                        const newCount = newList.filter(n => n.is_read === false || n.is_read === 'f').length;
                        setUnreadCount(newCount);
                        return newList;
                    });
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user, fetchNotifications]);

    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (setUnreadNotifications) setUnreadNotifications(prev => Math.max(0, prev - 1));

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) {
                fetchNotifications();
                throw error;
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAsUnread = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
        setUnreadCount(prev => prev + 1);
        if (setUnreadNotifications) setUnreadNotifications(prev => prev + 1);

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: false })
                .eq('id', id);

            if (error) {
                fetchNotifications();
                throw error;
            }
        } catch (error) {
            console.error('Error marking as unread:', error);
        }
    };

    const deleteNotification = async (id) => {
        const notification = notifications.find(n => n.id === id);

        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notification && !notification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (setUnreadNotifications) setUnreadNotifications(prev => Math.max(0, prev - 1));
        }

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) {
                fetchNotifications();
                throw error;
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        if (setUnreadNotifications) setUnreadNotifications(0);

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) {
                fetchNotifications();
                throw error;
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const clearAll = async () => {
        if (!user) return;

        // Optimistic update
        setNotifications([]);
        setUnreadCount(0);
        if (setUnreadNotifications) setUnreadNotifications(0);

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id);

            if (error) {
                fetchNotifications();
                throw error;
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const unreadTicketsCount = [...new Set(
        notifications
            .filter(n => (n.is_read === false || n.is_read === 'f') && n.metadata?.ticket_id)
            .map(n => n.metadata.ticket_id)
    )].length;

    const unreadSystemCount = notifications.filter(n =>
        (n.is_read === false || n.is_read === 'f') &&
        (n.type === 'system' || n.type === 'message' || n.type === 'grace_period')
    ).length;

    const markTicketNotificationsAsRead = async (ticketId) => {
        if (!user || !ticketId) return;

        // Find relevant notification IDs
        const relevantIds = notifications
            .filter(n => n.metadata?.ticket_id === ticketId && (n.is_read === false || n.is_read === 'f'))
            .map(n => n.id);

        if (relevantIds.length === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => relevantIds.includes(n.id) ? { ...n, is_read: true } : n));
        const countReduced = relevantIds.length;
        setUnreadCount(prev => Math.max(0, prev - countReduced));
        if (setUnreadNotifications) setUnreadNotifications(prev => Math.max(0, prev - countReduced));

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', relevantIds);

            if (error) {
                fetchNotifications();
                throw error;
            }
        } catch (error) {
            console.error('Error marking ticket notifications as read:', error);
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        unreadTicketsCount,
        unreadSystemCount,
        markAsRead,
        markAsUnread,
        markTicketNotificationsAsRead,
        deleteNotification,
        markAllAsRead,
        clearAll,
        refresh: fetchNotifications
    };
}
