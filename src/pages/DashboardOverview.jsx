import { Package, Eye, DollarSign, TrendingUp, Plus } from 'lucide-react';
import { PRODUCTS } from '../data/mock';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function DashboardOverview() {
    const stats = [
        { name: 'Productos', value: PRODUCTS.length, icon: <Package className="text-blue-500" />, trend: '+2 nuevos' },
        { name: 'Visitas', value: '1,248', icon: <Eye className="text-emerald-500" />, trend: '+12% hoy' },
        { name: 'Cotizaciones', value: '42', icon: <DollarSign className="text-purple-500" />, trend: 'Pendientes' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bienvenido, Helton</h1>
                    <p className="text-slate-500">Esto es lo que está pasando en tu catálogo hoy.</p>
                </div>
                <Button className="hidden sm:flex">
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Producto
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                    {stat.icon}
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">
                                    {stat.trend}
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-slate-500 text-sm font-medium">{stat.name}</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <h2 className="text-xl font-bold text-slate-800">Próximos pasos</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="bg-primary-600 text-white border-none cursor-pointer hover:bg-primary-700">
                    <CardContent className="p-6">
                        <h4 className="font-bold text-lg">Completa tu perfil</h4>
                        <p className="text-primary-100 text-sm mt-1">Asegúrate de agregar tu WhatsApp para recibir cotizaciones.</p>
                    </CardContent>
                </Card>
                <Card className="border-dashed border-2 border-slate-200 shadow-none cursor-pointer hover:border-primary-400">
                    <CardContent className="p-6 flex items-center justify-center h-full">
                        <p className="text-slate-400 font-medium">Ver tutorial de configuración</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
