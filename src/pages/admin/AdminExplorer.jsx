import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MapPin,
    TrendingUp,
    Eye,
    Star,
    Building2,
    Clock,
    ChevronRight,
    SearchX,
    Loader2,
    Store,
    ShoppingBag,
    Utensils,
    LayoutGrid,
    Sparkles,
    ShieldCheck,
    XCircle,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LocationSelector } from '../../components/ui/LocationSelector';
import { supabase } from '../../lib/supabase';
import { cn } from '../../utils';
import { Link } from 'react-router-dom';

const BUSINESS_FILTERS = [
    { id: 'all', label: 'Todo', icon: <LayoutGrid size={16} /> },
    { id: 'retail', label: 'Al Detalle', icon: <ShoppingBag size={16} /> },
    { id: 'wholesale', label: 'Por Mayor', icon: <Building2 size={16} /> },
    { id: 'mixed', label: 'Mayorista y Detalle', icon: <Sparkles size={16} /> },
    { id: 'restaurant', label: 'Restaurantes', icon: <Utensils size={16} /> },
];

const TABS = [
    { id: 'recent', label: 'Recientes', icon: <Clock size={16} /> },
    { id: 'popular', label: 'Más Vistas', icon: <Eye size={16} /> },
    { id: 'quoted', label: 'Más Cotizadas', icon: <TrendingUp size={16} /> },
    { id: 'sponsored', label: 'Patrocinadas', icon: <Star size={16} /> },
    { id: 'upgrades', label: 'Solicitudes Pro', icon: <Sparkles size={16} /> },
];

