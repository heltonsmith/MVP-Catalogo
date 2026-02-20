import { useState, useEffect } from 'react';
import { Search, MoreVertical, Shield, ShieldOff, Eye, ExternalLink, TrendingUp, BadgeCheck, Loader2, Store, Zap, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { Link } from 'react-router-dom';
import { cn } from '../../utils';

export default function AdminUsers() {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // 1. Fetch Companies first
            const { data: companiesData, error: companiesError } = await supabase
                .from('companies')
                .select('*')
                .not('name', 'in', '("Demo Tienda","Demo Restaurante")')
                .order('created_at', { ascending: false });

            if (companiesError) throw companiesError;

            // 2. Fetch Profiles for these companies (if any)
            const userIds = [...new Set(companiesData.map(c => c.user_id).filter(Boolean))];

            if (userIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, email, status')
                    .in('id', userIds);

                if (profilesError) throw profilesError;

                // 3. Merge data locally
                const mergedData = companiesData.map(company => ({
                    ...company,
                    profiles: profilesData.find(p => p.id === company.user_id) || null
                }));
                setUsers(mergedData);
            } else {
                setUsers(companiesData || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast("Error al cargar la lista de tiendas", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.profiles?.email.toLowerCase().includes(search.toLowerCase())
    );

    const toggleBlockUser = async (user) => {
        const newStatus = user.profiles?.status === 'active' ? 'blocked' : 'active';
        setActionId(user.user_id);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', user.user_id);

            if (error) throw error;

            showToast(
                `Usuario ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'} exitosamente.`,
                newStatus === 'blocked' ? 'error' : 'success'
            );

            setUsers(users.map(u => u.user_id === user.user_id ? { ...u, profiles: { ...u.profiles, status: newStatus } } : u));
        } catch (error) {
            console.error('Error toggling block:', error);
            showToast("No se pudo cambiar el estado del usuario", "error");
        } finally {
            setActionId(null);
        }
    };

    const changePlan = async (user, newPlan) => {
        setActionId(user.id);
        try {
            const { error } = await supabase
                .from('companies')
                .update({ plan: newPlan })
                .eq('id', user.id);

            if (error) throw error;

            showToast(`Plan de ${user.name} actualizado a ${newPlan.toUpperCase()}`, 'success');
            setUsers(users.map(u => u.id === user.id ? { ...u, plan: newPlan } : u));
        } catch (error) {
            console.error('Error changing plan:', error);
            showToast("No se pudo actualizar el plan", "error");
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Usuarios & Tiendas</h1>
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Card className="border-none shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Usuario / Tienda</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Plan</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Suscripción</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Renovación</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Estado</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100">
                                                    {user.logo ? (
                                                        <img src={user.logo} alt={user.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Store size={20} className="text-slate-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1">
                                                        <p className="font-bold text-slate-900">{user.name}</p>
                                                        {user.plan !== 'free' && (
                                                            <BadgeCheck className={`h-4 w-4 ${user.plan === 'pro' ? 'text-amber-500' : 'text-blue-500'}`} />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{user.profiles?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "gap-1.5 font-bold px-2.5 py-1 rounded-full",
                                                    user.plan === 'pro' ? "border-amber-200 text-amber-700 bg-amber-50 shadow-sm" :
                                                        user.plan === 'plus' ? "border-blue-200 text-blue-700 bg-blue-50 shadow-sm" :
                                                            user.plan === 'custom' ? "border-slate-300 text-slate-700 bg-slate-100 shadow-sm" :
                                                                "border-slate-200 text-slate-500 bg-white"
                                                )}
                                            >
                                                {user.plan === 'free' && <BadgeCheck size={12} className="text-slate-400" />}
                                                {user.plan === 'plus' && <Zap size={12} className="text-blue-500 fill-blue-500" />}
                                                {user.plan === 'pro' && <Sparkles size={12} className="text-amber-500 fill-amber-500" />}
                                                {user.plan === 'custom' && <Shield size={12} className="text-slate-700 fill-slate-700" />}
                                                {user.plan.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-900 font-medium text-xs">
                                                {user.renewal_date ? new Date(user.renewal_date).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={user.profiles?.status === 'active' ? 'success' : 'error'}>
                                                {user.profiles?.status === 'active' ? 'Activo' : 'Bloqueado'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a href={`/catalogo/${user.slug}`} target="_blank" rel="noopener noreferrer">
                                                    <Button size="icon" variant="ghost" title="Ver Tienda">
                                                        <ExternalLink size={18} className="text-slate-400" />
                                                    </Button>
                                                </a>

                                                <select
                                                    value={user.plan}
                                                    onChange={(e) => changePlan(user, e.target.value)}
                                                    disabled={actionId === user.id}
                                                    className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="free">FREE</option>
                                                    <option value="plus">PLUS</option>
                                                    <option value="pro">PRO</option>
                                                    <option value="custom">CUSTOM</option>
                                                </select>

                                                <Link to={`/dashboard?observe=${user.id}`}>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        title="Modo Observador (Dashboard)"
                                                    >
                                                        <Eye size={18} className="text-slate-400" />
                                                    </Button>
                                                </Link>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={actionId === user.user_id}
                                                    onClick={() => toggleBlockUser(user)}
                                                    title={user.profiles?.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                                                >
                                                    {actionId === user.user_id ? (
                                                        <Loader2 size={18} className="animate-spin text-slate-400" />
                                                    ) : user.profiles?.status === 'active' ? (
                                                        <ShieldOff size={18} className="text-red-400 hover:text-red-600" />
                                                    ) : (
                                                        <Shield size={18} className="text-emerald-400 hover:text-emerald-600" />
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredUsers.map((user) => (
                    <Card key={user.id} className="border-none shadow-sm overflow-hidden p-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100 flex-shrink-0">
                                {user.logo ? (
                                    <img src={user.logo} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Store size={24} className="text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-black text-slate-900 truncate">{user.name}</p>
                                    <Badge variant={user.profiles?.status === 'active' ? 'success' : 'error'} className="text-[10px] px-1.5 py-0 h-4">
                                        {user.profiles?.status === 'active' ? 'Activo' : 'Bloqueado'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 truncate font-medium">{user.profiles?.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-50 rounded-xl p-2">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Plan Actual</p>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "gap-1.5 font-bold px-2 py-0.5 rounded-full text-[10px] w-full justify-center",
                                        user.plan === 'pro' ? "border-amber-200 text-amber-700 bg-amber-50 shadow-sm" :
                                            user.plan === 'plus' ? "border-blue-200 text-blue-700 bg-blue-50 shadow-sm" :
                                                user.plan === 'custom' ? "border-slate-300 text-slate-700 bg-slate-100 shadow-sm" :
                                                    "border-slate-200 text-slate-500 bg-white"
                                    )}
                                >
                                    {user.plan.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-2 text-center flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Registrado el</p>
                                <p className="font-black text-slate-700 text-xs">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                            <div className="flex-1">
                                <select
                                    value={user.plan}
                                    onChange={(e) => changePlan(user, e.target.value)}
                                    disabled={actionId === user.id}
                                    className="w-full bg-slate-100 border-none text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    <option value="free">FREE</option>
                                    <option value="plus">PLUS</option>
                                    <option value="pro">PRO</option>
                                    <option value="custom">CUSTOM</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <a href={`/catalogo/${user.slug}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="icon" variant="ghost" className="h-10 w-10 bg-slate-50 rounded-xl">
                                        <ExternalLink size={18} className="text-slate-400" />
                                    </Button>
                                </a>
                                <Link to={`/dashboard?observe=${user.id}`}>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 bg-slate-50 rounded-xl">
                                        <Eye size={18} className="text-slate-400" />
                                    </Button>
                                </Link>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                        "h-10 w-10 rounded-xl border border-transparent",
                                        user.profiles?.status === 'active' ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                                    )}
                                    disabled={actionId === user.user_id}
                                    onClick={() => toggleBlockUser(user)}
                                >
                                    {actionId === user.user_id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : user.profiles?.status === 'active' ? (
                                        <ShieldOff size={18} />
                                    ) : (
                                        <Shield size={18} />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
