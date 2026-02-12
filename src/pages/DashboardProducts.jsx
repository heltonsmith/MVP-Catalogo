import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MoreVertical, Edit, Trash2, Search, Plus, Filter } from 'lucide-react';
import { PRODUCTS } from '../data/mock';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, cn } from '../utils';
import { useToast } from '../components/ui/Toast';

export default function DashboardProducts() {
    const [search, setSearch] = useState('');
    const { showToast } = useToast();
    const company = COMPANIES[0]; // In real app, get current authenticated company
    const isFree = company.plan === 'free';
    const productCount = PRODUCTS.filter(p => p.companyId === company.id).length;
    const limitReached = isFree && productCount >= 5;

    const handleDemoAction = () => {
        if (limitReached) {
            showToast("Has alcanzado el límite de 5 productos del plan Gratis. Sube a Pro para productos ilimitados.", "error");
            return;
        }
        showToast("La gestión de productos está deshabilitada en el demo.", "demo");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Upgrade Banner for Free Users */}
            {isFree && (
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold">Límite de Plan Gratis ({productCount}/5 productos)</p>
                            <p className="text-amber-50 text-xs">Sube a Pro para agregar productos ilimitados y fotos infinitas.</p>
                        </div>
                    </div>
                    <Link to="/precios">
                        <Button variant="secondary" size="sm" className="bg-white text-amber-600 hover:bg-amber-50 border-none font-bold">
                            Actualizar ahora
                        </Button>
                    </Link>
                </div>
            )}

            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mis Productos</h1>
                    <p className="text-slate-500">Gestiona el inventario de tu catálogo digital.</p>
                </div>
                <Button
                    onClick={handleDemoAction}
                    className={cn(
                        "h-10 w-10 p-0 md:h-10 md:w-auto md:px-4 shrink-0 shadow-lg",
                        limitReached ? "bg-slate-400 hover:bg-slate-400 cursor-not-allowed" : "shadow-primary-100"
                    )}
                >
                    <Plus className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">Añadir Producto</span>
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Input
                        placeholder="Buscar por nombre o SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
                <Button variant="secondary" className="px-3">
                    <Filter className="h-5 w-5" />
                </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Producto</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Categoría</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Precio</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Stock</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <img src={product.images[0]} className="h-10 w-10 rounded-lg object-cover mr-3 bg-slate-100" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{product.name}</span>
                                                <span className="text-[10px] font-mono text-slate-400">SKU: {product.sku}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline">{product.categoryId}</Badge>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {formatCurrency(product.price)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "font-bold",
                                            product.stock < 10 ? "text-red-500" : "text-emerald-500"
                                        )}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDemoAction}>
                                                <Edit size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500" onClick={handleDemoAction}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
