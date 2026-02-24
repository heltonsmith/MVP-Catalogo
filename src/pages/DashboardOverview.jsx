import { Zap, Check, Loader2, AlertTriangle, AlertCircle, User, Mail, Building2, CreditCard, Sparkles, Store, Package, Eye, DollarSign, TrendingUp, Plus, MessageCircle, ArrowUpRight, ArrowDownRight, CheckCircle2, Link2, Copy, ExternalLink, Clock, Calendar, ChevronDown, FileText, Camera } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn, formatCurrency } from '../utils';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { PRODUCTS as MOCK_PRODUCTS, COMPANIES } from '../data/mock';
import { PlanUpgradeModal } from '../components/dashboard/PlanUpgradeModal';
import { useUpgradeRequest } from '../hooks/useUpgradeRequest';
import { useSettings } from '../hooks/useSettings';

const PERIOD_OPTIONS = [
    { key: 'today', label: 'Hoy' },
    { key: 'yesterday', label: 'Ayer' },
    { key: 'all', label: 'Desde siempre' },
];

function getDateRange(periodKey) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (periodKey) {
        case 'today':
            return { from: todayStart.toISOString(), to: null };
        case 'yesterday':
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            return { from: yesterdayStart.toISOString(), to: todayStart.toISOString() };
        case 'all':
        default:
            return { from: null, to: null };
    }
}

