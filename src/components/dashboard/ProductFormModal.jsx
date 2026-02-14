import { useState, useEffect } from 'react';
import { X, Upload, Loader2, Package, Tag, DollarSign, Archive, Link as LinkIcon, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { cn } from '../../utils';

export function ProductFormModal({ isOpen, onClose, productToEdit = null, onSuccess, companyId, categories = [] }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category_id: '',
        image: '',
        slug: '',
        available: true
    });

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setFormData({
                    name: productToEdit.name || '',
                    description: productToEdit.description || '',
                    price: productToEdit.price || '',
                    stock: productToEdit.stock || '',
                    category_id: productToEdit.category_id || '',
                    image: productToEdit.image || '',
                    slug: productToEdit.slug || '',
                    available: productToEdit.available !== false
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    price: '',
                    stock: '',
                    category_id: '',
                    image: '',
                    slug: '',
                    available: true
                });
            }
        }
    }, [isOpen, productToEdit]);

    // Auto-generate slug from name if not editing an existing slug manually
    useEffect(() => {
        if (!productToEdit && formData.name) {
            const slug = formData.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.name, productToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!companyId) throw new Error("Company ID missing");

            const productData = {
                ...formData,
                company_id: companyId,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock) || 0,
                category_id: formData.category_id || null
            };

            let error;
            if (productToEdit) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productToEdit.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('products')
                    .insert([productData]);
                error = insertError;
            }

            if (error) throw error;

            showToast(
                productToEdit ? "Producto actualizado correctamente" : "Producto creado correctamente",
                "success"
            );
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            showToast("Error al guardar el producto", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {productToEdit ? 'Modifica los detalles de tu producto' : 'Añade un nuevo artículo a tu catálogo'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Image Preview/Input Placeholder */}
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="shrink-0">
                                        <div className="h-32 w-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden group">
                                            {formData.image ? (
                                                <>
                                                    <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-white hover:text-white hover:bg-white/20"
                                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                                        >
                                                            <X size={20} />
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Camera size={24} className="mb-2" />
                                                    <span className="text-[10px] font-bold uppercase text-center px-2">Imagen URL</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">URL de la Imagen</label>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                                <Input
                                                    name="image"
                                                    placeholder="https://ejemplo.com/imagen.jpg"
                                                    value={formData.image}
                                                    onChange={handleChange}
                                                    className="pl-9"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 pl-1">Por ahora solo soportamos URLs de imágenes externas.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre del Producto *</label>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                required
                                                name="name"
                                                placeholder="Ej. Zapatillas Running"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="pl-9 font-bold text-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Slug (URL) *</label>
                                        <Input
                                            required
                                            name="slug"
                                            placeholder="zapatillas-running"
                                            value={formData.slug}
                                            onChange={handleChange}
                                            className="font-mono text-xs bg-slate-50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción</label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        placeholder="Describe tu producto..."
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border-slate-200 bg-slate-50/50 p-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Precio *</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                required
                                                type="number"
                                                name="price"
                                                placeholder="0"
                                                value={formData.price}
                                                onChange={handleChange}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Stock *</label>
                                        <div className="relative">
                                            <Archive className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                required
                                                type="number"
                                                name="stock"
                                                placeholder="0"
                                                value={formData.stock}
                                                onChange={handleChange}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 col-span-2 sm:col-span-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Categoría</label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-10" />
                                            <select
                                                name="category_id"
                                                value={formData.category_id}
                                                onChange={handleChange}
                                                className="w-full h-10 rounded-xl border-slate-200 bg-white pl-9 pr-4 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Sin categoría</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="available"
                                        name="available"
                                        checked={formData.available}
                                        onChange={handleChange}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                                    />
                                    <label htmlFor="available" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                                        Producto disponible para la venta
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
                            <Button type="button" variant="ghost" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button form="product-form" type="submit" disabled={loading} className="font-bold shadow-lg shadow-primary-200">
                                {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                                {productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
