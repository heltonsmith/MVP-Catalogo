import { Layers, Plus, Edit2, Trash2, Search, MoreVertical } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/mock';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export default function DashboardCategories() {
    const { showToast } = useToast();

    const handleDemoAction = () => {
        showToast("La edición de categorías no está disponible en la versión de demostración.", "demo");
    };

    const getProductCount = (categoryId) => {
        return PRODUCTS.filter(p => p.categoryId === categoryId).length;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Categorías</h1>
                    <p className="text-slate-500">Organiza tus productos para que sea más fácil encontrarlos.</p>
                </div>
                <Button onClick={handleDemoAction} className="shadow-lg shadow-primary-100 h-10 w-10 p-0 md:h-10 md:w-auto md:px-4 shrink-0">
                    <Plus className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">Nueva Categoría</span>
                </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-white">
                    <div className="relative max-w-sm">
                        <Input
                            placeholder="Buscar categorías..."
                            className="pl-9 bg-slate-50 border-none h-10 text-xs"
                        />
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {CATEGORIES.map((category) => (
                            <div key={category.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                                        <Layers size={20} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">{category.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{getProductCount(category.id)} Productos asociados</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600" onClick={handleDemoAction}>
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500" onClick={handleDemoAction}>
                                        <Trash2 size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400" onClick={handleDemoAction}>
                                        <MoreVertical size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Tip */}
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <Layers size={20} className="text-primary-600" />
                </div>
                <p className="text-sm text-primary-900 font-medium text-center md:text-left">
                    <span className="font-bold">Pro Tip:</span> Mantener categorías claras mejora la navegación del catálogo en un 40%. Tus clientes encontrarán lo que buscan más rápido.
                </p>
            </div>
        </div>
    );
}