function PeriodSelector({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const selected = PERIOD_OPTIONS.find(o => o.key === value) || PERIOD_OPTIONS[PERIOD_OPTIONS.length - 1];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(!open);
                }}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer relative z-20"
            >
                <ArrowUpRight size={12} />
                {selected.label}
                <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] py-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200 ring-4 ring-black/5">
                    {PERIOD_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange(opt.key);
                                setOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between",
                                value === opt.key ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {opt.label}
                            {value === opt.key && <CheckCircle2 size={12} className="text-emerald-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DashboardOverview() {
    const { company: authCompany, user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
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

    // Period state for views and quotes
    const [viewsPeriod, setViewsPeriod] = useState('all');
    const [quotesPeriod, setQuotesPeriod] = useState('all');

    const [productCount, setProductCount] = useState(0);
    const [viewsCount, setViewsCount] = useState(0);
    const [quotesCount, setQuotesCount] = useState(0);
    const [latestQuote, setLatestQuote] = useState(null);

    const [loading, setLoading] = useState(!isDemo);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { pendingRequest, loading: loadingUpgrade } = useUpgradeRequest();
    const { getSetting } = useSettings();

    const [topProducts, setTopProducts] = useState({ viewed: [], quoted: [] });

    const isExpired = (date) => {
        if (!date) return false;
        const renewal = new Date(date);
        const now = new Date();
        const renewalDay = new Date(renewal.getFullYear(), renewal.getMonth(), renewal.getDate());
        const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return nowDay >= renewalDay;
    };

    const isExpiringSoon = (date) => {
        if (!date) return false;
        const now = new Date();
        const renewal = new Date(date);
        const renewalDay = new Date(renewal.getFullYear(), renewal.getMonth(), renewal.getDate());
        const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.ceil((renewalDay - nowDay) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 3;
    };

    const isQuotesEnabled = getSetting(`${company?.plan}_plan_quotes_enabled`, company?.plan !== 'free' ? 'true' : 'false') === 'true';

    // Fetch product count once
    useEffect(() => {
        if (isDemo) {
            const companyProducts = MOCK_PRODUCTS.filter(p => p.companyId === demoCompany.id);
            setProductCount(companyProducts.length);
            return;
        }

        const fetchProducts = async () => {
            if (!company?.id) return;
            const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company.id);
            setProductCount(count || 0);
        };
        if (company) fetchProducts();
    }, [company?.id, isDemo, demoCompany.id]);

    // Period-based Counts
    useEffect(() => {
        if (isDemo) {
            // Mock dynamic numbers for demo based on period
            const baseViews = 1240;
            const baseQuotes = 28;
            const multipliers = {
                'today': 0.05,
                'yesterday': 0.08,
                'all': 1.2
            };
            const mult = multipliers[viewsPeriod] || 1;
            setViewsCount(Math.round(baseViews * mult));
            setQuotesCount(Math.round(baseQuotes * mult));
            return;
        }

        const fetchViews = async () => {
            if (!company?.id) return;

            // For "All time" and "6 months", we favor the cumulative column
            // because store_visits might not have historical data.
            // But for 7d/30d/Today, logs are more accurate.
            if (viewsPeriod === 'all' || viewsPeriod === '6m') {
                const { data } = await supabase
                    .from('companies')
                    .select('views_count')
                    .eq('id', company.id)
                    .single();
                setViewsCount(data?.views_count || 0);
            } else {
                const { from, to } = getDateRange(viewsPeriod);
                let query = supabase
                    .from('store_visits')
                    .select('*', { count: 'exact', head: true })
                    .eq('company_id', company.id);

                if (from) {
                    query = query.gte('created_at', from);
                }
                if (to) {
                    query = query.lt('created_at', to);
                }

                const { count } = await query;
                setViewsCount(count || 0);
            }
        };

        const fetchQuotes = async () => {
            if (!company?.id) return;

            if (quotesPeriod === 'all' || quotesPeriod === '6m') {
                const { data } = await supabase
                    .from('companies')
                    .select('quotes_count')
                    .eq('id', company.id)
                    .single();
                setQuotesCount(data?.quotes_count || 0);
            } else {
                let query = supabase
                    .from('whatsapp_quotes')
                    .select('*', { count: 'exact', head: true })
                    .eq('company_id', company.id);

                const { from, to } = getDateRange(quotesPeriod);
                if (from) {
                    query = query.gte('created_at', from);
                }
                if (to) {
                    query = query.lt('created_at', to);
                }

                const { count } = await query;
                setQuotesCount(count || 0);
            }
        };

        fetchViews();
        fetchQuotes();
    }, [company?.id, isDemo, viewsPeriod, quotesPeriod]);

    // Top Products
    useEffect(() => {
        if (isDemo) {
            const companyProducts = MOCK_PRODUCTS.filter(p => p.companyId === demoCompany.id);
            setTopProducts({
                viewed: [...companyProducts].sort((a, b) => b.views - a.views).slice(0, 3),
                quoted: [...companyProducts].sort((a, b) => b.quotesCount - a.quotesCount).slice(0, 3)
            });
            return;
        }

        const fetchTopProducts = async () => {
            if (!company?.id) return;

            // Fetch top viewed
            const { data: viewed } = await supabase
                .from('products')
                .select('*, product_images(image_url)')
                .eq('company_id', company.id)
                .order('views', { ascending: false })
                .limit(3);

            // Fetch top quoted
            const { data: quoted } = await supabase
                .from('products')
                .select('*, product_images(image_url)')
                .eq('company_id', company.id)
                .order('quotes_count', { ascending: false })
                .limit(3);

            const transform = (items) => (items || []).map(p => ({
                ...p,
                images: p.product_images?.map(img => img.image_url) || []
            }));

            setTopProducts({
                viewed: transform(viewed),
                quoted: transform(quoted)
            });
        };

        fetchTopProducts();
    }, [company?.id, isDemo, demoCompany.id]);

    // Fetch latest WhatsApp quote for real stores
    useEffect(() => {
        if (isDemo) {
            setLatestQuote(null);
            return;
        }

        const fetchLatestQuote = async () => {
            if (!company?.id) return;

            const { data, error } = await supabase
                .from('whatsapp_quotes')
                .select('id, customer_name, customer_email, total, items, created_at')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!error && data) {
                setLatestQuote(data);
            }
        };
        if (company) fetchLatestQuote();
    }, [company?.id, isDemo]);

    // Loading complete
    useEffect(() => {
        if (!isDemo && company?.id) {
            setLoading(false);
        }
    }, [company?.id, isDemo]);

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
    const topViewed = topProducts.viewed;
    const topQuoted = topProducts.quoted;

    // Format relative time
    const formatRelativeTime = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'hace un momento';
        if (diffMins < 60) return `hace ${diffMins} min`;
        if (diffHours < 24) return `hace ${diffHours}h`;
        if (diffDays < 7) return `hace ${diffDays}d`;
        return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    };

    const viewsPeriodLabel = PERIOD_OPTIONS.find(o => o.key === viewsPeriod)?.label || 'Desde siempre';
    const quotesPeriodLabel = PERIOD_OPTIONS.find(o => o.key === quotesPeriod)?.label || 'Desde siempre';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Renewal Alerts */}
            {!isDemo && displayCompany.plan !== 'free' && displayCompany.renewal_date && (
                <>
                    {/* Expired / Grace Period */}
                    {isExpired(displayCompany.renewal_date) && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-4 text-red-800 animate-pulse">
                            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <AlertTriangle className="text-red-600" size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase tracking-wider">Suscripción Vencida</h4>
                                <p className="text-xs font-medium opacity-90">Tu suscripción venció el {new Date(displayCompany.renewal_date).toLocaleDateString()}. Tienes hasta {(() => {
                                    const d = new Date(displayCompany.renewal_date);
                                    d.setDate(d.getDate() + 3);
                                    return d.toLocaleDateString();
                                })()} (3 días de gracia) para renovar antes de bajar al plan Gratis.</p>
                            </div>
                            <Button size="sm" variant="error" className="font-black text-[10px]" onClick={() => setShowUpgradeModal(true)}>RENOVAR AHORA</Button>
                        </div>
                    )}

                </>
            )}

            {/* Downgraded Notification (if plan is free and was previously higher - simplified check for now) */}
            {!isDemo && displayCompany.plan === 'free' && (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 text-slate-700">
                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                        <Zap className="text-slate-400" size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-black uppercase tracking-wider">Plan Gratis Activo</h4>
                        <p className="text-xs font-medium opacity-75">Tu cuenta es gratuita de por vida. Si tenías más productos activos, han sido ocultados para cumplir con el límite del plan.</p>
                    </div>
                </div>
            )}

            {/* Store Header */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 opacity-40 transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-full -ml-16 -mb-16 opacity-30" />

                <CardContent className="p-8 sm:p-10 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        {/* Profile & Identity */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-3xl overflow-hidden ring-8 ring-primary-50 shadow-2xl shadow-primary-200/50">
                                    {displayCompany.logo ? (
                                        <img src={displayCompany.logo} alt={displayCompany.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                                            <Store className="h-12 w-12 text-slate-300" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center">
                                    <div className="h-6 w-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                                        <Check className="text-white h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-center sm:text-left space-y-2">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenido, {displayName}</h1>
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-[10px] font-black uppercase tracking-[0.1em] shadow-sm",
                                        displayCompany.plan === 'pro' && "bg-amber-50 border-amber-200 text-amber-600 shadow-amber-100",
                                        displayCompany.plan === 'plus' && "bg-blue-50 border-blue-200 text-blue-600 shadow-blue-100",
                                        displayCompany.plan === 'free' && "bg-slate-50 border-slate-200 text-slate-500"
                                    )}>
                                        <Zap size={14} className={cn("fill-current", displayCompany.plan === 'free' && "text-slate-400")} />
                                        Plan {displayCompany.plan === 'pro' ? 'Pro' : displayCompany.plan === 'plus' ? 'Plus' : 'Gratis'}
                                    </div>
                                </div>

                                <p className="text-slate-500 font-medium text-lg">
                                    Gestionando <span className="text-primary-600 font-black">{displayCompany.name}</span>
                                </p>

                                {/* Plan Details Row */}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                                        <Package size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-600">
                                            Límite: <span className="text-slate-900">
                                                {displayCompany.plan === 'custom' ? 'Ilimitado' :
                                                    getSetting(`${displayCompany.plan}_plan_product_limit`,
                                                        displayCompany.plan === 'free' ? '5' :
                                                            displayCompany.plan === 'plus' ? '100' : '500'
                                                    )} productos
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                                        <Camera size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-600">
                                            Fotos: <span className="text-slate-900">
                                                {displayCompany.plan === 'custom' ? 'Ilimitadas' :
                                                    getSetting(`${displayCompany.plan}_plan_image_limit`,
                                                        displayCompany.plan === 'free' ? '1' : '5'
                                                    )} por producto
                                            </span>
                                        </span>
                                    </div>
                                    {displayCompany.plan !== 'free' && displayCompany.renewal_date && (
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl",
                                            isExpired(displayCompany.renewal_date) ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                        )}>
                                            <Calendar size={14} className="opacity-70" />
                                            <span className="text-xs font-bold">
                                                Renovación: <span className="font-black">
                                                    {new Date(displayCompany.renewal_date).toLocaleDateString()}
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Upgrade CTA */}
                        <div className="flex flex-col items-center lg:items-end gap-3 min-w-[200px]">
                            {pendingRequest ? (
                                <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 text-amber-700 border-2 border-amber-200 rounded-2xl text-xs font-black uppercase tracking-widest animate-pulse">
                                    <Clock size={16} />
                                    Solicitud en Revisión
                                </div>
                            ) : (
                                <>
                                    {displayCompany.plan !== 'pro' && (
                                        <Button
                                            onClick={() => isDemo ? handleDemoAction() : setShowUpgradeModal(true)}
                                            className="w-full sm:w-auto h-14 px-8 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black shadow-xl shadow-primary-200 transition-all hover:-translate-y-1 active:scale-95 gap-3"
                                        >
                                            <Sparkles size={20} className="fill-current" />
                                            MEJORAR MI PLAN
                                        </Button>
                                    )}
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center w-full">
                                        {displayCompany.plan === 'pro' ? 'Tienes el plan máximo' : 'Desbloquea todo el potencial'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 relative z-30">
                {/* Products Card */}
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow !overflow-visible relative z-[5]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                <Package size={20} className="text-blue-500" />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider text-emerald-600 bg-emerald-50">
                                <ArrowUpRight size={12} />
                                En inventario
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Productos</h3>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{productCount}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Views Card */}
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow !overflow-visible relative z-[4]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                <Eye size={20} className="text-emerald-500" />
                            </div>
                            <PeriodSelector value={viewsPeriod} onChange={setViewsPeriod} />
                        </div>
                        <div className="mt-4">
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Visitas</h3>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{viewsCount.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Quotes Card */}
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow !overflow-visible relative z-[3]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                <DollarSign size={20} className="text-purple-500" />
                            </div>
                            <PeriodSelector value={quotesPeriod} onChange={setQuotesPeriod} />
                        </div>
                        <div className={cn("mt-4", !isQuotesEnabled && "blur-[3px] select-none pointer-events-none opacity-50")}>
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cotizaciones</h3>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{quotesCount}</p>
                        </div>

                        {!isQuotesEnabled && (
                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <div className="mb-3 p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                                    <h5 className="text-[10px] font-black text-purple-900 uppercase tracking-wider mb-1.5">Gestión de Cotizaciones</h5>
                                    <p className="text-[9px] text-purple-700 leading-relaxed">
                                        Visualiza las cotizaciones por Whatsapp de clientes con filtros avanzados, marca como respondidas o completadas, y visualiza detalles por fecha y cliente.
                                    </p>
                                </div>
                                {pendingRequest && (
                                    <div className="flex items-center justify-center gap-1.5 mb-2 py-1 px-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                        <Clock size={10} />
                                        Solicitud en revisión por admin
                                    </div>
                                )}
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (isDemo) {
                                            handleDemoAction("Mejorar Plan");
                                        } else {
                                            setShowUpgradeModal(true);
                                        }
                                    }}
                                    variant="outline"
                                    size="default"
                                    className={cn(
                                        "w-full text-[10px] font-black h-9 gap-2 transition-all",
                                        pendingRequest ? "border-amber-200 bg-amber-50 text-amber-700 shadow-none" : "border-primary-200 text-primary-600 hover:bg-primary-50"
                                    )}
                                >
                                    {pendingRequest ? <Clock size={14} /> : <Zap size={14} className="fill-current" />}
                                    {pendingRequest ? 'Ver Estado' : 'Mejorar Plan'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Catalog Link Card — fixed overflow */}
            <Card className="border-none shadow-sm bg-gradient-to-br from-primary-50 to-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary-100 rounded-full -mr-20 -mt-20 opacity-30" />
                <CardContent className="p-6 relative z-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
                                    <Store className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Tu Catálogo en Línea</h3>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">Comparte este enlace con tus clientes para que vean tus productos</p>
                            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-slate-200 shadow-sm">
                                <Link2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <code className="text-xs text-slate-600 font-mono flex-1 truncate">
                                    {window.location.origin}{isDemo ? `/demo/catalogo/${displayCompany.slug}` : `/catalogo/${displayCompany.slug}`}
                                </code>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={() => {
                                    const catalogUrl = `${window.location.origin}${isDemo ? `/demo/catalogo/${displayCompany.slug}` : `/catalogo/${displayCompany.slug}`}`;
                                    navigator.clipboard.writeText(catalogUrl);
                                    showToast("¡Enlace copiado al portapapeles!", "success");
                                }}
                                variant="secondary"
                                className="w-full sm:w-auto font-bold h-12 gap-3 shadow-sm border-slate-200"
                            >
                                <Copy className="h-4 w-4" />
                                Copiar Enlace
                            </Button>
                            <Button
                                onClick={() => {
                                    const url = isDemo ? `/demo/catalogo/${displayCompany.slug}` : `/catalogo/${displayCompany.slug}`;
                                    window.open(url, '_blank');
                                }}
                                className="w-full sm:w-auto font-bold h-12 gap-3 shadow-lg shadow-primary-100"
                            >
                                <ExternalLink className="h-4 w-4" />
                                {isDemo ? 'Ver Demo' : 'Ver Catálogo'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analytics Columns */}
                <div className="lg:col-span-2 space-y-8">

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
                                            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-100 bg-slate-50 flex items-center justify-center">
                                                {product.images && product.images.length > 0 ? (
                                                    <img src={product.images[0]} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package size={16} className="text-slate-300" />
                                                )}
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
                            <div className="p-4 space-y-4 relative">
                                <div className={cn("space-y-4 transition-all duration-500", !isQuotesEnabled && "blur-[4px] grayscale opacity-40 select-none pointer-events-none")}>
                                    {topQuoted.length > 0 ? topQuoted.map(product => (
                                        <div key={product.id} className="flex items-center justify-between group cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-100 bg-slate-50 flex items-center justify-center">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img src={product.images[0]} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package size={16} className="text-slate-300" />
                                                    )}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-600 group-hover:text-primary-600 transition-colors line-clamp-1">{product.name}</span>
                                            </div>
                                            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{product.quotesCount}</span>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center text-slate-400 text-xs italic font-medium">
                                            Aún no hay cotizaciones registradas
                                        </div>
                                    )}
                                </div>

                                {!isQuotesEnabled && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-[1px] z-10">
                                        <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                                            <DollarSign className="text-purple-500 fill-purple-500/20" size={20} />
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-xs mb-1">Análisis de Productos</h4>
                                        <p className="text-[10px] text-slate-500 mb-4 px-2 text-center leading-relaxed">Descubre qué productos cotizan más tus clientes y optimiza tu inventario.</p>
                                        <Button
                                            onClick={() => isDemo ? handleDemoAction("Ver Analíticas") : setShowUpgradeModal(true)}
                                            variant="secondary"
                                            size="sm"
                                            className="font-bold bg-white/90 border-purple-100 text-purple-600 hover:bg-white shadow-sm text-[10px]"
                                        >
                                            <Zap size={14} className="mr-2 fill-current" />
                                            Ver Analíticas
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Recent Interaction Log — with latest quote for real stores */}
                    <Card className="border-none shadow-sm">
                        <div className="p-4 border-b border-slate-50 bg-white font-bold text-sm text-slate-800 flex items-center gap-2">
                            <MessageCircle size={18} className="text-primary-600" />
                            Actividad Reciente (WhatsApp)
                        </div>
                        <div className="p-0 overflow-hidden divide-y divide-slate-50 relative min-h-[200px]">
                            <div className={cn("transition-all duration-500", !isQuotesEnabled && "blur-[5px] grayscale opacity-30 select-none pointer-events-none")}>
                                {isDemo && recentActivity.length > 0 ? (
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
                                ) : !isDemo && latestQuote ? (
                                    <div className="p-4 hover:bg-slate-50/50 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatRelativeTime(latestQuote.created_at)}</span>
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                Cotización
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <FileText size={14} className="text-emerald-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800">{latestQuote.customer_name || 'Cliente'}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Cotizó {latestQuote.items?.length || 0} producto{latestQuote.items?.length !== 1 ? 's' : ''} por <span className="font-bold text-emerald-600">{formatCurrency(latestQuote.total || 0)}</span>
                                                </p>
                                                {latestQuote.items?.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {latestQuote.items.slice(0, 3).map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-[10px]">
                                                                <span className="text-slate-500 truncate max-w-[60%]">{item.name} ×{item.quantity}</span>
                                                                <span className="font-semibold text-slate-600">{formatCurrency(item.price * item.quantity)}</span>
                                                            </div>
                                                        ))}
                                                        {latestQuote.items.length > 3 && (
                                                            <p className="text-[10px] text-slate-400 italic">+{latestQuote.items.length - 3} más...</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-slate-400">
                                        <MessageCircle size={32} className="mx-auto opacity-20 mb-3" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Sin actividad todavía</p>
                                    </div>
                                )}
                            </div>

                            {!isQuotesEnabled && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-white/10 backdrop-blur-[1px]">
                                    <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                                        <MessageCircle className="text-emerald-500 fill-emerald-500/20" size={20} />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-xs mb-1">Actividad en Tiempo Real</h4>
                                    <p className="text-[10px] text-slate-500 mb-4 px-4 leading-relaxed">Visualiza todas las cotizaciones y mensajes de tus clientes vía WhatsApp, ordenados por fecha con filtros avanzados.</p>
                                    <Button
                                        onClick={() => isDemo ? handleDemoAction("Mejorar Plan") : setShowUpgradeModal(true)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-8 text-[10px] shadow-lg shadow-emerald-200 px-6 rounded-lg"
                                    >
                                        Mejorar Plan
                                    </Button>
                                </div>
                            )}

                            <div className="p-3 bg-slate-50/50">
                                <Button
                                    onClick={() => {
                                        if (isDemo) {
                                            navigate('/demo/tienda/dashboard/cotizaciones');
                                        } else if (!isQuotesEnabled) {
                                            setShowUpgradeModal(true);
                                        } else {
                                            navigate('/dashboard/cotizaciones');
                                        }
                                    }}
                                    variant="ghost"
                                    className="w-full h-8 text-xs font-bold text-slate-400 hover:text-primary-600"
                                >
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
