import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useUnreadMessages(companyId) {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!companyId) return;

        const fetchUnreadCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('company_id', companyId)
                    .eq('sender_type', 'customer')
                    .eq('is_read', false);

                if (error) throw error;
                setUnreadCount(count || 0);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();

        // Subscribe to changes
        const channel = supabase
            .channel(`unread-messages:${companyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'messages',
                    filter: `company_id=eq.${companyId}`
                },
                (payload) => {
                    // It's simpler to refetch the count on any change to messages for this company
                    // trying to maintain increment/decrement logic manually can be error-prone with multiple devices
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [companyId]);

    return { unreadCount };
}