export default function AdminExplorer() {
    const [companies, setCompanies] = useState([]);
    const [upgradeRequests, setUpgradeRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('recent');
    const [managingUpgrade, setManagingUpgrade] = useState(null);
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const fetchUpgradeRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('upgrade_requests')
                .select('*, companies(*)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUpgradeRequests(data || []);
        } catch (error) {
            console.error('Error fetching upgrade requests:', error);
        }
    };

    const fetchCompanies = async () => {
        if (activeTab === 'upgrades') {
            setLoading(true);
            await fetchUpgradeRequests();
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let query = supabase.from('companies').select('*');

            // Apply filters
            if (search) {
                query = query.ilike('name', `%${search}%`);
            }
            if (location) {
                const city = location.split(',')[0].trim();
                query = query.or(`region.ilike.%${city}%,city.ilike.%${city}%,commune.ilike.%${city}%`);
            }
            if (activeFilter !== 'all') {
                query = query.eq('business_type', activeFilter);
            }

            // Apply Tab Sorting
            if (activeTab === 'recent') {
                query = query.order('created_at', { ascending: false });
            } else if (activeTab === 'popular') {
                query = query.order('views_count', { ascending: false });
            } else if (activeTab === 'quoted') {
                query = query.order('quotes_count', { ascending: false });
            } else if (activeTab === 'sponsored') {
                query = query.eq('is_sponsored', true).order('created_at', { ascending: false });
            }

            const { data, error } = await query.limit(50);
            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveUpgrade = async (request) => {
        setManagingUpgrade(request.id);
        try {
            const { error: requestError } = await supabase
                .from('upgrade_requests')
                .update({ status: 'approved', processed_at: new Date().toISOString() })
                .eq('id', request.id);
            if (requestError) throw requestError;

            const { error: companyError } = await supabase
                .from('companies')
                .update({ plan: request.requested_plan })
                .eq('id', request.company_id);
            if (companyError) throw companyError;

            setUpgradeRequests(prev => prev.filter(r => r.id !== request.id));
            alert(`Plan ${request.requested_plan} activado correctamente para ${request.companies.name}`);
        } catch (error) {
            console.error('Error approving upgrade:', error);
            alert("Error al procesar la aprobación");
        } finally {
            setManagingUpgrade(null);
        }
    };

    const handleRejectUpgrade = async (id) => {
        setManagingUpgrade(id);
        try {
            const { error } = await supabase
                .from('upgrade_requests')
                .update({ status: 'rejected', processed_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            setUpgradeRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error rejecting upgrade:', error);
            alert("Error al rechazar la solicitud");
        } finally {
            setManagingUpgrade(null);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchCompanies, 300);
        return () => clearTimeout(timer);
    }, [activeTab, activeFilter, search, location]);

    return (
        <div className="w-full max-w-full overflow-hidden space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="px-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-2xl shrink-0">
                        <Sparkles className="text-primary-600" size={24} />
                    </div>
                    Explorador
                </h1>
                <p className="mt-2 text-slate-500 text-sm font-medium">Gestión inteligente de tiendas registradas.</p>
            </div>

            {/* Smart Search & Filters Section */}
            <div className="space-y-4 px-1">
                {/* 1. Main Search Bar */}
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-2 sm:p-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                            <Input
                                placeholder="Buscar por nombre..."
                                className="pl-12 h-14 bg-slate-50/50 border-none focus:ring-2 focus:ring-primary-500 font-bold rounded-2xl w-full text-base sm:text-lg"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Advanced Filters Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Location Selection */}
                    <Card className="border-none shadow-lg shadow-slate-200/40 bg-white rounded-3xl overflow-hidden">
                        <CardContent className="p-4 sm:p-5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block px-1">Ubicación</label>
                            <LocationSelector
                                value={location}
                                onChange={setLocation}
                                className="!gap-3 sm:!gap-4"
                                labelClassName="text-[10px] text-slate-500"
                            />
                        </CardContent>
                    </Card>

                    {/* Category Selection */}
                    <Card className="border-none shadow-lg shadow-slate-200/40 bg-white rounded-3xl overflow-hidden">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categoría</label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-fit text-[10px] text-primary-600 font-black hover:bg-primary-50 px-2 rounded-lg gap-1"
                                    onClick={() => {
                                        setSearch('');
                                        setLocation('');
                                        setActiveFilter('all');
                                    }}
                                >
                                    Limpiar todo
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                                {BUSINESS_FILTERS.map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveFilter(activeFilter === filter.id ? 'all' : filter.id)}
                                        className={cn(
                                            "px-3 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center sm:justify-start gap-2 border-2",
                                            activeFilter === filter.id
                                                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20"
                                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 active:scale-95"
                                        )}
                                    >
                                        <span className="shrink-0">{filter.icon}</span>
                                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{filter.label}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* View Tabs */}
            <div className="relative border-b border-slate-200">
                <div className="flex gap-4 sm:gap-8 overflow-x-auto no-scrollbar pb-px -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                    {
                        TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 py-4 text-[11px] sm:text-xs md:text-sm font-black transition-all border-b-2 px-1 whitespace-nowrap shrink-0",
                                    activeTab === tab.id
                                        ? "border-primary-600 text-primary-600"
                                        : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
                                )}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))
                    }
                </div>
            </div>

            {/* Results */}
            {
                loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
                        <p className="text-slate-500 font-bold animate-pulse">Sincronizando datos...</p>
                    </div>
                ) : activeTab === 'upgrades' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upgradeRequests.map((request) => (
                            <Card key={request.id} className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden ring-1 ring-slate-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center p-1 border border-slate-100 shadow-sm">
                                            {request.companies.logo ? (
                                                <img src={request.companies.logo} className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <Store className="text-slate-300" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 leading-tight">{request.companies.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">PLAN ACTUAL: {request.companies.plan}</p>
                                        </div>
                                    </div>

                                    <div className="bg-primary-50 rounded-2xl p-4 mb-6 border border-primary-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Plan Solicitado</span>
                                            <Badge className="bg-primary-500 text-white border-none text-[10px] rounded-full uppercase">
                                                {request.requested_plan}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-primary-800 font-medium">Solicitud recibida el {new Date(request.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-slate-900 hover:bg-slate-800 rounded-xl font-bold h-11"
                                            onClick={() => handleApproveUpgrade(request)}
                                            disabled={managingUpgrade === request.id}
                                        >
                                            {managingUpgrade === request.id ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="mr-2 h-5 w-5 text-emerald-400" />}
                                            Aprobar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl px-3"
                                            onClick={() => handleRejectUpgrade(request.id)}
                                            disabled={managingUpgrade === request.id}
                                        >
                                            <XCircle size={20} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {upgradeRequests.length === 0 && !loading && (
                            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500 opacity-20" />
                                <h3 className="text-slate-900 font-black text-sm">¡Todo al día!</h3>
                                <p className="text-[10px] text-slate-500 mt-1">No hay solicitudes de upgrade pendientes.</p>
                            </div>
                        )}
                    </div>
                ) : companies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {companies.map(company => (
                            <Card key={company.id} className="group border-none shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden bg-white rounded-[2rem]">
                                <CardContent className="p-0">
                                    <div className="h-28 bg-slate-100 relative">
                                        {company.banner && <img src={company.banner} alt="" className="w-full h-full object-cover" />}
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            {company.plan !== 'free' && (
                                                <Badge className="bg-amber-400 text-amber-950 border-none shadow-sm flex gap-1 items-center px-2 py-0.5 text-[9px] font-black rounded-full">
                                                    ★ {company.plan.toUpperCase()}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="bg-white/80 backdrop-blur border-none text-slate-900 font-black text-[9px] rounded-full uppercase">
                                                {company.business_type}
                                            </Badge>
                                            {company.is_online && (
                                                <Badge className="bg-primary-500 text-white border-none shadow-sm flex gap-1 items-center px-2 py-0.5 text-[9px] font-black rounded-full">
                                                    ONLINE
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-6 left-6 h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center p-1.5 overflow-hidden ring-4 ring-white">
                                            {company.logo ? (
                                                <img src={company.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <Store className="text-primary-600 w-8 h-8" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 pt-10">
                                        <h3 className="font-black text-slate-900 text-lg line-clamp-1 group-hover:text-primary-600 transition-colors">
                                            {company.name}
                                        </h3>

                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 p-2.5 rounded-2xl">
                                                <div className="flex items-center gap-1.5 text-blue-500 mb-1">
                                                    <Eye size={12} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Vistas</span>
                                                </div>
                                                <p className="text-xl font-black text-slate-900 leading-none">{company.views_count || 0}</p>
                                            </div>
                                            <div className="bg-slate-50 p-2.5 rounded-2xl">
                                                <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                                                    <TrendingUp size={12} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Cots</span>
                                                </div>
                                                <p className="text-xl font-black text-slate-900 leading-none">{company.quotes_count || 0}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between text-xs text-slate-400 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={14} className="text-slate-300" />
                                                <span className="truncate max-w-[120px]">{company.city || 'Chile'}</span>
                                            </div>
                                            <Link to={`/catalogo/${company.slug}`} target="_blank">
                                                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg hover:bg-primary-50 hover:text-primary-600 font-black flex gap-1">
                                                    Gestionar <ChevronRight size={14} />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="max-w-md mx-auto border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[2.5rem] p-12 text-center">
                        <CardContent className="flex flex-col items-center">
                            <SearchX size={48} className="text-slate-300 mb-6" />
                            <h3 className="text-xl font-black text-slate-900">Búsqueda sin éxito</h3>
                            <p className="text-slate-500 mt-2 text-sm">No encontramos ninguna tienda que coincida con tus criterios.</p>
                            <Button variant="outline" className="mt-8 rounded-xl border-slate-200 font-bold" onClick={() => { setSearch(''); setLocation(''); setActiveFilter('all'); }}>
                                Reiniciar filtros
                            </Button>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
}
