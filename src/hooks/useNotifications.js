import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
    const { user, refreshUnreadNotifications, setUnreadNotifications } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const fetchedNotifications = data || [];
            setNotifications(fetchedNotifications);
            const count = fetchedNotifications.filter(n => !n.is_read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        const channel = supabase
            .channel(`public:notifications:user:${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
                // Rollback on error
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
                // Rollback on error
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
                // Rollback on error
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
                // Rollback on error
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
                // Rollback on error
                fetchNotifications();
                throw error;
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAsUnread,
        deleteNotification,
        markAllAsRead,
        clearAll,
        refresh: fetchNotifications
    };
}
