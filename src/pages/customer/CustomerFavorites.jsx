import { useState, useEffect } from 'react';
import {
    Heart,
    Store,
    Search,
    BadgeCheck,
    Star,
    AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../utils';

export default function CustomerFavorites() {
    const { user, profile } = useAuth();
    const targetUserId = profile?.id || user?.id;
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // For removal confirmation
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        if (targetUserId) {
            loadFavorites();
        }
    }, [targetUserId]);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('*, company:companies(*)')
                .eq('user_id', targetUserId);

            if (error) throw error;

            if (data && data.length > 0) {
                const companyIds = data.map(f => f.company_id);
                // Fetch reviews to calculate real ratings
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('company_id, rating')
                    .is('product_id', null)
                    .in('company_id', companyIds);

                const ratingsMap = {};
                reviewsData?.forEach(r => {
                    if (!ratingsMap[r.company_id]) ratingsMap[r.company_id] = { sum: 0, count: 0 };
                    ratingsMap[r.company_id].sum += r.rating;
                    ratingsMap[r.company_id].count += 1;
                });

                const dataWithRatings = data.map(f => ({
                    ...f,
                    company: {
                        ...f.company,
                        calculatedRating: ratingsMap[f.company_id]
                            ? (ratingsMap[f.company_id].sum / ratingsMap[f.company_id].count).toFixed(1)
                            : 0
                    }
                }));
                setFavorites(dataWithRatings);
            } else {
                setFavorites([]);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            showToast("Error al cargar favoritos", "error");
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async () => {
        if (!confirmDelete) return;
        try {
            const { error } = await supabase.from('favorites').delete().eq('id', confirmDelete.id);
            if (error) throw error;
            setFavorites(prev => prev.filter(f => f.id !== confirmDelete.id));
            setConfirmDelete(null);
            showToast("Eliminado de favoritos", "success");
        } catch (error) {
            showToast("Error al eliminar", "error");
        }
    };


    const filteredFavorites = favorites.filter(f => {
        let matchesTab = activeTab === 'all';
        if (!matchesTab) {
            if (activeTab === 'retail') {
                matchesTab = f.company?.business_type === 'retail' || f.company?.business_type === 'mixed';
            } else if (activeTab === 'wholesale') {
                matchesTab = f.company?.business_type === 'wholesale' || f.company?.business_type === 'mixed';
            } else {
                matchesTab = f.company?.business_type === activeTab;
            }
        }
        const matchesSearch = f.company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 4, 5].map(i => (
                    <div key={i} className="h-32 bg-white rounded-3xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Heart size={28} className="text-rose-500" fill="currentColor" /> Mis Favoritos
                </h2>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            placeholder="Buscar tiendas..."
                            className="pl-10 h-10 w-full sm:w-64 bg-white border-none shadow-sm rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 self-start w-fit max-w-full overflow-x-auto scrollbar-hide">
                {['all', 'retail', 'wholesale', 'mixed', 'restaurant'].map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === t ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {t === 'all' ? 'Todas' :
                            t === 'retail' ? 'Minorista' :
                                t === 'wholesale' ? 'Mayorista' :
                                    t === 'mixed' ? 'Mayorista y Detalle' :
                                        'Restaurante'}
                    </button>
                ))}
            </div>

            {filteredFavorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFavorites.map((fav) => (
                        <Card key={fav.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white rounded-[2rem] overflow-hidden shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex gap-4">
                                    <Link to={`/catalogo/${fav.company?.slug}`} className="shrink-0">
                                        <div className="h-20 w-20 rounded-2xl bg-slate-50 overflow-hidden ring-4 ring-slate-50 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                            {fav.company?.logo ? (
                                                <img src={fav.company.logo} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center font-black text-slate-300 text-3xl">
                                                    {fav.company?.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/catalogo/${fav.company?.slug}`}>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <h4 className="font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors uppercase tracking-tight">{fav.company?.name}</h4>
                                                {fav.company?.plan === 'pro' && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
                                            </div>
                                        </Link>

                                        <div className="flex items-center flex-wrap gap-2 mb-4">
                                            <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                {fav.company?.business_type === 'retail' ? 'Minorista' :
                                                    fav.company?.business_type === 'wholesale' ? 'Mayorista' :
                                                        fav.company?.business_type === 'mixed' ? 'Mayorista y Detalle' :
                                                            'Restaurante'}
                                            </span>
                                            <div className="flex items-center flex-wrap gap-2 mb-4 h-6">
                                                {/* Category info only, no edit */}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-black text-slate-700">{fav.company?.calculatedRating > 0 ? fav.company.calculatedRating : 'Sin calif.'}</span>
                                            </div>
                                            <button
                                                onClick={() => setConfirmDelete(fav)}
                                                className="h-9 w-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all flex items-center justify-center border border-rose-100 group/heart"
                                                title="Eliminar favorito"
                                            >
                                                <Heart size={16} fill="currentColor" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-16 text-center space-y-6 shadow-sm">
                    <div className="h-24 w-24 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <Heart size={48} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-xl mb-2">¿Sin favoritos todavía?</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">No te pierdas de nada. Guarda tus tiendas preferidas para recibir ofertas y actualizaciones personalizadas.</p>
                    </div>
                    <Link to="/explorar">
                        <Button className="rounded-2xl px-10 h-12 text-sm font-black shadow-xl shadow-primary-200 uppercase tracking-widest hover:scale-105 transition-transform">Ir al Mercado</Button>
                    </Link>
                </div>
            )}

            {/* Remove Confirmation Modal */}
            <Modal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                title="Quitar de Favoritos"
                maxWidth="sm"
            >
                <div className="p-8 space-y-8 text-center">
                    <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-100/50">
                        <Heart size={36} fill="currentColor" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">¿Estás seguro?</h4>
                        <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                            Se eliminará <span className="font-bold text-slate-900">{confirmDelete?.company?.name}</span> de tu lista de favoritos.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 h-12 rounded-2xl border-2 font-black" onClick={() => setConfirmDelete(null)}>CANCELAR</Button>
                        <Button className="flex-1 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100 font-black text-white" onClick={removeFavorite}>ELIMINAR</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
