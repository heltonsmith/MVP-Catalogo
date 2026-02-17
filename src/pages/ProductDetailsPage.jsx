import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Share2, ShieldCheck, Package, Truck, Utensils, User, Loader2 } from 'lucide-react';
import { PRODUCTS, COMPANIES, CATEGORIES } from '../data/mock';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StarRating } from '../components/ui/StarRating';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils';
import { useCart } from '../hooks/useCart';
import { useToast } from '../components/ui/Toast';
import { motion } from 'framer-motion';
import NotFoundPage from './NotFoundPage';

import { useAuth } from '../context/AuthContext';

export default function ProductDetailsPage() {
    const { showToast } = useToast();
    const { user, profile } = useAuth();
    const [searchParams] = useSearchParams();
    const isDemo = searchParams.get('mode') === 'demo';

    const { productSlug, companySlug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [product, setProduct] = useState(null);
    const [company, setCompany] = useState(null);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [tempReview, setTempReview] = useState({ rating: 0, comment: '' });

    useEffect(() => {
        const fetchProductData = async () => {
            if (isDemo) {
                const demoProduct = PRODUCTS.find(p => p.slug === productSlug);
                const demoCompany = COMPANIES.find(c => c.slug === companySlug);

                if (demoProduct && demoCompany) {
                    setProduct({
                        ...demoProduct,
                        images: demoProduct.images || []
                    });
                    setCompany(demoCompany);
                } else {
                    setError('Not found');
                }
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // 1. Fetch Company
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('slug', companySlug)
                    .single();

                if (companyError || !companyData) throw new Error('Company not found');
                setCompany(companyData);

                // 2. Fetch Product with images and categories
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_images(image_url, display_order),
                        product_categories(
                            categories(id, name)
                        )
                    `)
                    .eq('slug', productSlug)
                    .eq('company_id', companyData.id)
                    .single();

                if (productError || !productData) throw new Error('Product not found');

                // 3. Fetch Reviews
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('product_id', productData.id)
                    .order('created_at', { ascending: false });

                // Transform reviews to match mock structure
                const transformedReviews = (reviewsData || []).map(r => ({
                    id: r.id,
                    user: r.customer_name || 'Anónimo',
                    date: new Date(r.created_at).toLocaleDateString(),
                    rating: r.rating,
                    comment: r.comment
                }));

                const rating = transformedReviews.length > 0
                    ? parseFloat((transformedReviews.reduce((acc, r) => acc + r.rating, 0) / transformedReviews.length).toFixed(1))
                    : 0;

                // Transform product to match expected UI structure
                const categories = productData.product_categories?.map(pc => pc.categories) || [];
                const transformedProduct = {
                    ...productData,
                    categories: categories,
                    categoryId: categories[0]?.id,
                    categoryName: categories[0]?.name,
                    images: productData.product_images?.length > 0
                        ? productData.product_images.sort((a, b) => a.display_order - b.display_order).map(img => img.image_url)
                        : productData.image ? [productData.image] : [],
                    reviews: transformedReviews,
                    rating: rating
                };

                setProduct(transformedProduct);
            } catch (err) {
                console.error('Error fetching product detail:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [productSlug, companySlug, isDemo]);

    useEffect(() => {
        if (user && product) {
            checkIfReviewed();
        }
    }, [user, product]);

    const checkIfReviewed = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', product.id)
                .maybeSingle();

            setHasReviewed(!!data);
        } catch (error) {
            console.error('Error checking review:', error);
        }
    };

    const handleSubmitReview = async () => {
        if (!user) {
            showToast("Debes iniciar sesión para comentar", "info");
            return;
        }
        if (tempReview.rating === 0) {
            showToast("Por favor selecciona una calificación", "error");
            return;
        }

        try {
            const { error } = await supabase
                .from('reviews')
                .insert([{
                    user_id: user.id,
                    company_id: company.id, // Store review also linked to company
                    product_id: product.id,
                    rating: tempReview.rating,
                    comment: tempReview.comment,
                    customer_name: profile?.full_name || user.user_metadata?.full_name || 'Anónimo'
                }]);

            if (error) throw error;

            showToast("¡Gracias por tu opinión!", "success");
            setHasReviewed(true);
            setTempReview({ rating: 0, comment: '' });

            // Real-time update
            setProduct(prev => {
                const updatedReviews = [
                    {
                        id: Date.now(), // Temporary ID until refresh
                        user: profile?.full_name || user.user_metadata?.full_name || 'Anónimo',
                        date: new Date().toLocaleDateString(),
                        rating: tempReview.rating,
                        comment: tempReview.comment
                    },
                    ...(prev.reviews || [])
                ];

                const newRating = parseFloat((updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1));

                return {
                    ...prev,
                    reviews: updatedReviews,
                    rating: newRating
                };
            });
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast("No se pudo enviar la reseña", "error");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
                <p className="text-slate-500 font-bold animate-pulse">Cargando detalles...</p>
            </div>
        );
    }

    if (error || !product || !company) {
        return <NotFoundPage />;
    }

    const handleAddToCart = () => {
        if (isDemo) {
            showToast('Esta es una función de demostración. En la versión real, añadiría el producto al carrito.', 'demo');
            return;
        }
        addToCart(product, quantity);
        showToast(`✅ ${product.name} (x${quantity}) agregado al carrito`, 'success');
    };

    const handleShare = async () => {
        if (isDemo) {
            showToast('Esta es una función de demostración. En la versión real, permitiría compartir el producto.', 'demo');
            return;
        }
        const shareData = {
            title: product.name,
            text: `Mira este producto en ${company.name}: ${product.name} `,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast('¡Enlace copiado al portapapeles!', 'success');
            } catch (err) {
                console.error('Error copying:', err);
            }
        }
    };

    const isRestaurant = company.slug === 'restaurante-delicias';

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Mobile Header Nav */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
                    <ChevronLeft className="mr-1 h-5 w-5" />
                    Volver
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="h-5 w-5 text-slate-600" />
                </Button>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 md:py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="aspect-square overflow-hidden rounded-3xl bg-slate-50 border border-slate-100"
                        >
                            <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        </motion.div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {product.categories?.map((cat, idx) => (
                                <Badge key={cat.id || idx} variant="primary">
                                    {cat.name}
                                </Badge>
                            ))}

                            {isRestaurant ? (
                                <Badge variant={product.stock > 0 ? 'success' : 'destructive'}>
                                    {product.stock > 0 ? `Disponible (Stock: ${product.stock})` : 'No disponible'}
                                </Badge>
                            ) : company.features?.cartEnabled !== false ? (
                                <Badge variant={product.stock > 0 ? 'success' : 'destructive'}>
                                    {product.stock > 0 ? `En stock: ${product.stock}` : 'Sin stock'}
                                </Badge>
                            ) : (
                                <Badge variant={product.stock > 0 ? 'success' : 'destructive'}>
                                    {product.stock > 0 ? `Disponible: ${product.stock}` : 'No disponible'}
                                </Badge>
                            )}

                            {product.rating > 0 && (
                                <StarRating
                                    rating={product.rating}
                                    count={product.reviews?.length}
                                    size={14}
                                    onClick={() => setIsReviewsOpen(true)}
                                />
                            )}
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{product.name}</h1>
                        <p className="text-sm font-mono text-slate-400 mt-2">SKU: {product.sku}</p>

                        <div className="mt-6">
                            <p className="text-3xl font-bold text-emerald-600">
                                {formatCurrency(product.price)}
                                <span className="text-sm text-slate-400 font-medium ml-2 font-normal">x unidad</span>
                            </p>

                            {product.wholesale_prices && product.wholesale_prices.length > 0 && (
                                <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100 inline-block min-w-[300px]">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Escala de Precios</p>
                                    <div className="space-y-2">
                                        {product.wholesale_prices.sort((a, b) => a.min_qty - b.min_qty).map((tier, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-700 font-bold">
                                                        {tier.min_qty} o más unidades
                                                    </span>
                                                    {tier.label && (
                                                        <span className="text-xs text-slate-400 font-normal capitalize">{tier.label}</span>
                                                    )}
                                                </div>
                                                <span className="font-bold text-emerald-600 text-base">{formatCurrency(tier.price)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 space-y-6">
                            <div className="prose prose-slate max-w-none">
                                <h4 className="text-lg font-semibold text-slate-800">Descripción</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    {product.description}
                                </p>
                            </div>

                            {/* Specs */}
                            <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-100">
                                <div className="flex items-center space-x-3 text-slate-600">
                                    {isRestaurant ? (
                                        <Utensils className="h-5 w-5 text-slate-400" />
                                    ) : company.features?.cartEnabled !== false ? (
                                        <Package className="h-5 w-5 text-slate-400" />
                                    ) : (
                                        <Utensils className="h-5 w-5 text-slate-400" />
                                    )}
                                    <div>
                                        <p className="text-xs font-medium uppercase text-slate-400">
                                            {isRestaurant ? 'Tipo' : company.features?.cartEnabled !== false ? 'Tamaño' : 'Tipo'}
                                        </p>
                                        <p className="text-sm font-semibold">{product.size}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-slate-600">
                                    {isRestaurant ? (
                                        <Package className="h-5 w-5 text-slate-400" />
                                    ) : company.features?.cartEnabled !== false ? (
                                        <Truck className="h-5 w-5 text-slate-400" />
                                    ) : (
                                        <Package className="h-5 w-5 text-slate-400" />
                                    )}
                                    <div>
                                        <p className="text-xs font-medium uppercase text-slate-400">
                                            {isRestaurant ? 'Porción' : company.features?.cartEnabled !== false ? 'Peso' : 'Porción'}
                                        </p>
                                        <p className="text-sm font-semibold">{product.weight}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity and CTA */}
                            {isRestaurant ? (
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                            <Utensils className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-900 text-sm">Disponible en el local</h4>
                                            <p className="text-xs text-emerald-700">Visítanos para disfrutar de este plato.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : company.features?.cartEnabled !== false ? (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex h-12 items-center rounded-xl border border-slate-200 px-2">
                                            <button
                                                className="px-3 text-xl font-medium text-slate-500 hover:text-primary-600"
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-bold text-slate-800">{quantity}</span>
                                            <button
                                                className="px-3 text-xl font-medium text-slate-500 hover:text-primary-600"
                                                onClick={() => setQuantity(quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <Button size="lg" className="flex-1 h-12 shadow-md shadow-primary-200" onClick={handleAddToCart}>
                                            <ShoppingCart className="mr-2 h-5 w-5" />
                                            Añadir al carrito
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-center space-x-4 pt-4 text-xs text-slate-400 font-medium uppercase">
                                        <div className="flex items-center">
                                            <ShieldCheck className="mr-1 h-4 w-4 text-emerald-500" />
                                            Compra Segura
                                        </div>
                                        <div className="flex items-center">
                                            <ShieldCheck className="mr-1 h-4 w-4 text-emerald-500" />
                                            Garantía Original
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 italic">
                                        Modo catálogo: Consulta disponibilidad directamente en el local.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reviews Section at the bottom */}
                <div id="reviews" className="mt-16 pt-12 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                <User className="text-primary-600" size={24} /> Opiniones de Clientes
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <StarRating rating={product.rating} count={product.reviews?.length} size={16} />
                                <span className="text-sm font-bold text-slate-400">({product.reviews?.length || 0} valoraciones)</span>
                            </div>
                        </div>
                    </div>

                    {product.reviews && product.reviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {product.reviews.map(review => (
                                <div key={review.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                                                <User size={20} className="text-slate-300" />
                                            </div>
                                            <div>
                                                <span className="font-black text-slate-900 text-sm block uppercase tracking-tight">{review.user}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{review.date}</span>
                                            </div>
                                        </div>
                                        <StarRating rating={review.rating} size={12} />
                                    </div>
                                    <p className="text-slate-600 text-sm italic leading-relaxed">"{review.comment}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center text-slate-400">
                            <p className="font-bold uppercase tracking-widest text-sm">Este producto aún no tiene reseñas</p>
                            <p className="text-xs mt-1">¡Sé el primero en compartir tu experiencia!</p>
                        </div>
                    )}
                </div>

                {/* Write Review Section */}
                <div id="write-review" className="mt-12 bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Utensils className="text-primary-600" size={20} />
                        Deja tu opinión sobre este producto
                    </h3>

                    {!user ? (
                        <div className="text-center py-8">
                            <Button onClick={() => navigate('/login')} variant="secondary">
                                Inicia sesión para opinar
                            </Button>
                        </div>
                    ) : hasReviewed ? (
                        <div className="text-center py-8 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-emerald-700 font-medium">¡Ya has opinado sobre este producto! Gracias.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-sm font-medium text-slate-500">Tu calificación</span>
                                <StarRating
                                    interactive
                                    rating={tempReview.rating}
                                    size={32}
                                    onRate={(val) => setTempReview(prev => ({ ...prev, rating: val }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tu comentario</label>
                                <textarea
                                    value={tempReview.comment}
                                    onChange={(e) => setTempReview(prev => ({ ...prev, comment: e.target.value }))}
                                    className="w-full rounded-xl border-slate-200 focus:border-primary-500 focus:ring-primary-500 min-h-[120px]"
                                    placeholder="¿Qué te pareció el producto?"
                                />
                            </div>

                            <Button
                                onClick={handleSubmitReview}
                                disabled={tempReview.rating === 0}
                                className="w-full"
                            >
                                Publicar Opinión
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews Modal - Kept for consistency but now users can also scroll to the section */}
            <Modal
                isOpen={isReviewsOpen}
                onClose={() => setIsReviewsOpen(false)}
                title={`Opiniones de ${product.name} `}
            >
                <div className="space-y-6 p-4 sm:p-6">
                    <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-3xl font-bold text-slate-900">{product.rating}</p>
                            <StarRating rating={product.rating} count={product.reviews?.length} size={14} />
                        </div>
                        <div className="text-right text-xs text-slate-400 font-medium uppercase">
                            Calificación Promedio
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {product.reviews?.map(review => (
                            <div key={review.id} className="border border-slate-100 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <User size={18} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800 text-sm block">{review.user}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{review.date}</span>
                                        </div>
                                    </div>
                                    <StarRating rating={review.rating} size={12} />
                                </div>
                                <p className="text-slate-600 text-sm italic leading-relaxed pl-12">"{review.comment}"</p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2">
                        <Button
                            variant="primary"
                            className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary-200/50"
                            onClick={() => setIsReviewsOpen(false)}
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
