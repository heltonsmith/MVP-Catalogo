import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    MapPin,
    ShoppingBag,
    Utensils,
    Building2,
    Tag,
    ArrowRight,
    Sparkles,
    LayoutGrid,
    SearchX,
    Store,
    Star,
    Clock,
    Calendar,
    Globe,
    Heart
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

import { StoreSearch } from '../components/search/StoreSearch';
import { supabase } from '../lib/supabase';
import { cn } from '../utils';
import { Link } from 'react-router-dom';

const BUSINESS_FILTERS = [
    { id: 'all', label: 'Todo', icon: <LayoutGrid size={16} /> },
    { id: 'retail', label: 'Detalle', icon: <ShoppingBag size={16} /> },
    { id: 'wholesale', label: 'Mayorista', icon: <Building2 size={16} /> },
    { id: 'mixed', label: 'Detalle y Mayorista', icon: <Store size={16} /> },
    { id: 'restaurant', label: 'Restaurantes', icon: <Utensils size={16} /> },
];

export default function PublicExplorer() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [activeFilter, setActiveFilter] = useState('all');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { showToast } = useToast();
    const [userFavorites, setUserFavorites] = useState(new Set());

    const fetchData = async () => {
        setLoading(true);
        try {
            // Smart Search: Always search companies as the primary discovery entity
            let query = supabase.from('companies').select('*');

            if (search) {
                query = query.ilike('name', `%${search}%`);
            }

            if (location && location !== 'Todas las regiones') {
                const city = location.split(',')[0].trim();
                // If it's a specific city (contains comma) or just a region name, handle logic
                // For simplicity, if it's "Todas las regiones", we skip this filter.

                // If it's a region without city selected (e.g. "Metropolitana"), we filter by region
                // If it has a comma, it's "City, Region"

                if (location.includes(',')) {
                    // "City, Region" -> Filter by City or Commune
                    // REMOVED .eq('is_online', false) to allow online stores with registered addresses to appear
                    query = query.or(`region.ilike.%${city}%,city.ilike.%${city}%,commune.ilike.%${city}%`);
                } else {
                    // Just Region selected
                    query = query.ilike('region', `%${location}%`);
                }
            }

            if (activeFilter !== 'all') {
                query = query.eq('business_type', activeFilter);
            }

            // Prioritize sponsored and then recent
            query = query.order('is_sponsored', { ascending: false }).order('created_at', { ascending: false });

            const { data, error } = await query.limit(40);
            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error('Explorer error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFavorites = async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('favorites')
                .select('company_id')
                .eq('user_id', user.id);
            setUserFavorites(new Set(data?.map(f => f.company_id) || []));
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const toggleFavorite = async (e, store) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            showToast("Inicia sesión para guardar favoritos", "info");
            return;
        }

        const isFav = userFavorites.has(store.id);
        try {
            if (isFav) {
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('company_id', store.id);

                const newFavs = new Set(userFavorites);
                newFavs.delete(store.id);
                setUserFavorites(newFavs);
                showToast("Eliminado de favoritos", "success");
            } else {
                await supabase
                    .from('favorites')
                    .insert([{
                        user_id: user.id,
                        company_id: store.id,
                        type: store.business_type || 'retail'
                    }]);

                const newFavs = new Set(userFavorites);
                newFavs.add(store.id);
                setUserFavorites(newFavs);
                showToast("¡Guardado en favoritos!", "success");
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast("Error al procesar", "error");
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchData, 400);
        return () => clearTimeout(timer);
    }, [search, location, activeFilter]);

    useEffect(() => {
        if (user) fetchFavorites();
        else setUserFavorites(new Set());
    }, [user]);

    // Helper to check if store is new (created within last 30 days)
    const isNewStore = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    };

    // Helper to format antiquity
    const getAntiquity = (dateString) => {
        if (!dateString) return 'Reciente';
        const date = new Date(dateString);
        const now = new Date();
        const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

        if (diffMonths < 1) return 'Recién unido';
        if (diffMonths < 12) return `${diffMonths} meses`;
        const years = Math.floor(diffMonths / 12);
        return `${years} año${years > 1 ? 's' : ''}`;
    };

    // Helper to get initials from company name
    const getInitials = (name) => {
        if (!name) return 'TI'; // 'TI' for Tienda
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-20 pb-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Hero Header */}
                <div className="flex flex-col items-center text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-black uppercase tracking-widest mb-4">
                        <Sparkles size={12} /> Descubre el ecosistema
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-6xl max-w-3xl">
                        Encuentra exactamente lo que necesitas
                    </h1>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link to="/registro">
                            <Button className="h-12 px-8 rounded-2xl font-black shadow-xl shadow-primary-200">
                                Registrar mi Tienda
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Smart Unified Search Bar */}
                <div className="max-w-5xl mx-auto mb-12">
                    <StoreSearch
                        initialSearch={search}
                        initialLocation={location}
                        onSearch={({ search, location }) => {
                            setSearch(search);
                            setLocation(location);
                            setSearchParams({ q: search, location });
                        }}
                    />

                    {/* Quick Filters */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {BUSINESS_FILTERS.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={cn(
                                    "flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-black transition-all border-2",
                                    activeFilter === filter.id
                                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200"
                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                )}
                            >
                                <span className={cn(
                                    "p-1 rounded-lg",
                                    activeFilter === filter.id ? "bg-white/10" : "bg-slate-50"
                                )}>
                                    {filter.icon}
                                </span>
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-[380px] rounded-[2rem] bg-white border border-slate-100 animate-pulse flex flex-col p-6">
                                <div className="h-28 bg-slate-100 rounded-2xl mb-4" />
                                <div className="h-6 bg-slate-100 rounded w-3/4 mb-3" />
                                <div className="h-4 bg-slate-50 rounded w-full mb-2" />
                                <div className="h-4 bg-slate-50 rounded w-5/6 mb-auto" />
                                <div className="h-10 bg-slate-100 rounded-xl" />
                            </div>
                        ))
                    ) : results.length > 0 ? (
                        results.map(store => (
                            <Link key={store.id} to={`/catalogo/${store.slug}`}>
                                <Card className="group border-none shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden bg-white h-full rounded-[2.5rem]">
                                    <CardContent className="p-0 flex flex-col h-full">
                                        <div className="h-40 bg-slate-50 relative m-3 rounded-[2rem] overflow-hidden group/img flex items-center justify-center border border-slate-100">
                                            {/* Logo Only - Centered with margins */}
                                            <div className="h-24 w-24 rounded-2xl bg-white p-1 ring-4 ring-slate-100/50 shadow-sm flex-shrink-0 overflow-hidden transition-transform duration-500 group-hover:scale-110">
                                                {store.logo ? (
                                                    <img
                                                        src={store.logo}
                                                        alt={store.name}
                                                        className="w-full h-full object-cover"
                                                        style={{
                                                            objectPosition: `${store.branding_settings?.logo?.x ?? 50}% ${store.branding_settings?.logo?.y ?? 50}%`,
                                                            transform: `scale(${(store.branding_settings?.logo?.zoom ?? 100) / 100})`,
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                        <span className="text-slate-900 font-bold text-2xl">{getInitials(store.name)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <button
                                                    onClick={(e) => toggleFavorite(e, store)}
                                                    className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg",
                                                        userFavorites.has(store.id)
                                                            ? "bg-rose-500 text-white"
                                                            : "bg-white/80 text-rose-500 hover:bg-white"
                                                    )}
                                                >
                                                    <Heart size={16} className={userFavorites.has(store.id) ? "fill-current" : ""} />
                                                </button>
                                                {isNewStore(store.created_at) && (
                                                    <Badge className="bg-emerald-500 text-white border-none font-black shadow-sm flex items-center px-2 py-1 text-[10px] rounded-full">
                                                        NUEVO
                                                    </Badge>
                                                )}
                                                {store.is_sponsored && (
                                                    <Badge className="bg-amber-400 text-amber-950 border-none font-black shadow-sm flex gap-1 items-center px-3 py-1 text-[10px] rounded-full">
                                                        <Sparkles size={10} fill="currentColor" /> PREMIUM
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-8 pt-12 flex-1">
                                            <div className="flex items-start justify-between">
                                                <h3 className="font-black text-slate-900 text-xl leading-tight group-hover:text-primary-600 transition-colors">
                                                    {store.name}
                                                </h3>
                                            </div>

                                            {/* Rating and Reviews */}
                                            <div className="flex items-center gap-4 mt-2 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <Star size={14} className={cn("fill-amber-400 text-amber-400", !store.rating && "text-slate-300 fill-slate-300")} />
                                                    <span className="text-sm font-bold text-slate-900">{store.rating || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                    <Clock size={12} />
                                                    <span>{getAntiquity(store.created_at)}</span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-500 mb-2 line-clamp-2 min-h-[40px] leading-relaxed">
                                                {store.description || `Bienvenidos a ${store.name}`}
                                            </p>

                                            <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-50">
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                                                    {!store.is_online ? (
                                                        <>
                                                            <MapPin size={14} className="text-slate-300" />
                                                            <span className="truncate max-w-[120px]">{store.city || store.region || 'Chile'}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Globe size={14} className="text-primary-400" />
                                                            <span className="text-primary-600 uppercase tracking-widest text-[9px]">
                                                                {store.city ? `${store.city} (Online)` : '100% Online'}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {store.business_type === 'restaurant' ? (
                                                        <><Utensils size={10} className="text-orange-400" /> Restaurante</>
                                                    ) : store.business_type === 'wholesale' ? (
                                                        <><Building2 size={10} className="text-blue-400" /> Mayorista</>
                                                    ) : store.business_type === 'mixed' ? (
                                                        <><Store size={10} className="text-primary-400" /> Detalle y Mayorista</>
                                                    ) : (
                                                        <><Tag size={10} className="text-primary-400" /> Detalle</>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mx-8 mb-8">
                                            <Button className="w-full h-12 rounded-2xl bg-slate-50 text-slate-900 border-none font-bold hover:bg-primary-600 hover:text-white transition-all shadow-none group-hover:shadow-lg group-hover:shadow-primary-100">
                                                Ver Catálogo
                                                <ArrowRight size={18} className="ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <Card className="col-span-full max-w-lg mx-auto border-none bg-white shadow-2xl shadow-slate-200/50 rounded-[3rem] p-12 text-center mt-12">
                            <CardContent className="flex flex-col items-center">
                                <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-8">
                                    <SearchX size={48} className="text-slate-300" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900">Sin coincidencias</h3>
                                <p className="text-slate-500 mt-4 text-lg">No logramos encontrar nada con esos filtros en esta zona. Prueba ampliando tu búsqueda.</p>
                                <Button
                                    variant="outline"
                                    className="mt-10 h-14 px-8 rounded-2xl border-2 border-slate-100 font-black hover:bg-slate-50"
                                    onClick={() => {
                                        setSearch('');
                                        setLocation('');
                                        setActiveFilter('all');
                                    }}
                                >
                                    Reiniciar Búsqueda
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
