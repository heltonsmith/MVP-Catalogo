import { useState, useEffect } from 'react';
import { X, Upload, Loader2, Package, Tag, DollarSign, Archive, Camera, Trash2, Weight, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';

export function ProductFormModal({ isOpen, onClose, productToEdit = null, onSuccess, companyId, categories = [] }) {
    const { showToast } = useToast();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        weight: '',
        size: '',
        slug: '',
        available: true
    });
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [images, setImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);

    const isPro = profile?.companies?.plan === 'pro';
    const maxImages = isPro ? 6 : 1;

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setFormData({
                    name: productToEdit.name || '',
                    description: productToEdit.description || '',
                    price: productToEdit.price || '',
                    stock: productToEdit.stock || '',
                    weight: productToEdit.weight || '',
                    size: productToEdit.size || '',
                    slug: productToEdit.slug || '',
                    available: productToEdit.available !== false
                });
                // TODO: Load existing categories and images
                setSelectedCategories([]);
                setImages([]);
            } else {
                setFormData({
                    name: '',
                    description: '',
                    price: '',
                    stock: '',
                    weight: '',
                    size: '',
                    slug: '',
                    available: true
                });
                setSelectedCategories([]);
                setImages([]);
                setImageFiles([]);
            }
        }
    }, [isOpen, productToEdit]);

    // Auto-generate slug from name
    useEffect(() => {
        if (formData.name && !productToEdit) {
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

    const handleCategoryToggle = (categoryId) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const remainingSlots = maxImages - images.length - imageFiles.length;

        if (files.length > remainingSlots) {
            showToast(`Solo puedes subir ${maxImages} imagen${maxImages > 1 ? 'es' : ''} (Plan ${isPro ? 'Pro' : 'Gratis'})`, 'error');
            return;
        }

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                showToast(`${file.name} no es una imagen válida`, 'error');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast(`${file.name} es muy grande (máx 5MB)`, 'error');
                return false;
            }
            return true;
        });

        setImageFiles(prev => [...prev, ...validFiles]);
    };

    const handleRemoveImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (productId) => {
        if (imageFiles.length === 0) return [];

        setUploadingImages(true);
        const uploadedUrls = [];

        try {
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${productId}_${Date.now()}_${i}.${fileExt}`;
                const filePath = `${companyId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);

                // Save to product_images table
                await supabase.from('product_images').insert({
                    product_id: productId,
                    image_url: publicUrl,
                    display_order: i
                });
            }

            return uploadedUrls;
        } catch (error) {
            console.error('Error uploading images:', error);
            showToast('Error al subir imágenes', 'error');
            return [];
        } finally {
            setUploadingImages(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!companyId) throw new Error("Company ID missing");

            if (imageFiles.length === 0 && !productToEdit) {
                showToast('Debes subir al menos una imagen', 'error');
                setLoading(false);
                return;
            }

            const productData = {
                ...formData,
                company_id: companyId,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock) || 0
            };

            let productId;
            let error;

            if (productToEdit) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productToEdit.id);
                error = updateError;
                productId = productToEdit.id;
            } else {
                const { data, error: insertError } = await supabase
                    .from('products')
                    .insert([productData])
                    .select()
                    .single();
                error = insertError;
                productId = data?.id;
            }

            if (error) throw error;

            // Upload images
            if (imageFiles.length > 0) {
                await uploadImages(productId);
            }

            // Save categories
            if (selectedCategories.length > 0) {
                // Delete existing categories if editing
                if (productToEdit) {
                    await supabase
                        .from('product_categories')
                        .delete()
                        .eq('product_id', productId);
                }

                // Insert new categories
                const categoryInserts = selectedCategories.map(catId => ({
                    product_id: productId,
                    category_id: catId
                }));

                await supabase
                    .from('product_categories')
                    .insert(categoryInserts);
            }

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
                        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
                                {/* Image Upload Section */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                        Imágenes del Producto * ({images.length + imageFiles.length}/{maxImages})
                                    </label>

                                    {/* Image Grid */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {imageFiles.map((file, index) => (
                                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 group">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Upload Button */}
                                        {(images.length + imageFiles.length) < maxImages && (
                                            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-primary-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100">
                                                <Camera size={24} className="text-slate-400 mb-2" />
                                                <span className="text-xs font-bold text-slate-500">Subir imagen</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleImageSelect}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <p className="text-[10px] text-slate-400 pl-1">
                                        {isPro ? 'Plan Pro: Hasta 6 imágenes por producto' : 'Plan Gratis: 1 imagen por producto'}
                                    </p>
                                </div>

                                {/* Product Name & Auto-generated Slug */}
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
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Slug (URL) - Auto generado</label>
                                        <Input
                                            disabled
                                            value={formData.slug}
                                            className="font-mono text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                                            placeholder="se-genera-automaticamente"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
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

                                {/* Price, Stock, Weight, Size */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Peso</label>
                                        <div className="relative">
                                            <Weight className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                name="weight"
                                                placeholder="500g"
                                                value={formData.weight}
                                                onChange={handleChange}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tamaño</label>
                                        <div className="relative">
                                            <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                name="size"
                                                placeholder="M"
                                                value={formData.size}
                                                onChange={handleChange}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-Category Selection */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Categorías</label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => handleCategoryToggle(cat.id)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                                    selectedCategories.includes(cat.id)
                                                        ? "bg-primary-500 text-white shadow-md"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                )}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Available Checkbox */}
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
                            <Button form="product-form" type="submit" disabled={loading || uploadingImages} className="font-bold shadow-lg shadow-primary-200">
                                {(loading || uploadingImages) ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                                {uploadingImages ? 'Subiendo imágenes...' : (productToEdit ? 'Guardar Cambios' : 'Crear Producto')}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
