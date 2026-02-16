import { useState, useEffect, useMemo } from 'react';
import { Layers, Plus, Edit2, Trash2, Search, MoreVertical, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CATEGORIES as MOCK_CATEGORIES, COMPANIES } from '../data/mock';

export default function DashboardCategories() {
    const { company: authCompany, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Check for demo mode
    const isDemo = location.pathname.includes('/demo') || searchParams.get('demo') === 'true';

    // Detect which demo type - use useMemo to prevent recreation on every render
    const isDemoRestaurant = location.pathname.includes('/demo/restaurante');
    const demoCompany = useMemo(() =>
        isDemoRestaurant ? COMPANIES[2] : COMPANIES[0],
        [isDemoRestaurant]
    );

    // Use mock company if in demo mode
    const company = isDemo ? { ...demoCompany, id: 'demo', plan: 'pro' } : authCompany;

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [counts, setCounts] = useState({});

    const fetchCategories = async () => {
        if (isDemo) {
            // Filter categories by company
            const companyCategories = MOCK_CATEGORIES.filter(c => c.companyId === demoCompany.id);
            setCategories(companyCategories);
            // Mock counts
            const mockCounts = {};
            companyCategories.forEach(cat => {
                mockCounts[cat.id] = Math.floor(Math.random() * 10) + 3;
            });
            setCounts(mockCounts);
            setLoading(false);
            return;
        }

        if (!company?.id) return;
        setLoading(true);
        try {
            // Fetch categories
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('company_id', company.id)
                .order('order', { ascending: true });

            if (catError) throw catError;

            // Fetch product counts per category using the junction table
            // We join categories with product_categories to get the count for this specific company's categories
            const { data: countData, error: countError } = await supabase
                .from('product_categories')
                .select('category_id')
                .in('category_id', catData.map(c => c.id));

            if (countError) throw countError;

            const categoryCounts = (countData || []).reduce((acc, pc) => {
                acc[pc.category_id] = (acc[pc.category_id] || 0) + 1;
                return acc;
            }, {});

            setCategories(catData || []);
            setCounts(categoryCounts);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast("Error al cargar categorías", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [company?.id, isDemo, demoCompany.id]);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        if (isDemo) {
            showToast("Esta es una demostración. En la versión real podrás agregar categorías.", "info");
            setNewCategoryName('');
            return;
        }

        setIsAdding(true);
        try {
            const slug = newCategoryName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const { data, error } = await supabase
                .from('categories')
                .insert([{
                    company_id: company.id,
                    name: newCategoryName.trim(),
                    slug,
                    order: categories.length
                }])
                .select()
                .single();

            if (error) throw error;

            showToast("Categoría añadida correctamente", "success");
            setCategories([...categories, data]);
            setNewCategoryName('');
        } catch (error) {
            console.error('Error adding category:', error);
            showToast("No se pudo añadir la categoría", "error");
        } finally {
            setIsAdding(false);
        }
    };

    const [editingCategory, setEditingCategory] = useState(null);
    const [editName, setEditName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleDeleteCategory = async (id) => {
        if (isDemo) {
            showToast("Esta es una demostración. En la versión real podrás eliminar categorías.", "info");
            return;
        }

        if (counts[id] > 0) {
            showToast(`No puedes eliminar una categoría que tiene ${counts[id]} productos.`, "error");
            return;
        }
        if (!window.confirm("¿Estás seguro de que deseas eliminar esta categoría?")) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showToast("Categoría eliminada", "success");
            setCategories(categories.filter(c => c.id !== id));
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast("Error al eliminar la categoría", "error");
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!editName.trim() || !editingCategory) return;

        if (isDemo) {
            showToast("Esta es una demostración. En la versión real podrás editar categorías.", "info");
            setEditingCategory(null);
            return;
        }

        setIsUpdating(true);
        try {
            const slug = editName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            const { error } = await supabase
                .from('categories')
                .update({
                    name: editName.trim(),
                    slug
                })
                .eq('id', editingCategory.id);

            if (error) throw error;

            showToast("Categoría actualizada correctamente", "success");
            setCategories(categories.map(c =>
                c.id === editingCategory.id
                    ? { ...c, name: editName.trim(), slug }
                    : c
            ));
            setEditingCategory(null);
            setEditName('');
        } catch (error) {
            console.error('Error updating category:', error);
            showToast("No se pudo actualizar la categoría", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    if (authLoading || (loading && categories.length === 0)) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
            <p className="text-slate-500 font-bold animate-pulse">Cargando categorías...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Categorías</h1>
                    <p className="text-slate-500">Organiza tus productos para que sea más fácil encontrarlos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <form onSubmit={handleAddCategory} className="flex items-center gap-2">
                        <Input
                            placeholder="Nombre de nueva categoría..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="bg-white border-slate-200 h-10 min-w-[200px]"
                            disabled={isAdding}
                        />
                        <Button type="submit" disabled={isAdding || !newCategoryName.trim()} className="shadow-lg shadow-primary-100 h-10 px-4 shrink-0">
                            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5 md:mr-2" />}
                            <span className="hidden md:inline">Añadir</span>
                        </Button>
                    </form>
                </div>
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
                        {categories.map((category) => (
                            <div key={category.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                                        <Layers size={20} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">{category.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{counts[category.id] || 0} Productos asociados</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-primary-400 hover:text-primary-600 hover:bg-primary-50"
                                        title="Ver productos"
                                        onClick={() => navigate(`/dashboard/productos?categoryId=${category.id}`)}
                                    >
                                        <ExternalLink size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-slate-300 hover:text-primary-600"
                                        onClick={() => {
                                            setEditingCategory(category);
                                            setEditName(category.name);
                                        }}
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-slate-300 hover:text-red-500"
                                        onClick={() => handleDeleteCategory(category.id)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && !loading && (
                            <div className="p-12 text-center text-slate-400">
                                <Layers size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="font-bold uppercase tracking-widest text-xs">No tienes categorías</p>
                                <p className="text-sm mt-1">Crea tu primera categoría para organizar tus productos.</p>
                            </div>
                        )}
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

            <Modal
                isOpen={!!editingCategory}
                onClose={() => setEditingCategory(null)}
                title="Editar Categoría"
            >
                <div className="p-6">
                    <form onSubmit={handleUpdateCategory} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre de la Categoría</label>
                            <Input
                                placeholder="Ej. Accesorios"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="font-bold text-slate-700"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 font-bold"
                                onClick={() => setEditingCategory(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 font-bold shadow-lg shadow-primary-200"
                                disabled={isUpdating || !editName.trim()}
                            >
                                {isUpdating ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
