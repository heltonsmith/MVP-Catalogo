import { useState, useEffect, useRef } from 'react';
import {
    Heart,
    ShoppingBag,
    Star,
    MessageCircle,
    TrendingUp,
    Clock,
    ChevronRight,
    Store,
    Trash2,
    Search,
    BadgeCheck,
    ArrowRight,
    User,
    Camera,
    Tag,
    Save,
    X,
    FolderPlus,
    Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils';

export default function CustomerDashboard() {
    const { user, profile, refreshProfile } = useAuth();
    const targetUserId = profile?.id || user?.id;
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        favoritesCount: 0,
        quotesCount: 0,
        reviewsCount: 0
    });
    const [recentQuotes, setRecentQuotes] = useState([]);
    const [favorites, setFavorites] = useState([]);

    // For avatar upload
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (targetUserId) {
            loadDashboardData();
        }
    }, [targetUserId]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [favs, qts, revs] = await Promise.all([
                supabase.from('favorites').select('*, company:companies(*)').eq('user_id', targetUserId).limit(4),
                supabase.from('whatsapp_quotes').select('*, company:companies(*)').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(1),
                supabase.from('reviews').select('count', { count: 'exact' }).eq('user_id', targetUserId)
            ]);

            // For totals, we need separate count queries if we want absolute totals
            const { count: totalFavs } = await supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', targetUserId);
            const { count: totalQuotes } = await supabase.from('whatsapp_quotes').select('id', { count: 'exact' }).eq('user_id', targetUserId);

            setFavorites(favs.data || []);
            setRecentQuotes(qts.data || []);
            setStats({
                favoritesCount: totalFavs || 0,
                quotesCount: totalQuotes || 0,
                reviewsCount: revs.count || 0
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${targetUserId}/avatar.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: targetUserId,
                    avatar_url: publicUrl,
                    email: user.email,
                    full_name: profile?.full_name || user?.user_metadata?.full_name || ''
                });

            if (updateError) throw updateError;

            await refreshProfile();
            showToast("Foto de perfil actualizada", "success");
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToast("Error al subir imagen", "error");
        } finally {
            setUploading(false);
        }
    };

    if (loading && !favorites.length) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-white rounded-[2.5rem]" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 bg-white rounded-[2rem]" />
                    <div className="h-32 bg-white rounded-[2rem]" />
                    <div className="h-32 bg-white rounded-[2rem]" />
                </div>
                <div className="h-96 bg-white rounded-[2.5rem]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Welcome */}
            <div className="bg-white p-8 sm:p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group shrink-0">
                    <div className="h-28 w-28 rounded-[2.5rem] bg-primary-50 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-2xl relative transition-transform group-hover:scale-105 duration-500">
                        {profile?.avatar_url ? (
                            <img
                                src={`${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now()}`}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User className="h-14 w-14 text-primary-200" />
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary-600" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 h-10 w-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 transition-all hover:scale-110 z-10 border-4 border-white"
                    >
                        <Camera size={16} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        className="hidden"
                        accept="image/*"
                    />
                </div>

                <div className="relative z-10 text-center sm:text-left flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest mb-3">
                        <BadgeCheck size={12} /> Cliente Verificado
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                        ¡Hola, <span className="text-primary-600">{(profile?.full_name || user?.user_metadata?.full_name || 'Cliente')?.split(' ')[0]}</span>! 👋
                    </h1>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-md">Bienvenido a tu centro de control. Aquí puedes ver tus tiendas guardadas y el estado de tus pedidos.</p>
                </div>
                <TrendingUp className="absolute -bottom-10 -right-10 h-64 w-64 text-primary-600 opacity-[0.03] rotate-12 pointer-events-none" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Link to="/dashboard/cliente/favoritos">
                    <StatCard
                        label="Tiendas Favoritas"
                        value={stats.favoritesCount}
                        icon={<Heart className="text-rose-500" fill="currentColor" />}
                        color="bg-rose-50"
                    />
                </Link>
                <Link to="/dashboard/cliente/cotizaciones">
                    <StatCard
                        label="Cotizaciones"
                        value={stats.quotesCount}
                        icon={<ShoppingBag className="text-blue-500" />}
                        color="bg-blue-50"
                    />
                </Link>
                <Link to="/dashboard/cliente/resenas">
                    <StatCard
                        label="Reseñas Escritas"
                        value={stats.reviewsCount}
                        icon={<Star className="text-amber-500" fill="currentColor" />}
                        color="bg-amber-50"
                    />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Favorites Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <Heart size={24} className="text-rose-500" /> Tiendas Recientes
                        </h2>
                        <Link to="/dashboard/cliente/favoritos" className="text-xs font-black text-primary-600 hover:underline uppercase tracking-widest">Ver Todas</Link>
                    </div>

                    {favorites.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {favorites.map((fav) => (
                                <Card key={fav.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white rounded-3xl overflow-hidden shadow-sm relative">
                                    <CardContent className="p-5">
                                        <div className="flex gap-4">
                                            <Link to={`/catalogo/${fav.company?.slug}`} className="shrink-0">
                                                <div className="h-16 w-16 rounded-2xl bg-slate-50 overflow-hidden ring-2 ring-slate-50 shrink-0 shadow-inner">
                                                    {fav.company?.logo ? (
                                                        <img src={fav.company.logo} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center font-black text-slate-300 text-xl">
                                                            {fav.company?.name?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/catalogo/${fav.company?.slug}`}>
                                                    <h4 className="font-bold text-slate-900 truncate uppercase tracking-tight mb-1">{fav.company?.name}</h4>
                                                </Link>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                        {fav.company?.business_type === 'retail' ? 'Minorista' :
                                                            fav.company?.business_type === 'wholesale' ? 'Mayorista' :
                                                                fav.company?.business_type === 'mixed' ? 'Mayorista y Detalle' :
                                                                    'Restaurante'}
                                                    </span>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-200 group-hover:text-primary-400 group-hover:translate-x-1 transition-all self-center" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 text-center">
                            <h3 className="font-black text-slate-900 text-lg mb-2">Comienza tu colección</h3>
                            <p className="text-slate-500 text-sm mb-6">Guarda las tiendas que te interesan para seguirlas de cerca.</p>
                            <Link to="/explorar">
                                <Button className="rounded-2xl px-8 h-12 font-black shadow-lg shadow-primary-100">IR AL MERCADO</Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Quick Orders Overview */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <ShoppingBag size={24} className="text-blue-500" /> WhatsApp Enviados
                        </h2>
                        <Link to="/dashboard/cliente/cotizaciones" className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-widest">Ver Historial</Link>
                    </div>

                    <div className="space-y-3">
                        {recentQuotes.length > 0 ? (
                            recentQuotes.map((quote) => (
                                <Card key={quote.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden hover:bg-slate-50 transition-colors group">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{quote.company?.name || 'Tienda'}</h4>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(quote.created_at).toLocaleDateString()}</span>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-tight mt-1 truncate">
                                                    {quote.items && Array.isArray(quote.items)
                                                        ? `${quote.items.length} ${quote.items.length === 1 ? 'Producto' : 'Productos'}`
                                                        : 'Ver detalle'}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                                quote.status === 'pending' ? "bg-emerald-100 text-emerald-700" :
                                                    quote.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                                                        "bg-slate-100 text-slate-600"
                                            )}>
                                                {quote.status === 'pending' ? 'Enviada' : 'Listo'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50 group-hover:border-slate-100">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOTAL</span>
                                            <span className="text-xs font-black text-primary-600">${quote.total?.toLocaleString() || '0'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                                <ShoppingBag className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin cotizaciones enviadas</p>
                            </div>
                        )}

                        <div className="pt-4">
                            <Link to="/dashboard/cliente/mensajes">
                                <div className="bg-primary-600 p-6 rounded-[2rem] text-white shadow-xl shadow-primary-200 relative overflow-hidden group hover:scale-[1.02] transition-all">
                                    <div className="relative z-10">
                                        <h4 className="font-black text-lg mb-1">¿Dudas?</h4>
                                        <p className="text-xs text-primary-100 font-medium leading-relaxed">Habla directamente con los vendedores sobre tus productos o pedidos.</p>
                                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                            Ir a Mensajes <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                    <MessageCircle size={80} className="absolute -bottom-4 -right-4 text-white/10 rotate-12" />
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }) {
    return (
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                        <h3 className="text-2xl font-black text-slate-900 transition-transform group-hover:translate-x-1">{value}</h3>
                    </div>
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 shadow-sm", color)}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
