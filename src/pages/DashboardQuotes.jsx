import { useState, useEffect, useMemo } from 'react';
import { FileText, ExternalLink, Calendar, Clock, User, ArrowUpRight, BadgeCheck, Loader2, MessageSquare, Filter, CheckCircle2, CheckSquare, Zap, Search, Trash2, Plus, ChevronRight, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { formatCurrency, cn } from '../utils';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/ui/Modal';

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { QUOTES as MOCK_QUOTES, COMPANIES } from '../data/mock';
import { PlanUpgradeModal } from '../components/dashboard/PlanUpgradeModal';

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
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCustomers, setExpandedCustomers] = useState({});
    const [currentCustomerPage, setCurrentCustomerPage] = useState(1);
    const CUSTOMERS_PER_PAGE = 20;

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
                .select('*, quote_items(*, products(name, sku))')
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

    const handleDemoAction = (action) => {
        showToast(`Esta es una acción demo: ${action}. En la versión real, esta acción se realizaría correctamente.`, "demo");
    };

    useEffect(() => {
        fetchQuotes();
    }, [company?.id, isDemo, demoCompany.id, dateRange]);

    const updateStatus = async (quoteId, newStatus) => {
        if (isDemo) {
            setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
            handleDemoAction(`Actualizar estado a ${newStatus === 'answered' ? 'Respondida' : 'Completada'}`);
            return;
        }

        try {
            // Update the main quotes table
            const { data: updatedQuotes, error } = await supabase
                .from('quotes')
                .update({ status: newStatus })
                .eq('id', quoteId)
                .select();

            if (error) throw error;

            if (!updatedQuotes || updatedQuotes.length === 0) {
                console.error('No rows updated in quotes table for ID:', quoteId);
                showToast("No se pudo actualizar la cotización en la base de datos", "error");
                return;
            }

            console.log('Status updated in quotes table:', updatedQuotes[0]);

            // Best-effort sync with whatsapp_quotes table
            const quote = quotes.find(q => q.id === quoteId);
            if (quote) {
                // We use multiple fields to find the corresponding whatsapp_quote
                // since they don't share a direct foreign key but usually share these values
                const { error: syncError } = await supabase
                    .from('whatsapp_quotes')
                    .update({ status: newStatus })
                    .match({
                        company_id: company.id,
                        total: quote.total,
                        customer_name: quote.customer_name
                    });

                if (syncError) console.warn('Could not sync with whatsapp_quotes:', syncError);
            }

            setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
            showToast("Estado actualizado correctamente", "success");
        } catch (error) {
            console.error('Error updating status:', error);
            showToast("Error al actualizar estado: " + (error.message || "Error desconocido"), "error");
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState(null);

    const handleDeleteClick = (quote) => {
        setQuoteToDelete(quote);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!quoteToDelete) return;

        const quoteId = quoteToDelete.id;

        if (isDemo) {
            setQuotes(quotes.filter(q => q.id !== quoteId));
            handleDemoAction("Eliminar cotización");
            setDeleteModalOpen(false);
            setQuoteToDelete(null);
            return;
        }

        try {
            const { error: itemsError } = await supabase
                .from('quote_items')
                .delete()
                .eq('quote_id', quoteId);

            const { error } = await supabase
                .from('quotes')
                .delete()
                .eq('id', quoteId);

            if (error) throw error;

            setQuotes(quotes.filter(q => q.id !== quoteId));
            showToast("Cotización eliminada correctamente", "success");
        } catch (error) {
            console.error('Error deleting quote:', error);
            showToast("Error al eliminar la cotización", "error");
        } finally {
            setDeleteModalOpen(false);
            setQuoteToDelete(null);
        }
    };

    // Grouping Logic
    const groupedCustomers = useMemo(() => {
        const groups = {};

        let filteredQuotes = quotes;

        // Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredQuotes = filteredQuotes.filter(q =>
                q.customer_name?.toLowerCase().includes(term) ||
                q.customer_whatsapp?.toLowerCase().includes(term) ||
                q.customer_email?.toLowerCase().includes(term)
            );
        }

        filteredQuotes.forEach(quote => {
            const key = quote.customer_whatsapp || quote.customer_email || 'anonymous';
            if (!groups[key]) {
                groups[key] = {
                    key,
                    name: quote.customer_name,
                    whatsapp: quote.customer_whatsapp,
                    email: quote.customer_email,
                    quotes: [],
                    lastActivity: quote.created_at
                };
            }
            groups[key].quotes.push(quote);
            if (new Date(quote.created_at) > new Date(groups[key].lastActivity)) {
                groups[key].lastActivity = quote.created_at;
            }
        });

        // Sort customers by most recent activity
        return Object.values(groups).sort((a, b) =>
            new Date(b.lastActivity) - new Date(a.lastActivity)
        );
    }, [quotes, searchTerm]);

    const totalPages = Math.ceil(groupedCustomers.length / CUSTOMERS_PER_PAGE);
    const paginatedCustomers = groupedCustomers.slice(
        (currentCustomerPage - 1) * CUSTOMERS_PER_PAGE,
        currentCustomerPage * CUSTOMERS_PER_PAGE
    );

    const toggleCustomer = (key) => {
        setExpandedCustomers(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
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
            <PlanUpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                companyId={company?.id}
            />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cotizaciones WhatsApp</h1>
                    <p className="text-slate-500">Historial de presupuestos enviados a tus clientes.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Buscar cliente..."
                            className="pl-9 h-11 bg-white border-slate-200 rounded-xl font-medium focus:ring-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 font-bold"
                                title="Limpiar filtros"
                            >
                                <Filter size={14} className="fill-slate-400" />
                            </button>
                        )}
                    </div>

                    {company?.plan === 'free' && (
                        <Button
                            onClick={() => isDemo ? handleDemoAction("Mejorar Plan") : setShowUpgradeModal(true)}
                            variant="secondary"
                            className="font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 h-11"
                        >
                            <Zap size={18} className="mr-2 fill-current" />
                            Mejorar tu plan
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-4 relative min-h-[400px]">
                <div className={cn("space-y-4 transition-all duration-500", company?.plan === 'free' && "blur-[8px] grayscale opacity-30 select-none pointer-events-none")}>
                    {paginatedCustomers.map((customer) => (
                        <div key={customer.key} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                            {/* Customer Header */}
                            <button
                                onClick={() => toggleCustomer(customer.key)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors border-b border-transparent"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                                        <User size={20} className="text-slate-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-slate-800">{customer.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                            {customer.quotes.length} {customer.quotes.length === 1 ? 'Cotización' : 'Cotizaciones'} • Última: {new Date(customer.lastActivity).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 mr-2">
                                        {customer.quotes.filter(q => q.status === 'pending').map((_, i) => (
                                            <div key={i} className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                        ))}
                                    </div>
                                    <div className={cn("p-2 rounded-xl transition-all", expandedCustomers[customer.key] ? "bg-primary-50 text-primary-600 rotate-180" : "bg-slate-50 text-slate-400")}>
                                        <ChevronDownIcon size={18} />
                                    </div>
                                </div>
                            </button>

                            <AnimatePresence>
                                {expandedCustomers[customer.key] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-slate-50/50"
                                    >
                                        <div className="p-4 space-y-4">
                                            {customer.quotes.map((quote) => (
                                                <Card key={quote.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all ring-1 ring-slate-100/50 bg-white">
                                                    <div className="flex flex-col md:flex-row">
                                                        <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-slate-100">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
                                                                        <FileText size={18} className="text-primary-600" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">ID: {quote.id.split('-')[0]}</span>
                                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                                            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(quote.created_at).toLocaleDateString()}</span>
                                                                            <span className="flex items-center gap-1"><Clock size={10} /> {new Date(quote.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0.5", getStatusStyle(quote.status))}>
                                                                    {getStatusLabel(quote.status)}
                                                                </Badge>
                                                            </div>

                                                            <div className="bg-slate-50/70 rounded-2xl p-4 space-y-2 border border-slate-100">
                                                                {quote.quote_items?.map((item, i) => (
                                                                    <div key={i} className="flex justify-between text-xs items-start gap-4">
                                                                        <div className="flex-1 min-w-0">
                                                                            <span className="text-slate-600 font-medium block truncate">
                                                                                <span className="font-bold text-primary-600">{item.quantity}x</span> {item.products?.name}
                                                                            </span>
                                                                            {item.products?.sku && (
                                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.products.sku}</span>
                                                                            )}
                                                                        </div>
                                                                        <span className="font-bold text-slate-800 tabular-nums">{formatCurrency(item.price_at_time * item.quantity)}</span>
                                                                    </div>
                                                                ))}
                                                                <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Cotizado</span>
                                                                    <span className="text-sm font-bold text-primary-600">{formatCurrency(quote.total)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="w-full md:w-56 p-5 flex flex-col justify-center items-center gap-3">
                                                            {quote.status === 'pending' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full h-10 text-[11px] font-bold text-blue-600 border-blue-200 hover:bg-blue-50 transition-all rounded-xl shadow-sm"
                                                                    onClick={() => updateStatus(quote.id, 'answered')}
                                                                >
                                                                    <CheckSquare size={14} className="mr-2" />
                                                                    Marcar Respondida
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full h-10 text-[11px] font-bold text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200 transition-all rounded-xl shadow-sm"
                                                                onClick={() => handleDeleteClick(quote)}
                                                            >
                                                                <Trash2 size={14} className="mr-2" />
                                                                Eliminar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {/* Customer Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentCustomerPage === 1}
                                onClick={() => setCurrentCustomerPage(p => p - 1)}
                                className="font-bold h-9 rounded-xl border-slate-200"
                            >
                                Anterior
                            </Button>
                            <span className="text-xs font-bold text-slate-500 mx-4">
                                Página {currentCustomerPage} de {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentCustomerPage === totalPages}
                                onClick={() => setCurrentCustomerPage(p => p + 1)}
                                className="font-bold h-9 rounded-xl border-slate-200"
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}

                    {groupedCustomers.length === 0 && !loading && (
                        <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="mx-auto h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                <FileText size={32} className="text-slate-200" />
                            </div>
                            <h3 className="font-bold text-slate-900">Sin cotizaciones aún</h3>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">
                                {searchTerm || dateRange.start || dateRange.end
                                    ? "No hay resultados para tu búsqueda o rango de fechas."
                                    : "Cuando tus clientes te contacten por WhatsApp, verás sus pedidos aquí."
                                }
                            </p>
                        </div>
                    )}
                </div>

                {company?.plan === 'free' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10 bg-white/5 backdrop-blur-[2px]">
                        <div className="bg-white/90 backdrop-blur-md p-10 rounded-[32px] border border-amber-100 shadow-2xl max-w-md animate-in zoom-in-95 duration-300">
                            <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Zap className="text-amber-500 fill-amber-500/20" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Panel de Cotizaciones PRO</h3>
                            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                                Gestiona todos tus pedidos de WhatsApp desde un solo lugar, marca estados, lleva el historial de clientes y potencia tus ventas.
                            </p>
                            <Button
                                onClick={() => isDemo ? handleDemoAction("Mejorar Plan") : setShowUpgradeModal(true)}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-amber-200"
                            >
                                <Plus size={18} className="mr-2" />
                                Desbloquear ahora
                            </Button>
                            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disponible en todos los planes de pago</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                maxWidth="sm"
            >
                <div className="p-8 pb-10 text-center">
                    <div className="mx-auto w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-500 animate-in zoom-in-50 duration-300">
                        <Trash2 size={40} className="drop-shadow-sm" />
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                        ¿Eliminar cotización?
                    </h3>

                    <p className="text-slate-500 text-sm font-medium leading-relaxed px-4 mb-10">
                        Esta acción no se puede deshacer. Se eliminará permanentemente de tu historial de ventas.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteModalOpen(false)}
                            className="flex-1 rounded-2xl h-14 text-sm font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 uppercase tracking-widest order-2 sm:order-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="flex-1 rounded-2xl h-14 bg-rose-500 hover:bg-rose-600 text-white text-sm font-black shadow-xl shadow-rose-200 uppercase tracking-widest order-1 sm:order-2"
                        >
                            Sí, Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

