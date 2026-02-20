import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Store, TrendingUp, AlertCircle, CheckCircle2, XCircle, Loader2, Sparkles, Mail, Building2, User, CreditCard, MessageSquare, Settings } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { TextArea } from '../../components/ui/TextArea';
import { supabase } from '../../lib/supabase';

export default function AdminOverview() {
    const { showToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStores: 0,
        activeSubscriptions: 0,
        pendingUpgrades: 0
    });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [adminMessages, setAdminMessages] = useState({});

    useEffect(() => {
        fetchStats();
        fetchPendingRequests();
    }, []);

    const fetchStats = async () => {
        try {
            const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: storesCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
            const { count: pendingCount } = await supabase.from('upgrade_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: activeCount } = await supabase.from('companies').select('*', { count: 'exact', head: true }).neq('plan', 'free');

            setStats({
                totalUsers: usersCount || 0,
                totalStores: storesCount || 0,
                activeSubscriptions: activeCount || 0,
                pendingUpgrades: pendingCount || 0
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('upgrade_requests')
                .select(`
                    *,
                    companies (
                        id,
                        name,
                        logo,
                        plan,
                        user_id
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching pending upgrades:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (request) => {
        setProcessingId(request.id);
        const message = adminMessages[request.id] || `Tu solicitud para el plan ${request.requested_plan.toUpperCase()} ha sido aprobada. ¡Disfruta de tus nuevas funciones!`;

        try {
            // 1. Update request status and message
            const { error: reqError } = await supabase
                .from('upgrade_requests')
                .update({
                    status: 'approved',
                    admin_message: message
                })
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

            // 3. Create notification for the user (Handled by DB Trigger, but adding safeguard if trigger fails/not run)
            /* 
            await supabase.from('notifications').insert([{
                user_id: request.companies.user_id,
                type: 'system',
                title: 'Plan Actualizado',
                content: message,
                metadata: {
                    request_id: request.id,
                    plan: request.requested_plan
                }
            }]);
            */

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

    const handleRejectRequest = async (request) => {
        const message = adminMessages[request.id];
        if (!message) {
            showToast("Por favor ingresa un motivo para el rechazo", "error");
            return;
        }

        if (!window.confirm("¿Estás seguro de rechazar esta solicitud?")) return;

        setProcessingId(request.id);
        try {
            // 1. Update request status and message
            const { error } = await supabase
                .from('upgrade_requests')
                .update({
                    status: 'rejected',
                    admin_message: message
                })
                .eq('id', request.id);

            if (error) throw error;

            // 2. Create notification for the user (Handled by DB Trigger)
            /*
            await supabase.from('notifications').insert([{
                user_id: request.companies.user_id,
                type: 'system',
                title: 'Solicitud de Plan Rechazada',
                content: message,
                metadata: {
                    request_id: request.id,
                    plan: request.requested_plan
                }
            }]);
            */

            showToast("Solicitud rechazada", "info");
            setRequests(requests.filter(r => r.id !== request.id));
            setStats(prev => ({ ...prev, pendingUpgrades: prev.pendingUpgrades - 1 }));
        } catch (error) {
            console.error('Error rejecting request:', error);
            showToast("Error al procesar el rechazo", "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleMessageChange = (requestId, value) => {
        setAdminMessages(prev => ({
            ...prev,
            [requestId]: value
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión global de la plataforma y suscripciones.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                                <Users size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">Activo</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                            <p className="text-xs text-slate-500 font-medium">Usuarios Registrados</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-secondary-50 flex items-center justify-center text-secondary-600">
                                <Store size={24} />
                            </div>
                            <TrendingUp size={18} className="text-emerald-500" />
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-slate-900">{stats.totalStores}</p>
                            <p className="text-xs text-slate-500 font-medium">Tiendas Creadas</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">PRO</span>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-slate-900">{stats.activeSubscriptions}</p>
                            <p className="text-xs text-slate-500 font-medium">Suscripciones Activas</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow ring-2 ring-amber-100 italic">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Sparkles size={24} />
                            </div>
                            <Badge variant="warning" className="text-[10px] uppercase">{stats.pendingUpgrades} Pendientes</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-slate-900">{stats.pendingUpgrades}</p>
                            <p className="text-xs text-slate-500 font-medium">Solicitudes de Upgrade</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Requests Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <AlertCircle size={20} className="text-amber-500" />
                            Solicitudes de Upgrade
                        </h2>
                        <Badge variant="outline" className="text-slate-500 font-bold">{requests.length} en espera</Badge>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-primary-500" size={32} />
                        </div>
                    ) : requests.length === 0 ? (
                        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                            <CardContent className="p-12 text-center">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <CheckCircle2 size={32} className="text-slate-200" />
                                </div>
                                <p className="text-slate-500 font-medium">No hay solicitudes pendientes en este momento.</p>
                                <p className="text-xs text-slate-400 mt-1">¡Buen trabajo manteniendo todo al día!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {requests.map(request => (
                                <div key={request.id} className="p-5 border border-slate-100 rounded-2xl bg-white hover:shadow-md transition-all group ring-1 ring-slate-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm shrink-0">
                                                {request.companies?.logo ? (
                                                    <img src={request.companies.logo} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-slate-200">
                                                        <Store size={28} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 text-lg">{request.companies?.name}</p>
                                                    <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full border border-primary-200 uppercase">
                                                        {request.requested_plan}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                                                    <Building2 size={12} /> {request.store_name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Solicitado el</p>
                                            <p className="text-sm font-bold text-slate-700">{new Date(request.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Detailed Information Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100 mb-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                <User size={10} /> Solicitante
                                            </p>
                                            <p className="text-xs font-bold text-slate-700 truncate">{request.full_name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                <Mail size={10} /> Email
                                            </p>
                                            <p className="text-xs font-bold text-slate-700 truncate">{request.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                <CreditCard size={10} /> RUT / Facturación
                                            </p>
                                            <p className="text-xs font-bold text-slate-700">{request.rut}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                <Sparkles size={10} /> Periodo
                                            </p>
                                            <p className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full inline-block">
                                                {request.billing_period === 'monthly' ? 'Mensual' :
                                                    request.billing_period === 'semestral' ? 'Semestral' : 'Anual'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Admin Message Area */}
                                    <div className="mb-6">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">
                                            MENSAJE DE RESPUESTA (OPCIONAL)
                                        </label>
                                        <TextArea
                                            placeholder="Ej: ¡Felicidades! Tu plan ha sido activado. Si tienes dudas escríbenos..."
                                            value={adminMessages[request.id] || ''}
                                            onChange={(e) => handleMessageChange(request.id, e.target.value)}
                                            className="min-h-[100px] text-sm bg-white border-slate-200"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleApproveRequest(request)}
                                            disabled={processingId === request.id}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-sm h-11 rounded-xl shadow-lg shadow-emerald-100"
                                        >
                                            {processingId === request.id ? <Loader2 size={18} className="animate-spin mr-2" /> : <CheckCircle2 size={18} className="mr-2" />}
                                            Aprobar Solicitud
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleRejectRequest(request)}
                                            disabled={processingId === request.id}
                                            className="flex-1 border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200 font-bold text-sm h-11 rounded-xl transition-all"
                                        >
                                            <XCircle size={18} className="mr-2" />
                                            Rechazar con mensaje
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-primary-600 text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles size={120} />
                        </div>
                        <CardContent className="p-8 relative z-10">
                            <h3 className="text-xl font-bold mb-2">Resumen de Crecimiento</h3>
                            <p className="text-primary-100 text-sm mb-6 leading-relaxed">
                                Este mes hemos tenido un incremento del 12% en nuevas tiendas creadas.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200">Este Mes</p>
                                    <p className="text-2xl font-bold">+24</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200">Ingresos</p>
                                    <p className="text-2xl font-bold">$1.2k</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="p-6 border-b border-slate-50">
                            <h3 className="font-bold text-slate-800">Acciones Rápidas</h3>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {[
                                { name: 'Ver todas las Tiendas', link: '/admin/stores', icon: <Store size={16} /> },
                                { name: 'Ver todos los Usuarios', link: '/admin/users', icon: <Users size={16} /> },
                                { name: 'Configuración Global', link: '/admin/settings', icon: <Settings size={16} /> }
                            ].map((item, i) => (
                                <Link
                                    key={i}
                                    to={item.link}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold text-slate-600 hover:text-primary-600"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary-500">
                                        {item.icon}
                                    </div>
                                    {item.name}
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
