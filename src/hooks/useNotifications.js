import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export function useNotifications() {
    const { user, refreshUnreadNotifications, setUnreadNotifications } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const { showToast } = useToast();  // Assuming useToast is available via hook or context

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('id, type, title, content, is_read, created_at, metadata, user_id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const fetchedNotifications = data || [];
            // Robust check: Ensure array
            if (!Array.isArray(fetchedNotifications)) {
                console.error('Fetched notifications is not an array:', fetchedNotifications);
                setNotifications([]);
                return;
            }
            setNotifications(fetchedNotifications);

            // Debug: Log the first notification to see types
            if (fetchedNotifications.length > 0) {
                console.log('useNotifications: Sample notification:', {
                    id: fetchedNotifications[0].id,
                    is_read: fetchedNotifications[0].is_read,
                    type: typeof fetchedNotifications[0].is_read
                });
            }

            const count = fetchedNotifications.filter(n => n.is_read === false || n.is_read === 'f').length;
            setUnreadCount(count);

            // Synchronize with global state in AuthContext
            if (setUnreadNotifications) {
                console.log('useNotifications: Syncing global unread count:', count);
                setUnreadNotifications(count);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // We use console.error, but let's try to surface it if possible without crashing
            // showToast("Error al cargar notificaciones", "error"); 
        } finally {
            setLoading(false);
        }

    }, [user, setUnreadNotifications]);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        console.log('useNotifications: Setting up realtime subscription');
        const channel = supabase
            .channel(`notifications_list:${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log('useNotifications: Realtime event receive', payload);

                if (payload.eventType === 'INSERT') {
                    setNotifications(prev => [payload.new, ...prev]);
                    setUnreadCount(prev => prev + 1);
                } else if (payload.eventType === 'DELETE') {
                    setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                    // We don't verify is_read here easily without old record data might be partial, 
                    // but typically deleting reduces unread count if it was unread.
                    // Ideally we'd sync unread count completely or check payload.old if available (Record)
                    // For now, simpler to re-fetch count or just let AuthContext sync it eventually.
                } else if (payload.eventType === 'UPDATE') {
                    setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
                    // Check if read status changed to adjust counter locally? 
                    // It's complex to calc diff. AuthContext handles the badge. 
                    // This local unreadCount is mostly for the hook consumers.
                }
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
