import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Plus, Minus, ChevronRight, Star, ArrowLeft, Share2, Utensils, Truck, Package, ShieldCheck, Heart, Trash2, Pencil, Loader2, ChevronLeft } from 'lucide-react';
import { PRODUCTS, COMPANIES, CATEGORIES } from '../../data/mock';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StarRating } from '../../components/ui/StarRating';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import NotFoundPage from '../NotFoundPage';
import { SEO } from '../../components/layout/SEO';


export default function DemoProductDetailsPage({ overrideSlug }) {
    const { showToast } = useToast();
    const { user, profile } = useAuth();
    const isDemo = true;
    const [isViewOnly, setIsViewOnly] = useState(() => {
        const savedMode = localStorage.getItem('demo_view_only');
        return savedMode === 'true';
    });

    const { productSlug, companySlug: paramSlug } = useParams();
    const companySlug = overrideSlug || paramSlug;
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);
    const { getSetting } = useSettings();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [product, setProduct] = useState(null);
    const [company, setCompany] = useState(null);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [tempReview, setTempReview] = useState({ rating: 0, comment: '' });
    const [editingReview, setEditingReview] = useState(null);

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
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
        };

        fetchProductData();
    }, [productSlug, companySlug]);

    const handleSubmitReview = async () => {
        showToast("Esta es una función de demostración. Tu opinión no se guardará en la base de datos.", "info");
        setTempReview({ rating: 0, comment: '' });
    };

    const handleUpdateReview = async () => {
        showToast("Esta es una función de demostración. Los cambios no se guardarán.", "info");
        setEditingReview(null);
        setTempReview({ rating: 0, comment: '' });
    };

    const handleDeleteReview = async (reviewId) => {
        showToast("Esta es una función de demostración. No puedes eliminar reseñas en el modo demo.", "info");
    };

    const startEditReview = (review) => {
        setEditingReview(review);
        setTempReview({ rating: review.rating, comment: review.comment || '' });
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
        showToast('Esta es una función de demostración. En la versión real, añadiría el producto al carrito.', 'demo');
    };

    const handleShare = () => {
        showToast("Esta es una acción demo: Compartir Producto", "demo");
    };

    const isOwner = false;
    const isRestaurant = company.slug === 'restaurante-delicias';

    return (
        <div className="bg-white min-h-screen pb-20">
            <SEO
                title={`Demo: ${product.name} — ${company.name}`}
                description={`Producto demo "${product.name}" de ${company.name}. ${product.description?.substring(0, 120) || 'Explora este ejemplo de producto en Ktaloog.com.'}`}
                url={`https://www.ktaloog.com/catalogo/${company.slug}/producto/${product.slug}`}
                image={product.images?.[0]}
                keywords={`demo producto, ${product.name}, ${company.name}, ejemplo catálogo digital`}
            />
            {/* Mobile Header Nav */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
                    <ChevronLeft className="mr-1 h-5 w-5" />
                    Volver
                </Button>
                <button
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    title="Compartir"
                >
                    <Share2 className="h-5 w-5 text-slate-600" />
                </button>
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

                        </div>

                        {/* View Only / Menu Mode Logic */}
                        {isViewOnly ? (
                            <div className="pt-4 border-t border-slate-100">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                        <Utensils className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">Modo Carta</h4>
                                        <p className="text-xs text-slate-500">Consulta disponibilidad y realiza tu pedido en el local.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}

                    </div>
                </div>
            </div>

            {/* Reviews Section at the bottom */}
            <div id="reviews" className="mt-16 pt-12 border-t border-slate-100">
                <div className="flex flex-col items-center text-center mb-10">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <User className="text-primary-600" size={24} /> Opiniones de Clientes
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        <StarRating rating={product.rating} count={product.reviews?.length} size={16} />
                        <span className="text-sm font-bold text-slate-400">({product.reviews?.length || 0} valoraciones)</span>
                    </div>
                </div>

                {product.reviews && product.reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {product.reviews.map(review => (
                            <div key={review.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300 group relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
                                            {review.avatar ? (
                                                <img src={review.avatar} alt={review.user} className="h-full w-full object-cover" />
                                            ) : review.user && review.user !== 'Anónimo' ? (
                                                <span className="font-bold text-slate-500 text-lg">{review.user.charAt(0).toUpperCase()}</span>
                                            ) : (
                                                <User size={20} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-black text-slate-900 text-sm block uppercase tracking-tight">{review.user}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{review.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={review.rating} size={12} />
                                        {/* Edit/Delete Actions for Owner - Disabled in Demo */}
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm italic leading-relaxed group-hover:text-slate-900 transition-colors pl-1">
                                    "{review.comment}"
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                        <Star className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Aún no hay opiniones sobre este producto</p>
                        <p className="text-xs text-slate-300 mt-2">¡Sé el primero en calificarlo!</p>
                    </div>
                )}

            </div>
        </div>
    );
}
