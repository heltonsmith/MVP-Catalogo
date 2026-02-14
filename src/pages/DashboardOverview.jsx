import { Package, Eye, DollarSign, TrendingUp, Plus, AlertTriangle, MessageCircle, ArrowUpRight, ArrowDownRight, CheckCircle2, Sparkles, Store, Loader2, Zap } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn, formatCurrency } from '../utils';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { PRODUCTS as MOCK_PRODUCTS, COMPANIES } from '../data/mock';
import { PlanUpgradeModal } from '../components/dashboard/PlanUpgradeModal';

export default function DashboardOverview() {
    const { company: authCompany, user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const isDemo = searchParams.get('demo') === 'true' || window.location.pathname.includes('/demo');

    // Detect which demo type based on URL path - use useMemo to prevent recreation
    const isDemoStore = location.pathname.includes('/demo/tienda');
    const isDemoRestaurant = location.pathname.includes('/demo/restaurante');

    // Select appropriate demo company - memoized to prevent infinite loops
    const demoCompany = useMemo(() =>
        isDemoRestaurant ? COMPANIES[2] : COMPANIES[0],
        [isDemoRestaurant]
    );

    // Use mock company if in demo mode
    const company = isDemo ? { ...demoCompany, id: 'demo', plan: 'pro' } : authCompany;

    const [stats, setStats] = useState([
        { name: 'Productos', value: '0', icon: <Package size={20} className="text-blue-500" />, trend: 'Actualizado', trendUp: true },
        { name: 'Visitas Totales', value: '0', icon: <Eye size={20} className="text-emerald-500" />, trend: 'Hoy', trendUp: true },
        { name: 'Cotizaciones', value: '0', icon: <DollarSign size={20} className="text-purple-500" />, trend: 'Pendientes', trendUp: false },
    ]);
    const [loading, setLoading] = useState(!isDemo);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        if (isDemo) {
            // Filter products by company for demo
            const companyProducts = MOCK_PRODUCTS.filter(p => p.companyId === demoCompany.id);
            const totalViews = companyProducts.reduce((sum, p) => sum + (p.views || 0), 0);
            const totalQuotes = companyProducts.reduce((sum, p) => sum + (p.quotesCount || 0), 0);

            // For restaurant, don't show quotes stat
            if (isDemoRestaurant) {
                setStats([
                    { name: 'Productos', value: companyProducts.length, icon: <Package size={20} className="text-blue-500" />, trend: '+2 nuevos', trendUp: true },
                    { name: 'Visitas Totales', value: totalViews.toLocaleString(), icon: <Eye size={20} className="text-emerald-500" />, trend: '+12% hoy', trendUp: true },
                    { name: 'Mensajes', value: '8', icon: <MessageCircle size={20} className="text-purple-500" />, trend: '3 sin leer', trendUp: false },
                ]);
            } else {
                setStats([
                    { name: 'Productos', value: companyProducts.length, icon: <Package size={20} className="text-blue-500" />, trend: '+2 nuevos', trendUp: true },
                    { name: 'Visitas Totales', value: totalViews.toLocaleString(), icon: <Eye size={20} className="text-emerald-500" />, trend: '+12% hoy', trendUp: true },
                    { name: 'Cotizaciones', value: totalQuotes, icon: <DollarSign size={20} className="text-purple-500" />, trend: '8 pendientes', trendUp: false },
                ]);
            }
            return;
        }

        const fetchRealStats = async () => {
            if (!company?.id) return;
            setLoading(true);
            try {
                // Fetch product count
                const { count: productCount } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('company_id', company.id);

                setStats([
                    { name: 'Productos', value: productCount || 0, icon: <Package size={20} className="text-blue-500" />, trend: 'En inventario', trendUp: true },
                    { name: 'Visitas Totales', value: (company.views_count || 0).toLocaleString(), icon: <Eye size={20} className="text-emerald-500" />, trend: 'Total histórico', trendUp: true },
                    { name: 'Cotizaciones', value: company.quotes_count || 0, icon: <DollarSign size={20} className="text-purple-500" />, trend: 'Recibidas', trendUp: true },
                ]);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (company) fetchRealStats();
    }, [company?.id, isDemo, isDemoRestaurant, demoCompany.id]);

    if (authLoading || (!isDemo && !company)) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
            <p className="text-slate-500 font-bold animate-pulse">Cargando tu panel...</p>
        </div>
    );

    const displayName = isDemo ? (isDemoRestaurant ? 'Demo Restaurante' : 'Demo Tienda') : (user?.user_metadata?.full_name?.split(' ')[0] || 'Emprendedor');
    const displayCompany = isDemo ? demoCompany : company;

    const handleDemoAction = () => {
        showToast("Esta acción no está disponible en la versión de demostración.", "demo");
    };

    const recentActivity = isDemo ? [
        { id: 1, type: 'quote', user: 'Maria L.', product: isDemoRestaurant ? 'Lomo a lo Pobre' : 'Cepillo de Bambú', time: 'hace 5 min', status: 'Enviado' },
        { id: 2, type: 'message', user: 'Carlos P.', text: isDemoRestaurant ? '¿Tienen delivery?' : '¿Tienen stock de bolsas?', time: 'hace 15 min', status: 'Pendiente' },
        { id: 3, type: 'quote', user: 'Ana M.', product: isDemoRestaurant ? 'Tiramisú Casero' : 'Miel de Abeja', time: 'hace 1 hora', status: 'Enviado' },
    ] : [];

    // Analytics logic - filter by company
    const companyProducts = isDemo ? MOCK_PRODUCTS.filter(p => p.companyId === demoCompany.id) : [];
    const topViewed = isDemo ? [...companyProducts].sort((a, b) => b.views - a.views).slice(0, 3) : [];
    const topQuoted = isDemo ? [...companyProducts].sort((a, b) => b.quotesCount - a.quotesCount).slice(0, 3) : [];
    const lowStock = isDemo ? companyProducts.filter(p => p.stock < 20) : [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Demo Banner */}
            {isDemo && (
                <div className="bg-amber-500 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-200 animate-bounce-subtle">
                    <div className="flex items-center gap-3">
                        <Sparkles size={20} />
                        <span className="font-black uppercase tracking-widest text-sm">Modo Demostración Activo</span>
                    </div>
                    <Link to="/registro">
                        <Button variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-amber-600 font-bold border-2">
                            Crear mi cuenta real
                        </Button>
                    </Link>
                </div>
            )}

            {/* Store Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 opacity-50" />
                <div className="flex items-center gap-5 relative z-10">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden ring-4 ring-primary-50">
                        {displayCompany.logo ? (
                            <img src={displayCompany.logo} alt={displayCompany.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                                <Store className="h-10 w-10 text-slate-300" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900">Bienvenido, {displayName}</h1>
                            <Badge variant="outline" className={displayCompany.plan === 'pro' ? "border-amber-200 text-amber-700 bg-amber-50" : "border-slate-200 text-slate-700 bg-slate-50"}>
                                {displayCompany.plan === 'pro' ? 'Plan Pro' : 'Plan Gratis'}
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm">Gestionando <span className="font-bold text-primary-600">{displayCompany.name}</span></p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {displayCompany.plan === 'free' && (
                        <Button
                            onClick={() => setShowUpgradeModal(true)}
                            variant="secondary"
                            className="flex-1 sm:flex-none font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                        >
                            <Zap size={18} className="mr-2 fill-current" />
                            Sube a PRO
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                    {stat.icon}
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                                    stat.trendUp ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                                )}>
                                    {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {stat.trend}
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.name}</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analytics Columns */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Simplified Chart Area */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-white">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp size={18} className="text-primary-600" />
                                Resumen Semanal
                            </h3>
                        </div>
                        <CardContent className="p-6 bg-slate-50/30 overflow-x-auto">
                            <div className="h-48 flex items-end justify-between gap-2 px-2 min-w-[300px] relative group/chart">
                                {/* SVG Trend Line Overlay */}
                                <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-20 z-0" preserveAspectRatio="none">
                                    <path
                                        d="M0,105 L50,90 L100,110 L150,65 L200,80 L250,55 L300,70 L300,200 L0,200 Z"
                                        fill="url(#gradient)"
                                        className="text-primary-100"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {[45, 60, 40, 85, 70, 95, 80].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-[30px] z-10 relative">
                                        <div
                                            className="w-full bg-gradient-to-t from-primary-400 to-primary-500 rounded-t-md transition-all duration-300 group-hover:from-primary-500 group-hover:to-primary-600 group-hover:-translate-y-1 relative shadow-sm opacity-90 group-hover:opacity-100"
                                            style={{ height: `${h}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-20 shadow-xl scale-90 group-hover:scale-100 pointer-events-none">
                                                {h * 12}
                                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase transition-colors group-hover:text-primary-700">
                                            {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'][i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm h-full">
                            <div className="p-4 border-b border-slate-50 font-bold text-sm text-slate-800 flex items-center gap-2">
                                <Eye size={16} className="text-emerald-500" />
                                Más Vistos
                            </div>
                            <div className="p-4 space-y-4">
                                {topViewed.map(product => (
                                    <div key={product.id} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-100">
                                                <img src={product.images[0]} className="h-full w-full object-cover" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600 group-hover:text-primary-600 transition-colors line-clamp-1">{product.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">{product.views}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="border-none shadow-sm h-full">
                            <div className="p-4 border-b border-slate-50 font-bold text-sm text-slate-800 flex items-center gap-2">
                                <DollarSign size={16} className="text-purple-500" />
                                Más Cotizados
                            </div>
                            <div className="p-4 space-y-4">
                                {topQuoted.map(product => (
                                    <div key={product.id} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-100">
                                                <img src={product.images[0]} className="h-full w-full object-cover" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-600 group-hover:text-primary-600 transition-colors line-clamp-1">{product.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{product.quotesCount}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Stock Alerts */}
                    <Card className="border-none shadow-sm overflow-hidden ring-1 ring-amber-100">
                        <div className="p-4 bg-amber-50 border-b border-amber-100 font-bold text-sm text-amber-800 flex items-center justify-between uppercase tracking-wider">
                            <span className="flex items-center gap-2">
                                <AlertTriangle size={16} />
                                Alertas de Stock
                            </span>
                            <span className="bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">{lowStock.length}</span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                            {lowStock.length > 0 ? lowStock.map(p => (
                                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                                            <img src={p.images[0]} className="h-full w-full object-cover grayscale opacity-70" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono italic">SKU: {p.sku}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold border border-red-100">
                                        {p.stock}
                                    </span>
                                </div>
                            )) : (
                                <div className="p-8 text-center">
                                    <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                                    <p className="text-xs font-medium text-slate-400">Stock OK</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Recent Interaction Log */}
                    <Card className="border-none shadow-sm">
                        <div className="p-4 border-b border-slate-50 bg-white font-bold text-sm text-slate-800 flex items-center gap-2">
                            <MessageCircle size={18} className="text-primary-600" />
                            Actividad Reciente (WhatsApp)
                        </div>
                        <div className="p-0 overflow-hidden divide-y divide-slate-50">
                            {recentActivity.length > 0 ? (
                                recentActivity.map(act => (
                                    <div key={act.id} className="p-4 hover:bg-slate-50/50 transition-all cursor-pointer group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{act.time}</span>
                                            <span className={cn(
                                                "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                                                act.status === 'Enviado' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-primary-50 text-primary-600 border border-primary-100"
                                            )}>
                                                {act.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-bold text-slate-600">{act.user[0]}</span>
                                            </div>
                                            <p className="text-xs text-slate-700">
                                                <span className="font-bold">{act.user}</span> {act.type === 'quote' ? 'cotizó' : 'escribió'}:
                                                <span className="block italic text-slate-500 mt-0.5 truncate group-hover:text-primary-600">
                                                    {act.type === 'quote' ? act.product : act.text}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-400">
                                    <MessageCircle size={32} className="mx-auto opacity-20 mb-3" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Sin actividad todavía</p>
                                </div>
                            )}
                            <div className="p-3 bg-slate-50/50">
                                <Button variant="ghost" className="w-full h-8 text-xs font-bold text-slate-400 hover:text-primary-600">
                                    Ver historial completo
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            <PlanUpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                companyId={displayCompany.id}
            />
        </div>
    );
}
