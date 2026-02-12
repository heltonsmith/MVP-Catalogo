import { useState } from 'react';
import { Search, MoreVertical, Shield, ShieldOff, Eye, ExternalLink, TrendingUp, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { COMPANIES } from '../../data/mock';
import { useToast } from '../../components/ui/Toast';
import { Link } from 'react-router-dom';

export default function AdminUsers() {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    // Mock user state (in real app, this would come from backend)
    const [users, setUsers] = useState(COMPANIES.map(c => ({
        ...c,
        status: 'active', // active, blocked
        email: `contacto@${c.slug}.cl` // Mock email
    })));

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    const toggleBlockUser = (id) => {
        setUsers(users.map(user => {
            if (user.id === id) {
                const newStatus = user.status === 'active' ? 'blocked' : 'active';
                showToast(
                    `Usuario ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'} exitosamente.`,
                    newStatus === 'blocked' ? 'error' : 'success'
                );
                return { ...user, status: newStatus };
            }
            return user;
        }));
    };

    const changePlan = (id, currentPlan) => {
        const newPlan = currentPlan === 'pro' ? 'free' : 'pro';
        setUsers(users.map(user => {
            if (user.id === id) {
                showToast(`Plan actualizado a ${newPlan.toUpperCase()} exitosamente.`, 'success');
                return { ...user, plan: newPlan };
            }
            return user;
        }));
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios y Tiendas</h1>
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
                                            <img src={user.logo} alt={user.name} className="h-10 w-10 rounded-lg object-cover bg-slate-100" />
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <p className="font-bold text-slate-900">{user.name}</p>
                                                    {user.plan === 'pro' && (
                                                        <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-500/10" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={user.plan === 'pro' ? "border-amber-200 text-amber-700 bg-amber-50" : "border-slate-200 text-slate-700 bg-slate-50"}>
                                            {user.plan === 'pro' ? 'Pro' : 'Gratis'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {user.subscriptionDate}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-900 font-medium">{user.renewalDate}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={user.status === 'active' ? 'success' : 'error'}>
                                            {user.status === 'active' ? 'Activo' : 'Bloqueado'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link to={`/catalogo/${user.slug}`} target="_blank">
                                                <Button size="icon" variant="ghost" title="Ver Tienda">
                                                    <ExternalLink size={18} className="text-slate-400" />
                                                </Button>
                                            </Link>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                title={user.plan === 'pro' ? "Bajar a Gratis" : "Subir a Pro"}
                                                onClick={() => changePlan(user.id, user.plan)}
                                            >
                                                <TrendingUp size={18} className={user.plan === 'pro' ? "text-slate-400" : "text-amber-500"} />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                title="Modo Observador (Dashboard)"
                                                onClick={() => showToast('Entrando en modo observador...', 'info')}
                                            >
                                                <Eye size={18} className="text-slate-400" />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => toggleBlockUser(user.id)}
                                                title={user.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                                            >
                                                {user.status === 'active' ? (
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
    );
}
