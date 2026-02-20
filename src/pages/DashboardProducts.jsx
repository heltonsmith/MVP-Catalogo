import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Package, MoreVertical, Edit, Trash2, Search, Plus, Filter, Loader2, AlertCircle, ExternalLink, Copy, Clock, Zap, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, cn } from '../utils';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings';

import { PlanUpgradeModal } from '../components/dashboard/PlanUpgradeModal';
import { ProductFormModal } from '../components/dashboard/ProductFormModal';
import { useUpgradeRequest } from '../hooks/useUpgradeRequest';

import { PRODUCTS as MOCK_PRODUCTS, CATEGORIES as MOCK_CATEGORIES, COMPANIES } from '../data/mock';

export default function DashboardProducts() {
    const { company: authCompany, loading: authLoading } = useAuth();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryFilterId = searchParams.get('categoryId');

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
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { pendingRequest } = useUpgradeRequest();

    const { getSetting } = useSettings();
    const currentPlan = company?.plan || 'free';
    const isFree = currentPlan === 'free';
    const productCount = products.length;

    const getLimit = () => {
        if (currentPlan === 'custom') return Infinity;
        const limitKey = `${currentPlan}_plan_product_limit`;
        // Fallbacks: free=5, plus=100, pro=500
        const defaultValue = currentPlan === 'free' ? '5' : currentPlan === 'plus' ? '100' : '500';
        return parseInt(getSetting(limitKey, defaultValue));
    };

    const productLimit = getLimit();
    const limitReached = currentPlan !== 'custom' && productCount >= productLimit;

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
                .select(`
                    *,
                    product_images(image_url, display_order),
                    product_categories(
                        categories(id, name)
                    )
                `)
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform the data to include categories array
            const transformedProducts = (data || []).map(product => ({
                ...product,
                categories: product.product_categories?.map(pc => pc.categories) || [],
                images: product.product_images?.sort((a, b) => a.display_order - b.display_order) || []
            }));

            setProducts(transformedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            showToast("Error al cargar los productos", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDemoAction = (action) => {
        showToast(`Esta es una acción demo: ${action}. En la versión real, esta acción se realizaría correctamente.`, "demo");
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [company?.id, isDemo, demoCompany.id]);

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

        const productToDelete = products.find(p => p.id === id);
        setDeletingId(id);

        try {
            // 1. Delete images from storage first
            if (productToDelete?.product_images?.length > 0) {
                const imagePaths = productToDelete.product_images.map(img => {
                    // Extract path from URL: .../public/product-images/[path]
                    const urlParts = img.image_url.split('/product-images/');
                    return urlParts.length > 1 ? urlParts[1] : null;
                }).filter(Boolean);

                if (imagePaths.length > 0) {
                    await supabase.storage
                        .from('product-images')
                        .remove(imagePaths);
                }
            }

            // 2. Delete the product record
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
            handleDemoAction("Añadir Producto");
            return;
        }
        if (limitReached) {
            showToast(`Has alcanzado el límite de ${productLimit} productos del plan Gratis. Solicita una subida a Pro para productos ilimitados.`, "error");
            return;
        }
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditProduct = (product) => {
        if (isDemo) {
            handleDemoAction("Editar Producto");
            return;
        }
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleDeleteProductClick = (id) => {
        if (isDemo) {
            handleDemoAction("Eliminar Producto");
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

        // Real data case: product.categories is now an array of category objects
        if (!product.categories || product.categories.length === 0) {
            return 'Sin categoría';
        }
        return product.categories.map(cat => cat.name).join(', ');
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
            {currentPlan !== 'custom' && (
                <div className={cn(
                    "p-4 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500",
                    currentPlan === 'free' ? "bg-gradient-to-r from-amber-500 to-amber-600" :
                        currentPlan === 'plus' ? "bg-gradient-to-r from-blue-500 to-blue-600" :
                            "bg-gradient-to-r from-amber-600 to-amber-700"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold">Límite de Plan {currentPlan.toUpperCase()} ({productCount}/{productLimit} productos)</p>
                            <p className="text-white/80 text-xs">Sube a un plan superior para agregar más productos y fotos.</p>
                        </div>
                    </div>
                    {(currentPlan === 'free' || currentPlan === 'plus') && (
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            {pendingRequest && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white border border-white/30 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                                    <Clock size={12} />
                                    Solicitud en Revisión
                                </div>
                            )}
                            <Button
                                onClick={() => isDemo ? handleDemoAction("Mejorar Plan") : setShowUpgradeModal(true)}
                                variant="secondary"
                                size="sm"
                                className={cn(
                                    "bg-white border-none font-black shadow-sm h-9",
                                    currentPlan === 'free' ? "text-amber-600 hover:bg-amber-50" : "text-blue-600 hover:bg-blue-50",
                                    pendingRequest && "opacity-90"
                                )}
                            >
                                {pendingRequest ? (
                                    <>
                                        <Clock size={16} className="mr-2" />
                                        Ver Estado
                                    </>
                                ) : (
                                    currentPlan === 'free' ? 'Mejorar ahora' : 'Pasar a PRO'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                    <h1 className="text-2xl font-bold text-slate-900">Mis Productos</h1>
                    <p className="text-slate-500">Gestiona el inventario de tu catálogo digital.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="flex gap-2 mr-2 pr-4 border-r border-slate-200">
                        <Button
                            onClick={() => {
                                if (isDemo) {
                                    handleDemoAction("Copiar Enlace");
                                } else {
                                    const catalogUrl = `${window.location.origin}/catalogo/${company.slug}`;
                                    navigator.clipboard.writeText(catalogUrl);
                                    showToast("¡Enlace copiado!", "success");
                                }
                            }}
                            variant="secondary"
                            size="sm"
                            className="h-10 px-3 gap-2 font-bold"
                            title="Copiar enlace del catálogo"
                        >
                            <Copy size={16} />
                            <span className="hidden md:inline">Copiar Enlace</span>
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-10 px-3 gap-2 font-bold"
                            onClick={() => {
                                if (isDemo) {
                                    handleDemoAction("Ver Catálogo");
                                } else {
                                    window.open(`/catalogo/${company.slug}`, '_blank');
                                }
                            }}
                        >
                            <ExternalLink size={16} />
                            <span className="hidden md:inline">Ver Catálogo</span>
                        </Button>
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
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Input
                        placeholder="Buscar por nombre o SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 bg-white"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <select
                            value={categoryFilterId || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                const newParams = new URLSearchParams(searchParams);
                                if (val) newParams.set('categoryId', val);
                                else newParams.delete('categoryId');
                                setSearchParams(newParams);
                            }}
                            className="h-10 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary-100 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25em_1.25em] w-full md:min-w-[200px] cursor-pointer hover:border-primary-200 transition-colors"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2394a3b8\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")' }}
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <Filter className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                    <Button variant="secondary" className="px-3 h-10 hidden md:flex">
                        <Filter className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Active Category Filter Indicator */}
            {categoryFilterId && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-xs font-bold shadow-sm">
                        <Filter size={12} />
                        Categoría: {categories.find(c => c.id === categoryFilterId)?.name || 'Cargando...'}
                        <button
                            onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.delete('categoryId');
                                setSearchParams(newParams);
                            }}
                            className="ml-1 p-0.5 hover:bg-primary-100 rounded-full transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden Products Warning */}
            {productCount > productLimit && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500/20 p-2 rounded-xl">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Hay {productCount - productLimit} productos ocultos</p>
                            <p className="text-slate-400 text-[11px]">Tu plan actual solo permite mostrar {productLimit} productos. Los demás siguen guardados pero no son visibles para tus clientes.</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => isDemo ? handleDemoAction("Mejorar Plan") : null}
                        variant="secondary"
                        size="sm"
                        className="h-8 bg-white/10 border-white/10 text-white hover:bg-white/20 text-[10px] font-bold"
                    >
                        Recuperar Visibilidad
                    </Button>
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Producto</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">SKU</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Categoría</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Precio</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px]">{isDemoRestaurant ? 'Disponibilidad' : 'Stock'}</th>
                                <th className="px-6 py-4 font-bold text-slate-900 uppercase tracking-wider text-[10px] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.filter(p => {
                                const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                                    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

                                if (!categoryFilterId) return matchesSearch;

                                // Check if the product has the filtered category
                                // In demo mode, p.categories is an array of IDs
                                // In real mode, p.categories is an array of objects
                                if (isDemo) {
                                    return matchesSearch && (p.categories || []).includes(categoryFilterId);
                                } else {
                                    return matchesSearch && (p.categories || []).some(cat => cat.id === categoryFilterId);
                                }
                            }).slice(0, productLimit).map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {product.images && product.images.length > 0 ? (
                                                <img src={product.images[0].image_url || product.image} className="h-10 w-10 rounded-lg object-cover mr-3 bg-slate-100 shadow-sm border border-slate-100" />
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
                                        {product.sku ? (
                                            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded uppercase tracking-wider border border-primary-100/50">
                                                {product.sku}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 italic">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-600 font-medium">
                                            {getCategoryNames(product)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-700">{formatCurrency(product.price)}</span>
                                            {product.wholesale_prices && product.wholesale_prices.length > 0 && (
                                                <div className="flex flex-col gap-0.5">
                                                    {product.wholesale_prices.sort((a, b) => a.min_qty - b.min_qty).map((tier, idx) => (
                                                        <span key={idx} className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded w-fit whitespace-nowrap">
                                                            {tier.min_qty}+ un: {formatCurrency(tier.price)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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

            <PlanUpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                companyId={company?.id}
            />
        </div>
    );
}
