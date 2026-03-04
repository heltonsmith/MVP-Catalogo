import { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, Send, ChevronLeft, ShoppingCart, Store, Loader2, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatProductPrice, generateWhatsAppLink, cleanTextInput, titleCase, cn } from '../utils';
import { COMPANIES } from '../data/mock';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

export default function CartPage() {
    const { carts, updateQuantity, removeFromCart, clearCart, getCartTotal, companyInfo, getEffectivePrice } = useCart();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [customerInfo, setCustomerInfo] = useState({ name: '', whatsapp: '' });
    const [isSending, setIsSending] = useState(false);
    const [quoteSuccess, setQuoteSuccess] = useState(false);
    const [whatsappLink, setWhatsappLink] = useState('');
    // Resolved company data from Supabase (fallback)
    const [resolvedCompanies, setResolvedCompanies] = useState({});

    const companyIds = Object.keys(carts);
    const hasItems = companyIds.some(id => carts[id].length > 0);

    // Pre-fill customer info from auth profile
    useEffect(() => {
        if (profile) {
            setCustomerInfo(prev => ({
                name: prev.name || profile.full_name || '',
                whatsapp: prev.whatsapp || (profile.whatsapp || profile.phone || '').replace(/\D/g, '').slice(-9)
            }));
        }
    }, [profile]);

    // Resolve company data from Supabase for IDs not in companyInfo
    useEffect(() => {
        const unresolvedIds = companyIds.filter(id =>
            !companyInfo[id] && !resolvedCompanies[id] && !COMPANIES.find(c => c.id === id)
        );

        if (unresolvedIds.length === 0) return;

        const fetchCompanies = async () => {
            const { data } = await supabase
                .from('companies')
                .select('id, name, slug, whatsapp, logo, user_id, whatsapp_enabled')
                .in('id', unresolvedIds);

            if (data) {
                const map = {};
                data.forEach(c => { map[c.id] = c; });
                setResolvedCompanies(prev => ({ ...prev, ...map }));
            }
        };
        fetchCompanies();
    }, [companyIds.join(',')]);

    // Helper to resolve company from multiple sources
    const getCompany = (companyId) => {
        return companyInfo[companyId] || resolvedCompanies[companyId] || COMPANIES.find(c => c.id === companyId) || null;
    };

    const openQuoteModal = (companyId) => {
        setSelectedCompanyId(companyId);
        setIsModalOpen(true);
    };

    const formatDate = () => {
        const now = new Date();
        return now.toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const handleSendQuote = async () => {
        if (!customerInfo.name?.trim() || !customerInfo.whatsapp?.trim()) {
            showToast("Por favor, completa tus datos", "info");
            return;
        }

        // Final phone validation
        const phoneDigits = customerInfo.whatsapp.replace(/\D/g, '');
        if (phoneDigits.length < 9) {
            showToast("El número de WhatsApp debe tener al menos 9 dígitos", "warning");
            return;
        }

        const companyId = selectedCompanyId;
        const company = getCompany(companyId);

        // Check if store has WhatsApp enabled (default true if undefined)
        if (company && company.whatsapp_enabled === false) {
            showToast("La tienda tiene desconectado el WhatsApp actualmente. Por favor, ponte en contacto vía mensajería interna.", "warning");
            setIsSending(false);
            return;
        }

        setIsSending(true);
        const cartItems = carts[companyId];

        if (!company || !cartItems || cartItems.length === 0) {
            showToast("No se encontró la tienda o el carrito está vacío", "error");
            setIsSending(false);
            return;
        }

        if (user && company && user.id === company.user_id) {
            showToast("No puedes enviarte cotizaciones a ti mismo", "warning");
            setIsSending(false);
            return;
        }

        // Calculate total using wholesale pricing
        const { totalPrice } = getCartTotal(companyId);

        try {
            // 1. Generate WhatsApp Message for actual sending
            const cleanName = titleCase(customerInfo.name.trim().slice(0, 30));
            const cleanPhone = '+56' + customerInfo.whatsapp.replace(/\D/g, '').slice(-9);

            let message = `*Nueva Cotización - ${company.name} (Ktaloog)* \u{1F6D2}\n`;
            message += `-----------\n\n`;
            message += `\u{1F4C5} Fecha: ${formatDate()}\n`;
            message += `\u{1F464} Nombre: ${cleanName}\n`;
            message += `\u{1F4F1} WhatsApp: ${cleanPhone}\n`;
            message += `-----------\n\n`;
            message += `*Cotización:*\n\n`;

            cartItems.forEach((item, index) => {
                const { unitPrice, isWholesale, tierMinQty } = getEffectivePrice(item);
                const subtotal = unitPrice * item.quantity;

                message += `${index + 1}. *${item.name}*\n`;
                message += `   SKU: ${(item.sku && item.show_sku !== false) ? item.sku : 'N/A'}\n`;
                if (isWholesale) {
                    message += `   Cantidad: ${item.quantity} × ${formatProductPrice(unitPrice)} (por mayor, ${tierMinQty}+ un.)\n`;
                } else {
                    message += `   Cantidad: ${item.quantity} × ${formatProductPrice(unitPrice)} (unitario)\n`;
                }
                message += `   Subtotal: ${formatCurrency(subtotal)}\n\n`;
            });

            message += `-----------\n`;
            message += `*\u{1F4B0} Total estimado: ${formatCurrency(totalPrice)}*\n\n`;
            message += `_Enviado desde Ktaloog_`;

            const link = generateWhatsAppLink(company.whatsapp, message);

            // 2. Save to Supabase (Main Quotes table for admin)
            const { data: quote, error: quoteError } = await supabase
                .from('quotes')
                .insert([{
                    company_id: companyId,
                    customer_name: cleanName,
                    customer_whatsapp: cleanPhone,
                    total: totalPrice,
                    status: 'pending',
                    customer_id: user?.id || null
                }])
                .select()
                .maybeSingle();

            if (quoteError) throw quoteError;

            // 3. Save Quote Items
            const quoteItemsToCheck = cartItems.map(item => {
                const { unitPrice } = getEffectivePrice(item);
                return {
                    quote_id: quote.id,
                    product_id: item.id,
                    quantity: item.quantity,
                    price_at_time: unitPrice
                };
            });

            const { error: itemsError } = await supabase
                .from('quote_items')
                .insert(quoteItemsToCheck);

            if (itemsError) throw itemsError;

            // 4. Track quote (only for real stores, not demo)
            if (!company.slug?.includes('demo')) {
                try {
                    await supabase.rpc('increment_quotes', { company_id: companyId });
                } catch (error) {
                    console.error('Error tracking quote:', error);
                }
            }

            // 5. Save copy for WhatsApp History (Panel de Cliente)
            if (user) {
                const detailedItems = cartItems.map(item => {
                    const { unitPrice } = getEffectivePrice(item);
                    return {
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: unitPrice,
                        sku: (item.sku && item.show_sku !== false) ? item.sku : 'N/A',
                        image: item.images?.[0]
                    };
                });

                const { data: whatsappQuote, error: whatsappError } = await supabase
                    .from('whatsapp_quotes')
                    .insert([{
                        user_id: user.id,
                        company_id: companyId,
                        customer_name: customerInfo.name,
                        customer_email: customerInfo.email || (user?.email) || '', // Keep email in background if available
                        customer_whatsapp: cleanPhone,
                        content: message,
                        items: detailedItems,
                        total: totalPrice,
                        status: 'pending'
                    }])
                    .select()
                    .maybeSingle();

                if (whatsappError) {
                    console.error('Error saving WhatsApp history:', whatsappError);
                } else if (company.user_id) {
                    // 6. Send notification to the store owner (if enabled in prefs)
                    const prefs = company.notification_prefs || {};
                    const notifyQuote = prefs.notify_quote !== false; // default true
                    if (notifyQuote) {
                        const { error: notifError } = await supabase
                            .from('notifications')
                            .insert([{
                                user_id: company.user_id,
                                type: 'quote',
                                title: 'Nueva Cotización por WhatsApp',
                                content: `${customerInfo.name} ha enviado una cotización de ${formatCurrency(totalPrice)}.`,
                                metadata: {
                                    quote_id: whatsappQuote?.id,
                                    customer_name: customerInfo.name,
                                    customer_email: customerInfo.email,
                                    total: totalPrice,
                                    company_id: companyId,
                                    items_count: cartItems.length
                                }
                            }]);

                        if (notifError) {
                            console.error('Error sending quote notification:', notifError);
                        }
                    }
                }
            }

            clearCart(companyId);
            setCustomerInfo({ name: '', whatsapp: '' });
            setWhatsappLink(link);
            setQuoteSuccess(true); // Don't close modal yet, show success button

            showToast("Cotización registrada con éxito", "success");

        } catch (error) {
            console.error('Error saving quote:', error);
            showToast("Error al registrar la cotización. Intenta nuevamente.", "error");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <div className="bg-slate-50 min-h-screen pb-20">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {!hasItems ? (
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
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-slate-900 mb-8">Carrito de Cotización</h1>

                            {companyIds.map(companyId => {
                                const cartItems = carts[companyId];
                                if (cartItems.length === 0) return null;

                                const company = getCompany(companyId);
                                const { totalPrice, totalItems } = getCartTotal(companyId);

                                return (
                                    <div key={companyId} className="mb-12 border-b border-slate-200 pb-12 last:border-0">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                                                    {company?.logo ? (
                                                        <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Store className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-bold text-slate-900">{company?.name || 'Cargando tienda...'}</h2>
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
                                                {cartItems.map((item) => {
                                                    const { unitPrice, isWholesale, tierMinQty } = getEffectivePrice(item);
                                                    const subtotal = unitPrice * item.quantity;

                                                    return (
                                                        <Card key={item.id} className="border-none shadow-sm overflow-hidden">
                                                            <CardContent className="p-0">
                                                                <div className="flex items-center p-4">
                                                                    <img
                                                                        src={item.images?.[0] || 'https://placehold.co/80x80?text=Sin+Imagen'}
                                                                        alt={item.name}
                                                                        className="h-20 w-20 rounded-xl object-cover"
                                                                    />
                                                                    <div className="ml-4 flex-1">
                                                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                                                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {(item.sku && item.show_sku !== false) ? item.sku : 'N/A'}</p>

                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <p className="text-sm font-semibold text-primary-600">{formatProductPrice(unitPrice)}</p>
                                                                            {isWholesale && (
                                                                                <Badge variant="success" className="text-[9px] px-1.5 py-0">
                                                                                    <Tag size={10} className="mr-0.5" />
                                                                                    Mayorista ({tierMinQty}+ un.)
                                                                                </Badge>
                                                                            )}
                                                                        </div>

                                                                        {!isWholesale && item.wholesale_prices?.length > 0 && (
                                                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                                                💡 Agrega {item.wholesale_prices.sort((a, b) => a.min_qty - b.min_qty)[0].min_qty}+ para precio mayorista
                                                                            </p>
                                                                        )}

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
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-sm font-bold text-slate-700">{formatProductPrice(subtotal)}</span>
                                                                                <button
                                                                                    className="p-2 text-red-400 hover:text-red-600"
                                                                                    onClick={() => removeFromCart(companyId, item.id)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                            </div>

                                            {/* Summary / Sidebar */}
                                            <div className="lg:col-span-1">
                                                <Card className="border-none shadow-md bg-white sticky top-24">
                                                    <CardContent className="p-6">
                                                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">Resumen</h3>

                                                        <div className="space-y-2 mb-4">
                                                            {cartItems.map(item => {
                                                                const { unitPrice, isWholesale } = getEffectivePrice(item);
                                                                return (
                                                                    <div key={item.id} className="flex justify-between text-xs">
                                                                        <span className="text-slate-500 truncate max-w-[60%]">
                                                                            {item.name} ×{item.quantity}
                                                                            {isWholesale && ' 🏷️'}
                                                                        </span>
                                                                        <span className="font-semibold">{formatCurrency(unitPrice * item.quantity)}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="pt-4 border-t border-slate-100 flex justify-between mb-6">
                                                            <span className="text-lg font-bold">Total estimado</span>
                                                            <span className="text-lg font-bold text-primary-600">{formatCurrency(totalPrice)}</span>
                                                        </div>

                                                        <Button
                                                            className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary-100 bg-emerald-600 hover:bg-emerald-700"
                                                            onClick={() => openQuoteModal(companyId)}
                                                        >
                                                            <Send className="mr-2 h-5 w-5" />
                                                            Cotizar con {company?.name || 'tienda'}
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
                        </>
                    )}
                </div>

                {/* Customer Info Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setQuoteSuccess(false);
                    }}
                    title={quoteSuccess ? "¡Listo!" : "Finalizar Cotización"}
                    maxWidth="sm"
                >
                    <div className="p-6">
                        {quoteSuccess ? (
                            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
                                <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                                    <ShoppingCart size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-slate-900">¡Cotización Registrada!</h3>
                                    <p className="text-sm text-slate-500">
                                        Tu pedido ha sido guardado. Ahora presiona el botón de abajo para enviar el detalle a la tienda.
                                    </p>
                                </div>

                                <div className="pt-2 space-y-3">
                                    <a
                                        href={whatsappLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 items-center justify-center gap-2 transition-all active:scale-95"
                                        onClick={() => {
                                            const slug = getCompany(selectedCompanyId)?.slug;
                                            setIsModalOpen(false);
                                            setQuoteSuccess(false);
                                            if (slug) {
                                                navigate(`/catalogo/${slug}`);
                                            } else {
                                                navigate('/');
                                            }
                                        }}
                                    >
                                        <Send size={20} />
                                        Enviar Cotización por WhatsApp
                                    </a>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-slate-400 text-xs font-bold"
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setQuoteSuccess(false);
                                        }}
                                    >
                                        Cerrar sin enviar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="mx-auto h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                                        <Send size={24} />
                                    </div>
                                    <p className="text-sm text-slate-500">Ingresa tus datos para que la tienda te identifique en el mensaje de WhatsApp.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase">Tu Nombre</label>
                                            <span className={cn("text-[10px] font-bold", customerInfo.name.length >= 30 ? "text-rose-500" : "text-slate-400")}>
                                                {customerInfo.name.length}/30
                                            </span>
                                        </div>
                                        <Input
                                            placeholder="Ej: Juan Pérez"
                                            value={customerInfo.name}
                                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value.slice(0, 30) }))}
                                            className="bg-slate-50 border-slate-200"
                                            maxLength={30}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase">Número de WhatsApp</label>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                Formato: +56 9 XXXX XXXX
                                            </span>
                                        </div>
                                        <div className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-50 focus-within:border-emerald-200 transition-all">
                                            <div className="bg-slate-100 flex items-center justify-center px-3 border-r border-slate-200 text-sm font-bold text-slate-500 select-none">
                                                +56
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="9 1234 5678"
                                                value={customerInfo.whatsapp.replace(/\D/g, '').slice(-9)}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                                                    setCustomerInfo(prev => ({ ...prev, whatsapp: val }));
                                                }}
                                                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-slate-400"
                                                maxLength={9}
                                            />
                                            {customerInfo.whatsapp.length > 0 && (
                                                <div className="flex items-center pr-3">
                                                    <span className={cn("text-[10px] font-bold", customerInfo.whatsapp.replace(/\D/g, '').length === 9 ? "text-emerald-500" : "text-slate-400")}>
                                                        {customerInfo.whatsapp.replace(/\D/g, '').length}/9
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-lg shadow-emerald-100"
                                        onClick={handleSendQuote}
                                        disabled={isSending || !customerInfo.name?.trim() || customerInfo.whatsapp?.replace(/\D/g, '').length !== 9}
                                    >
                                        {isSending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Registrando...
                                            </>
                                        ) : (
                                            <>
                                                Confirmar Cotización
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </>
    );
}
