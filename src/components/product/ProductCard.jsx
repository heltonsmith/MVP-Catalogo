import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Star, Plus, Minus, Check } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatProductPrice } from '../../utils';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../ui/Toast';
import { StarRating } from '../ui/StarRating';

export function ProductCard({ product, companySlug, cartEnabled = true, isDemo = false, onReviewClick, isOwner = false }) {
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const [quantity, setQuantity] = useState(1);
    const mainImage = product.images?.[0] || product.image || 'https://placehold.co/600x600?text=Sin+Imagen';

    const getLink = () => {
        const baseLink = `/catalogo/${companySlug}/producto/${product.slug}`;
        return isDemo ? `${baseLink}?mode=demo` : baseLink;
    };

    const handleAddToCart = () => {
        if (cartEnabled) {
            if (isOwner) {
                showToast("No puedes agregar tus propios productos al carrito", "warning");
                return;
            }
            if (!product.available) {
                showToast("Este producto no está disponible actualmente", "info");
                return;
            }
            addToCart(product, quantity);
            showToast(`✅ ${product.name} (x${quantity}) agregado al carrito`, 'success');
            setQuantity(1);
        }
    };

    return (
        <Card className="group flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Link to={getLink()} className="block">
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img
                        src={mainImage}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                        {product.business_type === 'restaurant' || product.company?.business_type === 'restaurant' ? (
                            <Badge variant={product.available ? 'success' : 'destructive'}>
                                {product.available ? 'Disponible' : 'No disponible'}
                            </Badge>
                        ) : cartEnabled ? (
                            <Badge variant="success">Stock: {product.stock}</Badge>
                        ) : (
                            <Badge variant={product.available ? 'success' : 'destructive'}>
                                {product.available ? 'Disponible' : 'No disponible'}
                            </Badge>
                        )}
                        {product.rating !== undefined && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onReviewClick?.();
                                }}
                                className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 shadow-xl cursor-pointer hover:bg-slate-900 transition-all hover:scale-105 active:scale-95 group/stars"
                                title={`${product.reviews?.length || 0} opiniones`}
                            >
                                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                <span className="text-[11px] font-black text-white">{product.rating}</span>
                                <span className="text-[9px] text-slate-400 border-l border-white/20 pl-1.5 ml-0.5 font-bold uppercase tracking-tight">
                                    {product.reviews?.length || 0}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </Link>

            <CardContent className="flex-1 p-4">
                <Link to={getLink()}>
                    <h4 className="line-clamp-2 text-sm font-semibold text-slate-800 h-10 mb-1 hover:text-primary-600 transition-colors">
                        {product.name}
                    </h4>
                </Link>
                <div className="flex items-start justify-between mt-2">
                    <div className="flex flex-col w-full">
                        <span className="text-lg font-bold text-primary-600">
                            {formatProductPrice(product.price)}
                        </span>
                        {product.wholesale_prices && product.wholesale_prices.length > 0 && (
                            <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-100 pt-1 w-full">
                                {product.wholesale_prices.sort((a, b) => a.min_qty - b.min_qty).slice(0, 3).map((tier, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-500 font-medium">{tier.min_qty}+ un.</span>
                                        <span className="font-bold text-emerald-600">{formatProductPrice(tier.price)}</span>
                                    </div>
                                ))}
                                {product.wholesale_prices.length > 3 && (
                                    <span className="text-[9px] text-slate-400 italic text-right">Ver más...</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex-col gap-3">
                {cartEnabled && (
                    <>
                        <div className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-1">
                            <button
                                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-primary-600 transition-colors"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Minus size={14} />
                            </button>
                            <span className="text-xs font-bold text-slate-700">{quantity}</span>
                            <button
                                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-primary-600 transition-colors"
                                onClick={() => setQuantity(quantity + 1)}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </>
                )}

                <div className="flex w-full gap-2">
                    <Link
                        to={getLink()}
                        className="flex-1"
                    >
                        <Button variant="secondary" size="sm" className="w-full font-bold">
                            <Eye className="mr-2 h-4 w-4" />
                            {cartEnabled ? 'Ver' : 'Ver detalles'}
                        </Button>
                    </Link>
                    {cartEnabled && (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={handleAddToCart}
                            className="px-3 shadow-md shadow-primary-200"
                        >
                            <ShoppingCart className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
