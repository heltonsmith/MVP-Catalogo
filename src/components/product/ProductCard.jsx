import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Star, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils';
import { useCart } from '../../hooks/useCart';

export function ProductCard({ product, companySlug, cartEnabled = true, isDemo = false }) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const mainImage = product.images[0];

    const getLink = () => {
        const baseLink = `/catalogo/${companySlug}/producto/${product.slug}`;
        return isDemo ? `${baseLink}?mode=demo` : baseLink;
    };

    const handleAddToCart = () => {
        if (cartEnabled) {
            addToCart(product, quantity);
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
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        {cartEnabled ? (
                            <Badge variant="success">Stock: {product.stock}</Badge>
                        ) : (
                            <Badge variant={product.stock > 0 ? 'success' : 'destructive'}>
                                {product.stock > 0 ? 'Disponible' : 'No disponible'}
                            </Badge>
                        )}
                        {product.rating && (
                            <div className="flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg ring-1 ring-white/10">
                                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                <span>{product.rating}</span>
                                <span className="text-[8px] text-slate-300 border-l border-white/20 pl-1 ml-0.5 font-medium">{product.reviews?.length || 0}</span>
                            </div>
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
                <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(product.price)}
                    </span>
                    {product.weight && (
                        <span className="text-xs text-slate-400 font-medium">{product.weight}</span>
                    )}
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
