import { useState, useEffect, useMemo } from 'react';
import { FileText, ExternalLink, Calendar, Clock, User, ArrowUpRight, BadgeCheck, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, cn } from '../utils';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { QUOTES as MOCK_QUOTES, COMPANIES } from '../data/mock';

export default function DashboardQuotes() {
    const { company: authCompany, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Check for demo mode
    const isDemo = location.pathname.includes('/demo') || searchParams.get('demo') === 'true';

    // Detect which demo type - use useMemo to prevent recreation on every render
    const isDemoRestaurant = location.pathname.includes('/demo/restaurante');
    const demoCompany = useMemo(() =>
        isDemoRestaurant ? COMPANIES[2] : COMPANIES[0],
        [isDemoRestaurant]
    );

    // Use mock company if in demo mode
    const company = isDemo ? { ...demoCompany, id: 'demo', plan: 'pro' } : authCompany;

    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQuotes = async () => {
        if (isDemo) {
            setLoading(true);
            setTimeout(() => {
                // Filter quotes by company
                const companyQuotes = MOCK_QUOTES.filter(q => q.companyId === demoCompany.id);
                setQuotes(companyQuotes);
                setLoading(false);
            }, 600);
            return;
        }

        if (!company?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select(`
    *,
    quote_items(
                        *,
        products(name)
    )
        `)
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuotes(data || []);
        } catch (error) {
            console.error('Error fetching quotes:', error);
            showToast("Error al cargar las cotizaciones", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, [company?.id, isDemo, demoCompany.id]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'cancelled': return 'bg-red-50 text-red-400 border-red-100';
            default: return 'bg-slate-50 text-slate-500';
        }
    };

    const handleAction = () => {
        showToast("Gestión de estado próximamente", "info");
    };

    if (authLoading || (loading && quotes.length === 0)) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
            <p className="text-slate-500 font-bold animate-pulse">Cargando cotizaciones...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cotizaciones WhatsApp</h1>
                    <p className="text-slate-500">Historial de presupuestos enviados a tus clientes.</p>
                </div>
                <Button onClick={handleAction} className="h-10 px-4 shrink-0 shadow-lg shadow-primary-100 font-bold">
                    <BadgeCheck className="h-5 w-5 mr-2" />
                    <span>Configurar Respuestas</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {quotes.map((quote) => (
                    <Card key={quote.id} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-all group ring-1 ring-slate-100/50">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row">
                                {/* Quote Main Info */}
                                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
                                                <FileText size={18} className="text-primary-600" />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{quote.id.split('-')[0]}</span>
                                        </div>
                                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0.5", getStatusStyle(quote.status))}>
                                            {quote.status === 'completed' ? 'Completada' : quote.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                                <User size={18} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{quote.customer_name}</p>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                                                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(quote.created_at).toLocaleDateString()}</span>
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(quote.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/70 rounded-2xl p-4 space-y-2 border border-slate-100">
                                            {quote.quote_items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-xs">
                                                    <span className="text-slate-600 font-medium">
                                                        <span className="font-bold text-primary-600">{item.quantity}x</span> {item.products?.name}
                                                    </span>
                                                    <span className="font-bold text-slate-800">{formatCurrency(item.price_at_time * item.quantity)}</span>
                                                </div>
                                            ))}
                                            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Cotizado</span>
                                                <span className="text-sm font-bold text-primary-600">{formatCurrency(quote.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quote Sidebar Actions */}
                                <div className="w-full md:w-64 p-6 bg-slate-50/30 flex flex-col justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100">
                                            <BadgeCheck size={14} />
                                            Venta vía WhatsApp
                                        </div>
                                        {quote.notes && (
                                            <div className="p-3 bg-white rounded-xl border border-slate-100 text-[11px] text-slate-500 italic">
                                                "{quote.notes}"
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight">Cliente: {quote.customer_whatsapp}</p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                                        <Button variant="outline" size="sm" className="w-full text-xs font-bold border-slate-200 bg-white" onClick={handleAction}>
                                            Ver Historial
                                        </Button>
                                        <a
                                            href={`https://wa.me/${quote.customer_whatsapp.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full"
                                        >
                                            <Button variant="secondary" size="sm" className="w-full text-xs font-bold gap-2">
                                                <MessageSquare size={14} />
                                                Responder
                                            </Button>
                                        </a >
                                    </div >
                                </div >
                            </div >
                        </CardContent >
                    </Card >
                ))}
                {
                    quotes.length === 0 && !loading && (
                        <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="mx-auto h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                <FileText size={32} className="text-slate-200" />
                            </div>
                            <h3 className="font-bold text-slate-900">Sin cotizaciones aún</h3>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">Cuando tus clientes te contacten por WhatsApp, verás sus pedidos aquí.</p>
                        </div>
                    )
                }
            </div >

            {/* Empty State / Info */}
            < div className="mt-12 p-8 text-center rounded-3xl border-2 border-dashed border-slate-200" >
                <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <ExternalLink size={32} className="text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold">Integración WhatsApp</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
                    Todas las cotizaciones generadas en la demo se sincronizan automáticamente con tu historial para seguimiento comercial.
                </p>
            </div >
        </div >
    );
}
