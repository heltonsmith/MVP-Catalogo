import { useState, useEffect } from 'react';
import {
    MessageSquare,
    Search,
    Store,
    Clock,
    Send,
    User,
    MoreVertical,
    CheckCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../utils';

export default function CustomerMessages() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Placeholder for loading chats
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (loading) {
        return (
            <div className="h-[600px] bg-white rounded-[3rem] shadow-sm flex items-center justify-center animate-pulse">
                <div className="text-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl mx-auto mb-4" />
                    <div className="h-4 w-32 bg-slate-50 rounded-full mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-12rem)] min-h-[500px] flex flex-col md:flex-row bg-white rounded-[3rem] shadow-sm overflow-hidden border border-slate-100">
            {/* Sidebar: Chat List */}
            <div className="w-full md:w-80 border-r border-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="text-primary-600" size={20} /> Mensajes
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <Input
                            placeholder="Buscar chats..."
                            className="pl-9 h-10 bg-slate-50 border-none rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <EmptyState />
                </div>
            </div>

            {/* Chat Area Placeholder */}
            <div className="flex-1 bg-slate-50/30 flex flex-col items-center justify-center p-12 text-center">
                <div className="h-24 w-24 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 border border-slate-50">
                    <MessageSquare size={40} className="text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Selecciona una conversación</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium">Aquí podrás chatear directamente con los dueños de las tiendas para resolver dudas sobre tus pedidos.</p>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-12">
            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Store size={20} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin chats activos</p>
        </div>
    );
}
