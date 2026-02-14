import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Package, MoreVertical, Edit, Trash2, Search, Plus, Filter, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, cn } from '../utils';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

import { PlanUpgradeModal } from '../components/dashboard/PlanUpgradeModal';
import { ProductFormModal } from '../components/dashboard/ProductFormModal';

import { PRODUCTS as MOCK_PRODUCTS, CATEGORIES as MOCK_CATEGORIES, COMPANIES } from '../data/mock';

export default function DashboardProducts() {
    const { company: authCompany, loading: authLoading } = useAuth();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Check for demo mode via URL path or query param
    const isDemo = location.pathname.includes('/demo') || searchParams.get('demo') === 'true';

    // Detect which demo type - use useMemo to prevent recreation on every render
    const isDemoRestaurant = location.pathname.includes('/demo/restaurante');
    const demoCompany = useMemo(() =>
        isDemoRestaurant ? COMPANIES[2] : COMPANIES[0],
        [isDemoRestaurant]
    );

    // Use mock company if in demo mode
    const company = isDemo ? { ...demoCompany, id: 'demo', plan: 'pro' } : authCompany;

    const [search, setSearch] = useState('');
    const { showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);

    const isFree = company?.plan === 'free';
    const productCount = products.length;
    const limitReached = isFree && productCount >= 5;

    const fetchCategories = async () => {
        if (isDemo) {
            setCategories(MOCK_CATEGORIES);
            return;
        }

        if (!company?.id) return;
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('company_id', company.id)
                .order('name');
            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        if (isDemo) {
            setLoading(true);
            // Simulate network delay and filter by company
            setTimeout(() => {
                const companyProducts = MOCK_PRODUCTS.filter(p => p.companyId === demoCompany.id);
                setProducts(companyProducts);
                setLoading(false);
            }, 600);
            return;
        }

        if (!company?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, categories(name)')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            showToast("Error al cargar los productos", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [company?.id, isDemo, demoCompany.id]);

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

        setDeletingId(id);
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showToast("Producto eliminado correctamente", "success");
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast("No se pudo eliminar el producto", "error");
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddProduct = () => {
        if (isDemo) {
            showToast("Esta es una demostración. En la versión real podrás agregar productos.", "info");
            return;
        }
        if (limitReached) {
            showToast("Has alcanzado el límite de 5 productos del plan Gratis. Solicita una subida a Pro para productos ilimitados.", "error");
            return;
        }
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditProduct = (product) => {
        if (isDemo) {
            showToast("Esta es una demostración. En la versión real podrás editar productos.", "info");
            return;
        }
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleDeleteProductClick = (id) => {
        if (isDemo) {
            showToast("Esta es una demostración. En la versión real podrás eliminar productos.", "info");
            return;
        }
        handleDeleteProduct(id);
    };

    // Helper function to get category names from IDs
    const getCategoryNames = (product) => {
        if (isDemo) {
            const categoryIds = product.categories || [];
            if (!categoryIds || categoryIds.length === 0) return 'Sin categoría';
            const names = categoryIds
                .map(id => categories.find(cat => cat.id === id)?.name)
                .filter(Boolean);
            return names.length > 0 ? names.join(', ') : 'Sin categoría';
        }

        // Real data case: product.categories is the object from the join
        return product.categories?.name || 'Sin categoría';
    };

    const handleSuccess = () => {
        fetchProducts();
        setIsModalOpen(false);
    };

    if (authLoading || (loading && products.length === 0)) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
            <p className="text-slate-500 font-bold animate-pulse">Cargando tus productos...</p>
        </div>
    );

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
                    onClick={handleAddProduct}
                    className={cn(
                        "h-10 px-4 shrink-0 shadow-lg transition-all",
                        limitReached ? "bg-amber-100 text-amber-600 hover:bg-amber-200 border border-amber-200" : "shadow-primary-100"
                    )}
                >
                    {limitReached ? <AlertCircle className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                    <span>{limitReached ? 'Limite Alcanzado' : 'Añadir Producto'}</span>
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
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">{isDemoRestaurant ? 'Disponibilidad' : 'Stock'}</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {product.images && product.images[0] ? (
                                                <img src={product.images[0]} className="h-10 w-10 rounded-lg object-cover mr-3 bg-slate-100 shadow-sm border border-slate-100" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 mr-3 flex items-center justify-center border border-slate-100">
                                                    <Package size={20} className="text-slate-300" />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-900">{product.name}</span>
                                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{product.slug}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-600 font-medium">
                                            {getCategoryNames(product)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        {formatCurrency(product.price)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isDemoRestaurant ? (
                                            <span className={cn(
                                                "font-bold px-2 py-0.5 rounded-md text-[10px] uppercase",
                                                product.stock > 0 ? "bg-emerald-50 text-emerald-500 border border-emerald-100" : "bg-red-50 text-red-500 border border-red-100"
                                            )}>
                                                {product.stock > 0 ? 'Disponible' : 'No disponible'}
                                            </span>
                                        ) : (
                                            <span className={cn(
                                                "font-bold px-2 py-0.5 rounded-md text-[10px] uppercase",
                                                product.stock < 10 ? "bg-red-50 text-red-500 border border-red-100" : "bg-emerald-50 text-emerald-500 border border-emerald-100"
                                            )}>
                                                {product.available ? `Stock: ${product.stock}` : 'No disponible'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-primary-50 hover:text-primary-600"
                                                onClick={() => handleEditProduct(product)}
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => handleDeleteProductClick(product.id)}
                                                disabled={deletingId === product.id}
                                            >
                                                {deletingId === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                                        <Package size={48} className="mx-auto mb-4 opacity-10" />
                                        <p className="font-bold uppercase tracking-widest text-xs">No tienes productos todavía</p>
                                        <p className="text-sm mt-1">Comienza añadiendo tu primer producto al catálogo.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productToEdit={productToEdit}
                onSuccess={handleSuccess}
                companyId={company?.id}
                categories={categories}
            />
        </div>
    );
}
