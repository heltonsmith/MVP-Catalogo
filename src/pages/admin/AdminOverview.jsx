import { Users, Store, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { COMPANIES, CONVERSATIONS } from '../../data/mock';

export default function AdminOverview() {
    // Mock statistics derived from existing data
    const totalUsers = 1250; // Mocked
    const activeStores = COMPANIES.length;
    const totalRevenue = '$45.2M'; // Mocked
    const pendingIssues = 3;

    const stats = [
        { name: 'Usuarios Totales', value: totalUsers, icon: Users, change: '+12%', color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: 'Tiendas Activas', value: activeStores, icon: Store, change: '+2', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { name: 'Ingresos Mensuales', value: totalRevenue, icon: TrendingUp, change: '+8.2%', color: 'text-violet-500', bg: 'bg-violet-50' },
        { name: 'Reportes Pendientes', value: pendingIssues, icon: AlertCircle, change: '-1', color: 'text-amber-500', bg: 'bg-amber-50' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Resumen General</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <Card key={stat.name} className="border-none shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.bg} p-3 rounded-xl`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">{stat.name}</h3>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Tiendas Recientes</h3>
                        <div className="space-y-4">
                            {COMPANIES.map(company => (
                                <div key={company.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <img src={company.logo} alt={company.name} className="h-10 w-10 rounded-lg object-cover" />
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{company.name}</p>
                                            <p className="text-xs text-slate-500">Registrado el {new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                                        Activo
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Actividad Reciente</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-4 p-3 border-b border-slate-50 last:border-0">
                                    <div className="h-2 w-2 mt-2 rounded-full bg-primary-500 shrink-0" />
                                    <div>
                                        <p className="text-sm text-slate-600">
                                            <span className="font-bold text-slate-900">Juan Pérez</span> creó una nueva cotización en <span className="font-bold text-slate-900">EcoVerde Spa</span>.
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">Hace {i * 15 + 5} minutos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
