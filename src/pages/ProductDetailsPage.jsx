import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Share2, ShieldCheck, Truck, Package, User } from 'lucide-react';
import { PRODUCTS, COMPANIES } from '../data/mock';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StarRating } from '../components/ui/StarRating';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils';
import { useCart } from '../hooks/useCart';
import { motion } from 'framer-motion';

export default function ProductDetailsPage() {
    const { productSlug, companySlug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);

    const product = useMemo(() =>
        PRODUCTS.find(p => p.slug === productSlug),
        [productSlug]);

    const company = useMemo(() =>
        COMPANIES.find(c => c.slug === companySlug),
        [companySlug]);

    if (!product || !company) {
        return <div className="p-20 text-center">Producto o empresa no encontrados</div>;
    }

    const handleAddToCart = () => {
        addToCart(product, quantity);
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Mobile Header Nav */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
                    <ChevronLeft className="mr-1 h-5 w-5" />
                    Volver
                </Button>
                <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5 text-slate-600" />
                </Button>
            </div>

            <div className="container mx-auto px-4 py-6 md:py-12">
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
                        <div className="flex items-center space-x-2 mb-4">
                            <Badge variant="primary">{product.categoryId}</Badge>
                            <Badge variant="success">En stock</Badge>
                            {product.rating && (
                                <StarRating
                                    rating={product.rating}
                                    count={product.reviews?.length}
                                    size={14}
                                    onClick={() => setIsReviewsOpen(true)}
                                />
                            )}
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{product.name}</h1>
                        {/* ... rest of product info ... */}
                        <p className="text-sm font-mono text-slate-400 mt-2">SKU: {product.sku}</p>

                        <p className="mt-6 text-3xl font-bold text-primary-600">
                            {formatCurrency(product.price)}
                        </p>

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
                                    <Package className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-medium uppercase text-slate-400">Tamaño</p>
                                        <p className="text-sm font-semibold">{product.size}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-slate-600">
                                    <Truck className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-medium uppercase text-slate-400">Peso</p>
                                        <p className="text-sm font-semibold">{product.weight}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity and CTA */}
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
                        </div>
                    </div>
                </div>

                {/* Product Reviews Section */}
                <div className="mt-20 border-t border-slate-100 pt-12">
                    <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Valoraciones del producto</h3>
                    <div className="max-w-3xl mx-auto space-y-6">
                        {product.reviews?.map(review => (
                            <div key={review.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4">
                                <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                                    <User size={24} className="text-slate-300" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-slate-900">{review.user}</h4>
                                        <StarRating rating={review.rating} size={12} />
                                    </div>
                                    <p className="text-slate-500 text-xs mb-3">{review.date}</p>
                                    <p className="text-slate-600 italic">"{review.comment}"</p>

                                    <div className="mt-4 flex gap-4 border-t border-slate-200 pt-3">
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Calidad: ⭐⭐⭐⭐⭐</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Envío: ⭐⭐⭐⭐⭐</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Responsabilidad: ⭐⭐⭐⭐⭐</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews Modal */}
            <Modal
                isOpen={isReviewsOpen}
                onClose={() => setIsReviewsOpen(false)}
                title={`Opiniones de ${product.name}`}
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-3xl font-bold text-slate-900">{product.rating}</p>
                            <StarRating rating={product.rating} count={product.reviews?.length} size={14} />
                        </div>
                        <div className="text-right text-xs text-slate-400 font-medium uppercase">
                            Calificación Promedio
                        </div>
                    </div>

                    <div className="space-y-4">
                        {product.reviews?.map(review => (
                            <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 hover:bg-slate-50/50 p-2 rounded-xl transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User size={16} className="text-slate-400" />
                                        </div>
                                        <span className="font-bold text-slate-800 text-sm">{review.user}</span>
                                    </div>
                                    <StarRating rating={review.rating} size={10} />
                                </div>
                                <p className="text-xs text-slate-400 mb-1">{review.date}</p>
                                <p className="text-slate-600 text-sm italic">"{review.comment}"</p>
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => setIsReviewsOpen(false)}
                    >
                        Cerrar
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
