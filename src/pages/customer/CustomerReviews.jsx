import { useState, useEffect } from 'react';
import {
    Star,
    Search,
    Store,
    Calendar,
    ChevronRight,
    MessageSquare,
    Trash2,
    Edit3,
    AlertCircle,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    Save,
    X,
    Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../utils';
import { StarRating } from '../../components/ui/StarRating';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function CustomerReviews() {
    const { user, profile } = useAuth();
    const targetUserId = profile?.id || user?.id;
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // For editing
    const [editingReview, setEditingReview] = useState(null);
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // For deletion confirmation
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        if (targetUserId) {
            loadReviews();
        }
    }, [targetUserId]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*, company:companies(*)')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteReview = async () => {
        if (!confirmDelete) return;

        try {
            const { error } = await supabase.from('reviews').delete().eq('id', confirmDelete.id);
            if (error) throw error;
            setReviews(prev => prev.filter(r => r.id !== confirmDelete.id));
            setConfirmDelete(null);
            showToast("Reseña eliminada", "success");
        } catch (error) {
            showToast("Error al eliminar", "error");
        }
    };

    const updateReview = async () => {
        if (!editingReview || !editComment.trim()) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    rating: editRating,
                    comment: editComment.slice(0, 150),
                    customer_name: profile?.full_name || user.user_metadata?.full_name || 'Anónimo'
                })
                .eq('id', editingReview.id);

            if (error) throw error;

            setReviews(prev => prev.map(r =>
                r.id === editingReview.id
                    ? { ...r, rating: editRating, comment: editComment }
                    : r
            ));
            setEditingReview(null);
            showToast("Reseña actualizada", "success");
        } catch (error) {
            showToast("Error al actualizar", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredReviews = reviews.filter(r =>
        r.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.comment?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
    const paginatedReviews = filteredReviews.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Grouping logic for the CURRENT PAGE (or for all filtered reviews)
    // It's better to group the paginated results or the filtered results
    // The user specifically asked to "group by store", let's group all filtered results 
    // but maybe keep pagination at the review level or store level?
    // Usually, grouping by store means 1 store = 1 card with many rows.

    const reviewsByStore = paginatedReviews.reduce((acc, review) => {
        const storeId = review.company_id;
        if (!acc[storeId]) {
            acc[storeId] = {
                company: review.company,
                reviews: []
            };
        }
        acc[storeId].reviews.push(review);
        return acc;
    }, {});

    const sortedStoreGroups = Object.values(reviewsByStore).sort((a, b) =>
        a.company?.name?.localeCompare(b.company?.name)
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-white rounded-3xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Star size={28} className="text-amber-500" fill="currentColor" /> Mis Reseñas
                </h2>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                        placeholder="Buscar en tus reseñas..."
                        className="pl-10 h-10 w-full sm:w-64 bg-white border-none shadow-sm rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredReviews.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {sortedStoreGroups.map((group) => (
                            <Card key={group.company?.id} className="border-none bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-0">
                                    {/* Store Header */}
                                    <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden ring-2 ring-white">
                                                {group.company?.logo ? (
                                                    <img src={group.company.logo} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <Store className="text-slate-300" size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-tight">
                                                    {group.company?.name}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                    {group.reviews.length} {group.reviews.length === 1 ? 'Reseña' : 'Reseñas'}
                                                </p>
                                            </div>
                                        </div>
                                        <Link to={`/catalogo/${group.company?.slug}`}>
                                            <Button variant="ghost" size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
                                                Ver Tienda <ChevronRight size={14} />
                                            </Button>
                                        </Link>
                                    </div>

                                    {/* Reviews List */}
                                    <div className="divide-y divide-slate-50">
                                        {group.reviews.map((review) => (
                                            <div key={review.id} className="p-8 hover:bg-slate-50/30 transition-colors group/review">
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="md:w-32 shrink-0">
                                                        <div className="flex items-center gap-1 mb-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={14}
                                                                    className={cn(
                                                                        i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                            <Calendar size={10} /> {new Date(review.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0 bg-white md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 border md:border-none border-slate-100">
                                                        <p className="text-sm text-slate-600 leading-relaxed italic break-words">
                                                            "{review.comment}"
                                                        </p>
                                                        {review.reply && (
                                                            <div className="mt-4 bg-primary-50/50 rounded-2xl p-4 border border-primary-100/50 relative">
                                                                <MessageSquare className="absolute -top-2 -left-2 text-primary-200" size={20} fill="currentColor" />
                                                                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Respuesta de la tienda:</p>
                                                                <p className="text-xs text-slate-500 font-medium">
                                                                    {review.reply}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                setEditingReview(review);
                                                                setEditRating(review.rating);
                                                                setEditComment(review.comment);
                                                            }}
                                                            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center border border-transparent hover:border-primary-100"
                                                            title="Editar"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(review)}
                                                            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center border border-transparent hover:border-rose-100"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

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
                    <div className="h-24 w-24 bg-amber-50 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4">
                        <Star size={48} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-xl mb-2">Tu opinión importa</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">Comparte tu experiencia con los emprendedores y ayuda a otros clientes a elegir mejor.</p>
                    </div>
                    <Link to="/explorar">
                        <Button className="rounded-2xl px-10 h-12 text-sm font-black shadow-xl shadow-primary-200 uppercase tracking-widest">Ver mis Tiendas</Button>
                    </Link>
                </div>
            )}

            {/* Edit Review Modal */}
            <Modal
                isOpen={!!editingReview}
                onClose={() => setEditingReview(null)}
                title="Editar mi reseña"
                maxWidth="sm"
            >
                <div className="p-8 space-y-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                            <Star size={32} fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingReview?.company?.name}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Actualiza tu calificación y comentario</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Calificación</p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setEditRating(star)}
                                        className="transition-transform hover:scale-125"
                                    >
                                        <Star
                                            size={32}
                                            className={cn(
                                                "transition-colors",
                                                star <= editRating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Comentario</p>
                                <span className="text-[10px] font-bold text-slate-400">{editComment?.length || 0}/150</span>
                            </div>
                            <textarea
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value.slice(0, 150))}
                                maxLength={150}
                                className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl text-sm text-slate-600 focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                                placeholder="Cuéntanos más sobre tu experiencia..."
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="outline" className="flex-1 h-12 rounded-2xl border-2 font-black" onClick={() => setEditingReview(null)}>
                                CANCELAR
                            </Button>
                            <Button
                                className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary-100 font-black"
                                onClick={updateReview}
                                disabled={isSaving || !editComment.trim()}
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : "GUARDAR CAMBIOS"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Eliminar Reseña"
                maxWidth="sm"
            >
                <div className="p-8 space-y-8 text-center">
                    <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-100/50">
                        <Trash2 size={36} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">¿Estás seguro?</h4>
                        <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                            Esta acción no se puede deshacer. Se eliminará permanentemente tu opinión sobre <span className="font-bold text-slate-900">{confirmDelete?.company?.name}</span>.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 h-12 rounded-2xl border-2 font-black" onClick={() => setConfirmDelete(null)}>CANCELAR</Button>
                        <Button className="flex-1 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100 font-black text-white" onClick={deleteReview}>ELIMINAR</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
