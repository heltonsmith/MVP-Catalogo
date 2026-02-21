import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for user-side ticket management (HelpPage).
 * Reads/writes support_tickets and ticket_messages from Supabase.
 */
export function useTickets(userId) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    const fetchTickets = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        try {
            // Get tickets
            const { data: ticketData, error: ticketErr } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (ticketErr) throw ticketErr;

            // Get all messages for the user's tickets
            const ticketIds = (ticketData || []).map(t => t.id);
            let messages = [];
            if (ticketIds.length > 0) {
                const { data: msgData, error: msgErr } = await supabase
                    .from('ticket_messages')
                    .select('*')
                    .in('ticket_id', ticketIds)
                    .order('created_at', { ascending: true });
                if (!msgErr) messages = msgData || [];
            }

            // Merge messages into tickets
            const merged = (ticketData || []).map(ticket => ({
                ...ticket,
                messages: messages
                    .filter(m => m.ticket_id === ticket.id)
                    .map(m => ({
                        id: m.id,
                        sender: m.sender_role,
                        text: m.text,
                        timestamp: m.created_at
                    }))
            }));

            setTickets(merged);
        } catch (err) {
            console.error('useTickets fetchTickets:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    // Realtime subscription
    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel(`tickets-user-${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${userId}` }, () => fetchTickets())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, () => fetchTickets())
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [userId, fetchTickets]);

    const createTicket = useCallback(async ({ type, subject, description, company_id, photos = [] }) => {
        const { data, error } = await supabase
            .from('support_tickets')
            .insert({ user_id: userId, company_id, type, subject, description, photos })
            .select()
            .single();
        if (error) throw error;
        await fetchTickets();
        return data;
    }, [userId, fetchTickets]);

    const sendMessage = useCallback(async (ticketId, text) => {
        const newMessage = {
            id: crypto.randomUUID(),
            sender: 'client',
            text,
            timestamp: new Date().toISOString()
        };

        // Optimistic update
        setTickets(prev => prev.map(t => t.id === ticketId
            ? { ...t, messages: [...t.messages, newMessage] }
            : t
        ));

        const { error } = await supabase
            .from('ticket_messages')
            .insert({ ticket_id: ticketId, sender_id: userId, sender_role: 'client', text });
        if (error) throw error;

        // Realtime will handle the rest
    }, [userId]);

    const deleteTicket = useCallback(async (ticketId) => {
        const { error } = await supabase
            .from('support_tickets')
            .delete()
            .eq('id', ticketId)
            .eq('user_id', userId);
        if (error) throw error;
        setTickets(prev => prev.filter(t => t.id !== ticketId));
    }, [userId]);

    return { tickets, loading, fetchTickets, createTicket, sendMessage, deleteTicket, scrollRef };
}

/**
 * Hook for admin-side ticket management (AdminTickets).
 */
export function useAdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            // Get all tickets + profile join for customer info
            const { data: ticketData, error: ticketErr } = await supabase
                .from('support_tickets')
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        email,
                        whatsapp,
                        avatar_url
                    ),
                    companies:company_id (
                        id,
                        name,
                        logo,
                        whatsapp
                    )
                `)
                .order('created_at', { ascending: false });

            if (ticketErr) throw ticketErr;

            const ticketIds = (ticketData || []).map(t => t.id);
            let messages = [];
            if (ticketIds.length > 0) {
                const { data: msgData, error: msgErr } = await supabase
                    .from('ticket_messages')
                    .select('*')
                    .in('ticket_id', ticketIds)
                    .order('created_at', { ascending: true });
                if (!msgErr) messages = msgData || [];
            }

            const merged = (ticketData || []).map(ticket => {
                const profile = ticket.profiles;
                const company = ticket.companies;

                return {
                    ...ticket,
                    customer_name: profile?.full_name || profile?.email || 'Sin nombre',
                    customer_avatar: profile?.avatar_url || '',
                    customer_whatsapp: profile?.whatsapp || '',
                    customer_email: profile?.email || '',

                    company_name: company?.name || '',
                    company_logo: company?.logo || '',
                    company_whatsapp: company?.whatsapp || '',

                    // Unified fields for display
                    display_avatar: company?.logo || profile?.avatar_url || '',
                    display_name: company?.name || profile?.full_name || 'Sin nombre',
                    display_whatsapp: company?.whatsapp || profile?.whatsapp || '',

                    messages: messages
                        .filter(m => m.ticket_id === ticket.id)
                        .map(m => ({
                            id: m.id,
                            sender: m.sender_role,
                            text: m.text,
                            timestamp: m.created_at
                        }))
                };
            });

            setTickets(merged);
        } catch (err) {
            console.error('useAdminTickets fetchTickets:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    // Realtime
    useEffect(() => {
        const channel = supabase
            .channel('admin-tickets-all')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, () => fetchTickets())
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchTickets]);

    const updateStatus = useCallback(async (ticketId, status) => {
        const { error } = await supabase
            .from('support_tickets')
            .update({ status })
            .eq('id', ticketId);
        if (error) throw error;
        setTickets(prev => prev.map(t => t.id === ticketId
            ? { ...t, status }
            : t
        ));
    }, []);

    const sendAdminMessage = useCallback(async (ticketId, text, adminUserId) => {
        const newMessage = {
            id: crypto.randomUUID(),
            sender: 'admin',
            text,
            timestamp: new Date().toISOString()
        };

        // Optimistic update
        setTickets(prev => prev.map(t => t.id === ticketId
            ? {
                ...t,
                messages: [...t.messages, newMessage],
                status: t.status === 'pendiente' ? 'en_proceso' : t.status
            }
            : t
        ));

        const { error } = await supabase
            .from('ticket_messages')
            .insert({ ticket_id: ticketId, sender_id: adminUserId, sender_role: 'admin', text });
        if (error) throw error;

        // Also mark ticket as 'en_proceso' if it was pending
        await supabase
            .from('support_tickets')
            .update({ status: 'en_proceso' })
            .eq('id', ticketId)
            .eq('status', 'pendiente');

        // No need to fetchTickets() immediately if optimistic update worked, 
        // but realtime logic will eventually sync it.
    }, []);

    const deleteTicket = useCallback(async (ticketId) => {
        const { error } = await supabase
            .from('support_tickets')
            .delete()
            .eq('id', ticketId);
        if (error) throw error;
        setTickets(prev => prev.filter(t => t.id !== ticketId));
    }, []);

    return { tickets, loading, fetchTickets, updateStatus, sendAdminMessage, deleteTicket, scrollRef };
}
