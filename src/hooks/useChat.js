import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

export function useChat({ companyId, customerId, enabled = true }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const subscriptionRef = useRef(null);

    // Fetch initial messages and subscribe
    useEffect(() => {
        if (!enabled || !companyId || !customerId) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('company_id', companyId)
                    .eq('customer_id', customerId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setMessages(data || []);
            } catch (error) {
                console.error('Error fetching messages:', error);
                showToast('Error al cargar mensajes', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Real-time subscription
        const channel = supabase
            .channel(`chat:${companyId}:${customerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `company_id=eq.${companyId} AND customer_id=eq.${customerId}`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                }
            )
            .subscribe();

        subscriptionRef.current = channel;

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, [companyId, customerId, enabled]);

    const sendMessage = async (text, senderType) => {
        if (!text.trim()) return;

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    company_id: companyId,
                    customer_id: customerId,
                    content: text,
                    sender_type: senderType,
                    is_read: false
                });

            if (error) throw error;
            // The subscription will handle adding the message to state
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Error al enviar mensaje', 'error');
            return false;
        }
    };

    const markAsRead = async (senderTypeToMark) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('company_id', companyId)
                .eq('customer_id', customerId)
                .eq('is_read', false)
                .eq('sender_type', senderTypeToMark);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking messages as read:', error);
            return false;
        }
    }

    return { messages, loading, sendMessage, markAsRead };
}
