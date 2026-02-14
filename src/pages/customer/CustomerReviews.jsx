import { useState, useEffect } from 'react';
import {
    Star,
    Search,
    Store,
    Calendar,
    ChevronRight,
    MessageSquare,
    Trash2,
    Edit3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../utils';

export default function CustomerReviews() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            loadReviews();
        }
    }, [user]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*, company:companies(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteReview = async (id) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta reseña?')) return;

        try {
            const { error } = await supabase.from('reviews').delete().eq('id', id);
            if (error) throw error;
            setReviews(prev => prev.filter(r => r.id !== id));
            showToast("Reseña eliminada", "success");
        } catch (error) {
            showToast("Error al eliminar", "error");
        }
    };

    const filteredReviews = reviews.filter(r =>
        r.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.comment?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <div className="grid grid-cols-1 gap-4">
                    {filteredReviews.map((review) => (
                        <Card key={review.id} className="border-none bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                            {review.company?.logo ? (
                                                <img src={review.company.logo} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <Store className="text-slate-300" size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 uppercase tracking-tight">{review.company?.name || 'Tienda'}</h4>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        className={cn(
                                                            i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                                        <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(review.created_at).toLocaleDateString()}</span>
                                            {review.reply && <span className="text-primary-600 flex items-center gap-1"><MessageSquare size={10} /> Con respuesta</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end md:self-center">
                                        <button
                                            onClick={() => deleteReview(review.id)}
                                            className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center border border-transparent hover:border-rose-100"
                                            title="Eliminar reseña"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
        </div>
    );
}
