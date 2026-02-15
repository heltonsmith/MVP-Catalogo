import { useState, useEffect, useMemo } from 'react';
import { FileText, ExternalLink, Calendar, Clock, User, ArrowUpRight, BadgeCheck, Loader2, MessageSquare, Filter, CheckCircle2, CheckSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
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
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchQuotes = async () => {
        if (isDemo) {
            setLoading(true);
            setTimeout(() => {
                // Filter quotes by company
                let companyQuotes = MOCK_QUOTES.filter(q => q.companyId === demoCompany.id);

                // Apply Date Filter Mock
                if (dateRange.start) {
                    companyQuotes = companyQuotes.filter(q => new Date(q.created_at) >= new Date(dateRange.start));
                }
                if (dateRange.end) {
                    // End of day
                    const endDate = new Date(dateRange.end);
                    endDate.setHours(23, 59, 59, 999);
                    companyQuotes = companyQuotes.filter(q => new Date(q.created_at) <= endDate);
                }

                setQuotes(companyQuotes);
                setLoading(false);
            }, 600);
            return;
        }

        if (!company?.id) return;
        setLoading(true);
        try {
            let query = supabase
                .from('quotes')
                .select('*, quote_items(*, products(name))')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (dateRange.start) {
                query = query.gte('created_at', new Date(dateRange.start).toISOString());
            }
            if (dateRange.end) {
                // Set to end of day for the end date
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                query = query.lte('created_at', endDate.toISOString());
            }

            const { data, error } = await query;

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
    }, [company?.id, isDemo, demoCompany.id, dateRange]);

    const updateStatus = async (quoteId, newStatus) => {
        if (isDemo) {
            setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
            showToast(`Estado actualizado a ${newStatus === 'answered' ? 'Respondida' : 'Completada'}`, "success");
            return;
        }

        try {
            const { error } = await supabase
                .from('quotes')
                .update({ status: newStatus })
                .eq('id', quoteId);

            if (error) throw error;

            setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
            showToast("Estado actualizado correctamente", "success");
        } catch (error) {
            console.error('Error updating status:', error);
            showToast("Error al actualizar estado", "error");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'answered': return 'bg-blue-50 text-blue-600 border-blue-100'; // New answering style
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'cancelled': return 'bg-red-50 text-red-400 border-red-100';
            default: return 'bg-slate-50 text-slate-500';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Completada';
            case 'answered': return 'Respondida';
            case 'pending': return 'Pendiente';
            case 'cancelled': return 'Cancelada';
            default: return status;
        }
    };

    if (authLoading || (loading && quotes.length === 0)) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
            <p className="text-slate-500 font-bold animate-pulse">Cargando cotizaciones...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cotizaciones WhatsApp</h1>
                    <p className="text-slate-500">Historial de presupuestos enviados a tus clientes.</p>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <div className="relative">
                        <Input
                            type="date"
                            className="h-9 w-36 border-none bg-transparent text-xs font-bold"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <span className="text-slate-300">-</span>
                    <div className="relative">
                        <Input
                            type="date"
                            className="h-9 w-36 border-none bg-transparent text-xs font-bold"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                    {(dateRange.start || dateRange.end) && (
                        <button
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
                            title="Limpiar filtros"
                        >
                            <Filter size={14} className="fill-slate-400" />
                        </button>
                    )}
                </div>
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
                                            {getStatusLabel(quote.status)}
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

                                    <div className="space-y-2">
                                        <a
                                            href={`https://wa.me/${quote.customer_whatsapp.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full block"
                                        >
                                            <Button variant="secondary" size="sm" className="w-full text-xs font-bold gap-2 bg-white border-slate-200">
                                                <MessageSquare size={14} />
                                                Responder WhatsApp
                                            </Button>
                                        </a >

                                        {quote.status === 'pending' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                                                onClick={() => updateStatus(quote.id, 'answered')}
                                            >
                                                <CheckSquare size={14} className="mr-2" />
                                                Marcar Respondida
                                            </Button>
                                        )}

                                        {quote.status !== 'completed' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                onClick={() => updateStatus(quote.id, 'completed')}
                                            >
                                                <CheckCircle2 size={14} className="mr-2" />
                                                Marcar Completado
                                            </Button>
                                        )}
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
                            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">
                                {dateRange.start || dateRange.end
                                    ? "No hay cotizaciones en el rango de fechas seleccionado."
                                    : "Cuando tus clientes te contacten por WhatsApp, verás sus pedidos aquí."
                                }
                            </p>
                        </div>
                    )
                }
            </div >
        </div >
    );
}

