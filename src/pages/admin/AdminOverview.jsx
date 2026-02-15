import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Store, TrendingUp, AlertCircle, CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { COMPANIES, CONVERSATIONS } from '../../data/mock';

export default function AdminOverview() {
    const { showToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeStores: 0,
        pendingUpgrades: 0
    });
    const [recentStores, setRecentStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stats
            const [usersCount, storesCount, upgradesCount] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'active').not('name', 'in', '("Demo Tienda","Demo Restaurante")'),
                supabase.from('upgrade_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            ]);

            setStats({
                totalUsers: usersCount.count || 0,
                activeStores: storesCount.count || 0,
                pendingUpgrades: upgradesCount.count || 0
            });

            // 2. Fetch Recent Stores (Real ones)
            const { data: stores } = await supabase
                .from('companies')
                .select('*')
                .not('name', 'in', '("Demo Tienda","Demo Restaurante")')
                .order('created_at', { ascending: false })
                .limit(3);

            setRecentStores(stores || []);

            // 3. Fetch Pending Requests
            const { data: reqs } = await supabase
                .from('upgrade_requests')
                .select(`
                    *,
                    companies (
                        name,
                        logo
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            setRequests(reqs || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            showToast("Error al cargar datos del panel", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApproveRequest = async (request) => {
        setProcessingId(request.id);
        try {
            // 1. Update request status
            const { error: reqError } = await supabase
                .from('upgrade_requests')
                .update({ status: 'approved' })
                .eq('id', request.id);

            if (reqError) throw reqError;

            // 2. Update company plan
            const { error: compError } = await supabase
                .from('companies')
                .update({
                    plan: request.requested_plan,
                    subscription_date: new Date().toISOString()
                })
                .eq('id', request.company_id);

            if (compError) throw compError;

            showToast(`¡Plan ${request.requested_plan.toUpperCase()} activado para ${request.companies.name}!`, "success");
            setRequests(requests.filter(r => r.id !== request.id));
            setStats(prev => ({ ...prev, pendingUpgrades: prev.pendingUpgrades - 1 }));
        } catch (error) {
            console.error('Error approving request:', error);
            showToast("Error al procesar la aprobación", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectRequest = async (id) => {
        if (!window.confirm("¿Estás seguro de rechazar esta solicitud?")) return;
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('upgrade_requests')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (error) throw error;

            showToast("Solicitud rechazada", "info");
            setRequests(requests.filter(r => r.id !== id));
            setStats(prev => ({ ...prev, pendingUpgrades: prev.pendingUpgrades - 1 }));
        } catch (error) {
            console.error('Error rejecting request:', error);
            showToast("Error al procesar el rechazo", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const dashboardStats = [
        { name: 'Usuarios Totales', value: stats.totalUsers, icon: Users, change: 'Registrados', color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: 'Tiendas Activas', value: stats.activeStores, icon: Store, change: 'Reales', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { name: 'Solicitudes Upgrade', value: stats.pendingUpgrades, icon: Sparkles, change: 'Pendientes', color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Resumen General</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {dashboardStats.map((stat) => (
                    <Card key={stat.name} className="border-none shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.bg} p-3 rounded-xl`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">{stat.name}</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {loading ? <Loader2 className="h-6 w-6 animate-spin text-slate-200" /> : stat.value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card className="border-none shadow-sm h-full">
                    <CardHeader className="p-6 pb-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Solicitudes de Upgrade</h3>
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                {requests.length} Pendientes
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-primary-600" size={32} />
                            </div>
                        ) : requests.length > 0 ? (
                            <div className="space-y-4">
                                {requests.map(request => (
                                    <div key={request.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white transition-all group shadow-sm hover:shadow-md">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 overflow-hidden shadow-sm">
                                                    {request.companies?.logo ? (
                                                        <img src={request.companies.logo} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-slate-200">
                                                            <Store size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight">{request.companies?.name}</p>
                                                    <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mt-0.5">Plan solicitado: {request.requested_plan}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-medium">Solicitado el</p>
                                                <p className="text-[11px] font-bold text-slate-600">{new Date(request.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleApproveRequest(request)}
                                                disabled={processingId === request.id}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs h-9 rounded-xl shadow-lg shadow-emerald-100"
                                            >
                                                {processingId === request.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <CheckCircle2 size={14} className="mr-1" />}
                                                Aprobar {request.requested_plan.toUpperCase()}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRejectRequest(request.id)}
                                                disabled={processingId === request.id}
                                                className="flex-1 border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold text-xs h-9 rounded-xl transition-all"
                                            >
                                                Rechazar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                                <Sparkles className="mx-auto text-slate-200 mb-3" size={40} />
                                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Al día</p>
                                <p className="text-xs text-slate-500 mt-1">No hay solicitudes pendientes.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Tiendas Recientes</h3>
                            <div className="space-y-4">
                                {recentStores.length > 0 ? recentStores.map(company => (
                                    <div key={company.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100 shadow-sm">
                                                {company.logo ? (
                                                    <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Store size={20} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{company.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold">Desde {new Date(company.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Badge variant="success" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                            {company.plan.toUpperCase()}
                                        </Badge>
                                    </div>
                                )) : (
                                    <p className="text-center py-4 text-slate-400 text-sm">No hay tiendas registradas.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-primary-600 to-primary-800 text-white">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-4">Portales Demo</h3>
                            <div className="space-y-3">
                                <Link to="/catalogo/ecoverde-spa?mode=demo" target="_blank"
                                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Store size={20} />
                                        <span className="font-bold text-sm">Demo Tienda</span>
                                    </div>
                                    <Sparkles size={16} />
                                </Link>
                                <Link to="/catalogo/restaurante-delicias?mode=demo" target="_blank"
                                    className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp size={20} />
                                        <span className="font-bold text-sm">Demo Restaurante</span>
                                    </div>
                                    <Sparkles size={16} />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
