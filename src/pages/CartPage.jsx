import { Trash2, Plus, Minus, Send, Link, ChevronLeft, ShoppingCart, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { COMPANIES } from '../data/mock';

export default function CartPage() {
    const { carts, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
    const navigate = useNavigate();

    const companyIds = Object.keys(carts);
    const hasItems = companyIds.some(id => carts[id].length > 0);

    const handleSendWhatsApp = (companyId) => {
        const cartItems = carts[companyId];
        const company = COMPANIES.find(c => c.id === companyId);
        if (!company || !cartItems || cartItems.length === 0) return;

        const { totalPrice } = getCartTotal(companyId);

        const baseUrl = window.location.origin;

        let message = `*Hola ${company.name}, me gustaría cotizar lo siguiente*\n\n`;
        message += `--------------------------------\n`;

        cartItems.forEach((item, index) => {
            const productUrl = `${baseUrl}/catalogo/${company.slug}/producto/${item.slug}`;
            message += `${index + 1}. *${item.name}* (SKU: ${item.sku || 'N/A'})\n`;
            message += `   Cant: ${item.quantity} x ${formatCurrency(item.price)}\n`;
            message += `   Subtotal: ${formatCurrency(item.price * item.quantity)}\n`;
            message += `   Ver: ${productUrl}\n\n`;
        });

        message += `--------------------------------\n`;
        message += `*Total estimado: ${formatCurrency(totalPrice)}*\n\n`;
        message += `_Enviado desde mi catálogo digital_`;

        const link = generateWhatsAppLink(company.whatsapp, message);
        window.open(link, '_blank');
    };

    if (!hasItems) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
                <div className="mb-6 rounded-full bg-slate-100 p-8">
                    <ShoppingCart className="h-12 w-12 text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Tu carrito está vacío</h2>
                <p className="mt-2 text-slate-500">Agrega productos desde el catálogo para cotizar.</p>
                <Button className="mt-8" onClick={() => navigate('/')}>
                    Ir al catálogo
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-8">Carrito de Cotización</h1>

                {companyIds.map(companyId => {
                    const cartItems = carts[companyId];
                    if (cartItems.length === 0) return null;

                    const company = COMPANIES.find(c => c.id === companyId);
                    const { totalPrice, totalItems } = getCartTotal(companyId);

                    return (
                        <div key={companyId} className="mb-12 border-b border-slate-200 pb-12 last:border-0">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                                        {company ? (
                                            <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Store className="text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">{company?.name || 'Tienda Desconocida'}</h2>
                                        <p className="text-xs text-slate-500">{totalItems} productos</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearCart(companyId)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    Vaciar esta tienda
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                                {/* Cart Items */}
                                <div className="lg:col-span-2 space-y-4">
                                    {cartItems.map((item) => (
                                        <Card key={item.id} className="border-none shadow-sm overflow-hidden">
                                            <CardContent className="p-0">
                                                <div className="flex items-center p-4">
                                                    <img
                                                        src={item.images[0]}
                                                        alt={item.name}
                                                        className="h-20 w-20 rounded-xl object-cover"
                                                    />
                                                    <div className="ml-4 flex-1">
                                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {item.sku || 'N/A'}</p>
                                                        <p className="text-sm font-semibold text-primary-600 mt-1">{formatCurrency(item.price)}</p>

                                                        <div className="flex items-center justify-between mt-3">
                                                            <div className="flex h-8 items-center rounded-lg border border-slate-200">
                                                                <button
                                                                    className="px-2 text-slate-500 hover:text-primary-600"
                                                                    onClick={() => updateQuantity(companyId, item.id, item.quantity - 1)}
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </button>
                                                                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                                                <button
                                                                    className="px-2 text-slate-500 hover:text-primary-600"
                                                                    onClick={() => updateQuantity(companyId, item.id, item.quantity + 1)}
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <button
                                                                className="p-2 text-red-400 hover:text-red-600"
                                                                onClick={() => removeFromCart(companyId, item.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Summary / Sidebar */}
                                <div className="lg:col-span-1">
                                    <Card className="border-none shadow-md bg-white">
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">Resumen {company?.name}</h3>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Productos ({totalItems})</span>
                                                    <span className="font-semibold">{formatCurrency(totalPrice)}</span>
                                                </div>
                                                <div className="pt-4 border-t border-slate-100 flex justify-between">
                                                    <span className="text-lg font-bold">Total estimado</span>
                                                    <span className="text-lg font-bold text-primary-600">{formatCurrency(totalPrice)}</span>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary-100 bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => handleSendWhatsApp(companyId)}
                                            >
                                                <Send className="mr-2 h-5 w-5" />
                                                Cotizar con {company?.name}
                                            </Button>

                                            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 italic">
                                                <p className="text-xs text-slate-500 text-center">
                                                    "Serás redirigido a WhatsApp con un mensaje pre-armado."
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
