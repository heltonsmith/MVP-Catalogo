import { useState, useEffect } from 'react';
import { ShoppingBag, Calendar, Store, ChevronRight, MessageSquare, ExternalLink, Search, Filter, ChevronLeft, ChevronRight as ChevronRightIcon, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils';
import { Link } from 'react-router-dom';

export default function CustomerQuotes() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState(null);
    const { showToast } = useToast();

    // Filter quotes first
    const filteredQuotes = quotes.filter(q => {
        const companyName = q.company?.name || '';
        const content = q.content || '';
        const searchLower = searchQuery.toLowerCase();

        const matchesSearch = companyName.toLowerCase().includes(searchLower) ||
            content.toLowerCase().includes(searchLower);

        const matchesDate = !dateFilter || new Date(q.created_at).toISOString().split('T')[0] === dateFilter;
        return matchesSearch && matchesDate;
    });

    // Group quotes by store
    const groupedQuotes = filteredQuotes.reduce((acc, quote) => {
        const storeId = quote.company_id;
        if (!acc[storeId]) {
            acc[storeId] = {
                company: quote.company,
                quotes: []
            };
        }
        acc[storeId].quotes.push(quote);
        return acc;
    }, {});

    const sortedStoreGroups = Object.values(groupedQuotes).sort((a, b) =>
        new Date(b.quotes[0].created_at) - new Date(a.quotes[0].created_at)
    );

    // Pagination for groups
    const totalPages = Math.ceil(sortedStoreGroups.length / itemsPerPage);
    const paginatedGroups = sortedStoreGroups.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, dateFilter]);

    const handleDeleteClick = (quote) => {
        setQuoteToDelete(quote);
        setDeleteModalOpen(true);
    };

    const loadQuotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('whatsapp_quotes')
                .select('*, company:companies(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuotes(data || []);
        } catch (error) {
            console.error('Error loading quotes:', error);
            showToast("Error al cargar el historial", "error");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (user) {
            loadQuotes();
        }
    }, [user]);

    const confirmDelete = async () => {
        if (!quoteToDelete) return;
        try {
            const { error } = await supabase
                .from('whatsapp_quotes')
                .delete()
                .eq('id', quoteToDelete.id);

            if (error) throw error;

            setQuotes(prev => prev.filter(q => q.id !== quoteToDelete.id));
            showToast("Cotización eliminada correctamente", "success");
        } catch (error) {
            console.error('Error deleting quote:', error);
            showToast("Error al eliminar la cotización", "error");
        } finally {
            setDeleteModalOpen(false);
            setQuoteToDelete(null);
        }
    };

    const handleResendClick = (quote) => {
        const message = quote.content;
        const phone = quote.company?.whatsapp;
        if (!phone) {
            showToast("La tienda no tiene número de WhatsApp configurado", "error");
            return;
        }
        const link = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(link, '_blank');
    };

    const formatMessageContent = (content) => {
        if (!content) return null;
        // Split by asterisks and map
        const parts = content.split(/(\*[^*]+\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('*') && part.endsWith('*')) {
                return <b key={index} className="font-black text-slate-800">{part.slice(1, -1)}</b>;
            }
            return part;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <MessageSquare size={28} className="text-emerald-500" /> Mis Cotizaciones WhatsApp
                </h2>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            type="date"
                            className="pl-10 h-10 w-full sm:w-48 bg-white border-none shadow-sm rounded-xl text-xs"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            placeholder="Buscar por tienda o producto..."
                            className="pl-10 h-10 w-full sm:w-64 bg-white border-none shadow-sm rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {filteredQuotes.length > 0 ? (
                <div className="space-y-8">
                    {paginatedGroups.map((group) => (
                        <div key={group.company?.id || 'unknown'} className="space-y-4">
                            <div className="flex items-center gap-4 px-2">
                                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                                    {group.company?.logo ? (
                                        <img src={group.company.logo} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <Store className="text-slate-300" size={20} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{group.company?.name || 'Tienda Desconocida'}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.quotes.length} Cotizaciones</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {group.quotes.map((quote) => (
                                    <Card key={quote.id} className="border-none bg-white rounded-[2rem] shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                        <CardContent className="p-0">
                                            <details className="group/details">
                                                <summary className="list-none cursor-pointer p-6 flex flex-col md:flex-row gap-6 items-center select-none">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="text-[10px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-tighter shrink-0 flex items-center gap-1">
                                                                <MessageSquare size={10} /> WhatsApp Enviado
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                                <Calendar size={10} /> {new Date(quote.created_at).toLocaleDateString()} {new Date(quote.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between md:justify-start gap-4">
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TOTAL ESTIMADO</p>
                                                                <p className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(quote.total)}</p>
                                                            </div>
                                                            <ChevronRight className="text-slate-300 md:hidden group-open/details:rotate-90 transition-transform" />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50 justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => { e.preventDefault(); handleDeleteClick(quote); }}
                                                            className="rounded-xl h-10 w-10 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                            title="Eliminar historial"
                                                        >
                                                            <Trash2 size={18} />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => { e.preventDefault(); handleResendClick(quote); }}
                                                            className="rounded-xl border-2 font-black text-[10px] gap-2 uppercase tracking-widest h-10 px-4 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                                        >
                                                            Reenviar <ExternalLink size={12} />
                                                        </Button>
                                                        <div className="hidden md:block">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover/details:bg-emerald-50 group-open/details:bg-emerald-50 transition-colors">
                                                                <ChevronRight className="text-slate-400 group-open/details:rotate-90 group-open/details:text-emerald-500 transition-transform duration-300" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </summary>

                                                <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="bg-slate-50/50 rounded-[1.5rem] p-6 border border-slate-100 relative">
                                                        <p className="text-xs text-slate-600 whitespace-pre-wrap font-medium leading-relaxed font-mono">
                                                            {formatMessageContent(quote.content)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </details>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-8">
                            <Button
                                variant="ghost"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="rounded-xl h-10 w-10 p-0"
                            >
                                <ChevronLeft size={20} />
                            </Button>
                            <span className="text-sm font-black text-slate-600 uppercase tracking-widest">
                                Página {currentPage} de {totalPages}
                            </span>
                            <Button
                                variant="ghost"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="rounded-xl h-10 w-10 p-0"
                            >
                                <ChevronRightIcon size={20} />
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-16 text-center space-y-6 shadow-sm">
                    <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <ShoppingBag size={40} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-xl mb-2">No tienes cotizaciones guardadas</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">Todas las cotizaciones que envíes por WhatsApp quedarán registradas aquí para tu control.</p>
                    </div>
                    <Link to="/explorar">
                        <Button className="rounded-2xl px-10 h-12 text-sm font-black shadow-xl shadow-primary-200 uppercase tracking-widest">Empezar a comprar</Button>
                    </Link>
                </div>
            )}

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
                        Esta acción no se puede deshacer. Se eliminará el registro de tu historial, pero el mensaje de WhatsApp enviado no se borrará del chat.
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
