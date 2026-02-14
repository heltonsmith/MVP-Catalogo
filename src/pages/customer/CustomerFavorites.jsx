import { useState, useEffect } from 'react';
import {
    Heart,
    Store,
    Trash2,
    Search,
    BadgeCheck,
    Star,
    Tag,
    FolderPlus
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
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // For editing favorite category
    const [editingFavorite, setEditingFavorite] = useState(null);
    const [tempCategory, setTempCategory] = useState('');

    useEffect(() => {
        if (user) {
            loadFavorites();
        }
    }, [user]);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('*, target:companies(*)')
                .eq('user_id', user.id);

            if (error) throw error;
            setFavorites(data || []);
        } catch (error) {
            console.error('Error loading favorites:', error);
            showToast("Error al cargar favoritos", "error");
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (id) => {
        try {
            const { error } = await supabase.from('favorites').delete().eq('id', id);
            if (error) throw error;
            setFavorites(prev => prev.filter(f => f.id !== id));
            showToast("Eliminado de favoritos", "success");
        } catch (error) {
            showToast("Error al eliminar", "error");
        }
    };

    const saveFavoriteCategory = async () => {
        if (!editingFavorite) return;
        try {
            const { error } = await supabase
                .from('favorites')
                .update({ user_category: tempCategory })
                .eq('id', editingFavorite.id);

            if (error) throw error;

            setFavorites(prev => prev.map(f => f.id === editingFavorite.id ? { ...f, user_category: tempCategory } : f));
            setEditingFavorite(null);
            showToast("Categoría guardada", "success");
        } catch (error) {
            showToast("Error al guardar", "error");
        }
    };

    const filteredFavorites = favorites.filter(f => {
        const matchesTab = activeTab === 'all' || f.type === activeTab;
        const matchesSearch = f.target?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.user_category?.toLowerCase().includes(searchQuery.toLowerCase());
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

            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 self-start w-fit">
                {['all', 'retail', 'wholesale', 'restaurant'].map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === t ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {t === 'all' ? 'Todas' : t === 'retail' ? 'Minorista' : t === 'wholesale' ? 'Por Mayor' : 'Resto'}
                    </button>
                ))}
            </div>

            {filteredFavorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFavorites.map((fav) => (
                        <Card key={fav.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white rounded-[2rem] overflow-hidden shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex gap-4">
                                    <Link to={`/catalogo/${fav.target?.slug}`} className="shrink-0">
                                        <div className="h-20 w-20 rounded-2xl bg-slate-50 overflow-hidden ring-4 ring-slate-50 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                            {fav.target?.logo ? (
                                                <img src={fav.target.logo} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center font-black text-slate-300 text-3xl">
                                                    {fav.target?.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/catalogo/${fav.target?.slug}`}>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <h4 className="font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors uppercase tracking-tight">{fav.target?.name}</h4>
                                                {fav.target?.plan === 'pro' && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
                                            </div>
                                        </Link>

                                        <div className="flex items-center flex-wrap gap-2 mb-4">
                                            <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                {fav.type === 'retail' ? 'Minorista' : fav.type === 'wholesale' ? 'Mayorista' : 'Restaurante'}
                                            </span>
                                            {fav.user_category ? (
                                                <button
                                                    onClick={() => {
                                                        setEditingFavorite(fav);
                                                        setTempCategory(fav.user_category);
                                                    }}
                                                    className="text-[9px] bg-primary-50 text-primary-600 font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 border border-primary-100 hover:bg-primary-100 transition-colors"
                                                >
                                                    <Tag size={10} /> {fav.user_category}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingFavorite(fav);
                                                        setTempCategory('');
                                                    }}
                                                    className="text-[9px] bg-slate-50 text-slate-400 font-bold px-2 py-0.5 rounded-md uppercase tracking-widest border border-dashed border-slate-200 hover:border-primary-300 hover:text-primary-500 transition-all flex items-center gap-1"
                                                >
                                                    <FolderPlus size={10} /> Categorizar
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <Star size={12} className="fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-black text-slate-700">{fav.target?.rating || '4.9'}</span>
                                            </div>
                                            <button
                                                onClick={() => removeFavorite(fav.id)}
                                                className="h-9 w-9 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center border border-transparent hover:border-rose-100"
                                                title="Eliminar favorito"
                                            >
                                                <Trash2 size={16} />
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

            {/* Categorize Modal */}
            <Modal
                isOpen={!!editingFavorite}
                onClose={() => setEditingFavorite(null)}
                title="Sincronizar Categoría"
                maxWidth="sm"
            >
                <div className="p-8 space-y-8 text-center bg-slate-50/50">
                    <div className="h-20 w-20 bg-primary-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary-100">
                        <Tag size={36} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Clasifica tu tienda</h4>
                        <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">Organiza tus favoritos para encontrarlos más rápido. Puedes usar etiquetas como "Mayorista", "Regalos", etc.</p>
                    </div>
                    <div className="space-y-6">
                        <Input
                            placeholder="Escribe una etiqueta..."
                            value={tempCategory}
                            onChange={(e) => setTempCategory(e.target.value)}
                            className="bg-white border-slate-200 h-14 rounded-2xl text-center font-bold"
                        />
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 h-12 rounded-2xl border-2 font-black" onClick={() => setEditingFavorite(null)}>CANCELAR</Button>
                            <Button className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary-100 font-black" onClick={saveFavoriteCategory}>GUARDAR</Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
