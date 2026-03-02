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
                .eq('is_deleted_by_user', false)
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

            console.log(`[useTickets] Raw messages for ${ticketIds.length} tickets:`, messages.length, messages);

            // Merge messages into tickets
            const merged = (ticketData || []).map(ticket => {
                const ticketMessages = messages.filter(m => m.ticket_id === ticket.id);
                console.log(`[useTickets] Ticket ${ticket.id} (${ticket.subject}) has ${ticketMessages.length} messages.`);

                return {
                    ...ticket,
                    messages: ticketMessages.map(m => ({
                        id: m.id,
                        sender: m.sender_role,
                        text: m.text,
                        timestamp: m.created_at
                    }))
                };
            });

            setTickets(merged);
        } catch (err) {
            console.error('useTickets fetchTickets:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchMessagesForTicket = useCallback(async (ticketId) => {
        if (!ticketId) return;
        try {
            const { data: msgData, error: msgErr } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (msgErr) {
                console.error('[User] Error fetching messages for ticket:', ticketId, msgErr);
                return;
            }

            console.log(`[User] fetchMessagesForTicket result for ${ticketId}:`, msgData?.length || 0, msgData);

            const formattedMessages = (msgData || []).map(m => ({
                id: m.id,
                sender: m.sender_role,
                text: m.text,
                timestamp: m.created_at
            }));

            // Merge into tickets state
            setTickets(prev => prev.map(t =>
                t.id === ticketId
                    ? { ...t, messages: formattedMessages }
                    : t
            ));
        } catch (err) {
            console.error('[User] fetchMessagesForTicket error:', err);
        }
    }, []);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    // Realtime subscription
    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel(`tickets-user-${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${userId}` }, () => fetchTickets())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_messages' }, () => fetchTickets())
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [userId, fetchTickets]);

    const createTicket = useCallback(async ({ type, subject, description, company_id, photos = [] }) => {
        const { data, error } = await supabase
            .from('support_tickets')
            .insert({ user_id: userId, company_id, type, subject, description, photos })
            .select()
            .maybeSingle();
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
            .update({ is_deleted_by_user: true })
            .eq('id', ticketId)
            .eq('user_id', userId);
        if (error) throw error;
        setTickets(prev => prev.filter(t => t.id !== ticketId));
    }, [userId]);

    return { tickets, loading, fetchTickets, fetchMessagesForTicket, createTicket, sendMessage, deleteTicket, scrollRef };
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
            // 1. Get all tickets + joins
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

            // 2. Get ALL messages for these tickets in one go
            const ticketIds = (ticketData || []).map(t => t.id);
            let allMessages = [];
            if (ticketIds.length > 0) {
                const { data: msgData, error: msgErr } = await supabase
                    .from('ticket_messages')
                    .select('*')
                    .in('ticket_id', ticketIds)
                    .order('created_at', { ascending: true });
                if (!msgErr) allMessages = msgData || [];
            }

            // 3. Merge
            const merged = (ticketData || []).map(ticket => {
                const profile = ticket.profiles;
                const company = ticket.companies;
                const ticketMessages = allMessages.filter(m => m.ticket_id === ticket.id);

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

                    messages: ticketMessages.map(m => ({
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

    // Fetch messages for a specific ticket and merge into state
    const fetchMessagesForTicket = useCallback(async (ticketId) => {
        if (!ticketId) return;
        try {
            const { data: msgData, error: msgErr } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (msgErr) {
                console.error('[Admin] Error fetching messages for ticket:', ticketId, msgErr);
                return;
            }

            const formattedMessages = (msgData || []).map(m => ({
                id: m.id,
                sender: m.sender_role,
                text: m.text,
                timestamp: m.created_at
            }));

            // Merge into tickets state
            setTickets(prev => prev.map(t =>
                t.id === ticketId
                    ? { ...t, messages: formattedMessages }
                    : t
            ));
        } catch (err) {
            console.error('[Admin] fetchMessagesForTicket error:', err);
        }
    }, []);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    // Realtime
    useEffect(() => {
        const channel = supabase
            .channel('admin-tickets-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
                setTimeout(() => fetchTickets(), 500);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_messages' }, (payload) => {
                // When a message event arrives, refresh that specific ticket's messages
                const ticketId = payload?.new?.ticket_id || payload?.old?.ticket_id;
                if (ticketId) {
                    setTimeout(() => fetchMessagesForTicket(ticketId), 300);
                }
                // Also do a full refresh for ticket list ordering/counts
                setTimeout(() => fetchTickets(), 800);
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchTickets, fetchMessagesForTicket]);

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
        try {
            // 1. Get ticket data to extract photo URLs
            const { data: ticket, error: fetchErr } = await supabase
                .from('support_tickets')
                .select('photos')
                .eq('id', ticketId)
                .maybeSingle();

            if (fetchErr) throw fetchErr;

            // 2. Delete photos from storage if they exist
            if (ticket?.photos && ticket.photos.length > 0) {
                const pathsToDelete = ticket.photos
                    .map(url => {
                        try {
                            // Extract path from public URL: https://.../storage/v1/object/public/support-attachments/tickets/USER_ID/FILENAME.ext
                            const parts = url.split('/support-attachments/');
                            return parts.length > 1 ? parts[1] : null;
                        } catch (e) { return null; }
                    })
                    .filter(path => path !== null);

                if (pathsToDelete.length > 0) {
                    await supabase.storage
                        .from('support-attachments')
                        .remove(pathsToDelete);
                }
            }

            // 3. Delete the ticket record (cascading messages)
            const { error: deleteErr } = await supabase
                .from('support_tickets')
                .delete()
                .eq('id', ticketId);

            if (deleteErr) throw deleteErr;

            setTickets(prev => prev.filter(t => t.id !== ticketId));
        } catch (err) {
            console.error('Error hard-deleting ticket:', err);
            throw err;
        }
    }, []);

    return { tickets, loading, fetchTickets, fetchMessagesForTicket, updateStatus, sendAdminMessage, deleteTicket, scrollRef };
}
