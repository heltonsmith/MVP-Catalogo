import { Check, X, Rocket, Shield, Zap, MessageCircle, QrCode, Globe, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { Loader2 } from 'lucide-react';

export default function PricingPage() {
    const { getSetting, loading } = useSettings();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            </div>
        );
    }

    const freeProductLimit = getSetting('free_plan_product_limit', '5');
    const freeImageLimit = getSetting('free_plan_image_limit', '1');
    const plusProductLimit = getSetting('plus_plan_product_limit', '100');
    const plusImageLimit = getSetting('plus_plan_image_limit', '5');
    const proProductLimit = getSetting('pro_plan_product_limit', '500');
    const proImageLimit = getSetting('pro_plan_image_limit', '5');
    const customProductLimit = getSetting('custom_plan_product_limit', '1000');
    const customImageLimit = getSetting('custom_plan_image_limit', '10');

    const plusPriceMonthly = parseInt(getSetting('plus_plan_price_monthly', '9990'));
    const plusPriceSemester = parseInt(getSetting('plus_plan_price_semester', '8500'));
    const plusPriceAnnual = parseInt(getSetting('plus_plan_price_annual', '7000'));
    const proPriceMonthly = parseInt(getSetting('pro_plan_price_monthly', '19990'));
    const proPriceSemester = parseInt(getSetting('pro_plan_price_semester', '18000'));
    const proPriceAnnual = parseInt(getSetting('pro_plan_price_annual', '16000'));

    const plans = [
        {
            name: 'Gratis',
            price: '$0',
            icon: <Rocket className="text-secondary-500" size={24} />,
            description: 'Ideal para probar la plataforma y empezar tu presencia digital.',
            features: [
                { text: `Hasta ${freeProductLimit} productos`, included: true },
                { text: `${freeImageLimit} foto por producto`, included: true },
                { text: 'Redes sociales vinculadas', included: true },
                { text: 'Dashboard básico', included: true },
                { text: 'Chat interno', included: false },
                { text: 'Cotizaciones por WhatsApp', included: false },
                { text: 'Código QR para compartir', included: false },
                { text: 'Sin soporte', included: false },
            ],
            cta: 'Empezar ya',
            link: '/registro',
            variant: 'secondary'
        },
        {
            name: 'Plus',
            price: `$${plusPriceMonthly.toLocaleString('es-CL')}`,
            period: '/mes',
            icon: <Zap className="text-primary-600 fill-primary-600" size={24} />,
            badge: 'Más popular',
            description: 'Para negocios en crecimiento que necesitan más capacidad.',
            features: [
                { text: `Hasta ${plusProductLimit} productos`, included: true },
                { text: `Hasta ${plusImageLimit} fotos por producto`, included: true },
                { text: 'Redes sociales vinculadas', included: true },
                { text: 'Dashboard avanzado', included: true },
                { text: 'Chat interno integrado', included: true },
                { text: 'Cotizaciones WhatsApp', included: true },
                { text: 'Código QR personalizado', included: true },
                { text: 'Soporte prioritario', included: true },
            ],
            cta: 'Elegir Plus',
            link: '/registro',
            variant: 'primary'
        },
        {
            name: 'Pro',
            price: `$${proPriceMonthly.toLocaleString('es-CL')}`,
            period: '/mes',
            icon: <Sparkles className="text-amber-500 fill-amber-500" size={24} />,
            description: 'Máxima potencia para grandes inventarios y presencia profesional.',
            features: [
                { text: `Hasta ${proProductLimit} productos`, included: true },
                { text: `Hasta ${proImageLimit} fotos por producto`, included: true },
                { text: 'Redes sociales vinculadas', included: true },
                { text: 'Dashboard avanzado', included: true },
                { text: 'Chat interno integrado', included: true },
                { text: 'Cotizaciones WhatsApp', included: true },
                { text: 'Código QR personalizado', included: true },
                { text: 'Soporte prioritario avanzado', included: true },
            ],
            cta: 'Elegir Pro',
            link: '/registro',
            variant: 'secondary',
            isSpecial: true
        },
        {
            name: 'Personalizado',
            price: 'Custom',
            icon: <Shield className="text-slate-800 fill-slate-800" size={24} />,
            description: 'Soluciones a medida para grandes empresas y emprendimientos.',
            features: [
                { text: `Más de ${customProductLimit} productos`, included: true },
                { text: `Hasta ${customImageLimit} fotos por producto`, included: true },
                { text: 'Soporte dedicado 24/7', included: true },
                { text: 'Funciones a medida', included: true },
                { text: 'Múltiples sucursales', included: true },
                { text: 'Soporte prioritario 24x7', included: true },
            ],
            cta: 'Contactar',
            link: `https://wa.me/56912345678?text=${encodeURIComponent('Hola, me interesa el Plan Personalizado para mi empresa.')}`,
            variant: 'outline',
            isExternal: true
        }
    ];

    const plusOffers = [
        { period: 'Mensual', price: `$${plusPriceMonthly.toLocaleString('es-CL')}/mes`, total: `$${(plusPriceMonthly * 12).toLocaleString('es-CL')}/año`, savings: null },
        { period: 'Cada 6 meses', price: `$${plusPriceSemester.toLocaleString('es-CL')}/mes`, total: `$${(plusPriceSemester * 6).toLocaleString('es-CL')}/6 meses`, savings: `Ahorras $${((plusPriceMonthly - plusPriceSemester) * 6).toLocaleString('es-CL')}` },
        { period: 'Por 1 año', price: `$${plusPriceAnnual.toLocaleString('es-CL')}/mes`, total: `$${(plusPriceAnnual * 12).toLocaleString('es-CL')}/año`, savings: `Ahorras $${((plusPriceMonthly - plusPriceAnnual) * 12).toLocaleString('es-CL')}` },
    ];

    const proOffers = [
        { period: 'Mensual', price: `$${proPriceMonthly.toLocaleString('es-CL')}/mes`, total: `$${(proPriceMonthly * 12).toLocaleString('es-CL')}/año`, savings: null },
        { period: 'Cada 6 meses', price: `$${proPriceSemester.toLocaleString('es-CL')}/mes`, total: `$${(proPriceSemester * 6).toLocaleString('es-CL')}/6 meses`, savings: `Ahorras $${((proPriceMonthly - proPriceSemester) * 6).toLocaleString('es-CL')}` },
        { period: 'Por 1 año', price: `$${proPriceAnnual.toLocaleString('es-CL')}/mes`, total: `$${(proPriceAnnual * 12).toLocaleString('es-CL')}/año`, savings: `Ahorras $${((proPriceMonthly - proPriceAnnual) * 12).toLocaleString('es-CL')}` },
    ];

    return (
        <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">Precios</h2>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl lg:text-5xl">
                        Elige el plan perfecto para tu negocio
                    </p>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500">
                        Precios de lanzamiento exclusivos. Únete hoy a la revolución de los catálogos digitales.
                    </p>
                </div>

                {/* Demo Notice */}
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 mb-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left max-w-3xl mx-auto">
                    <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                        <Sparkles className="text-teal-600" size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-teal-800">
                            ¡Prueba gratis! Solicita una cuenta <span className="font-black">Demo por {getSetting('demo_plan_days', '7')} días</span> y conoce todas las funciones premium sin costo.
                        </p>
                        <p className="text-xs text-teal-600 mt-0.5">Disponible una única vez por tienda.</p>
                    </div>
                </div>

                {/* Launch Offers Banner */}
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-16 border border-primary-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-50 rounded-full opacity-50" />
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Rocket className="text-primary-600" />
                                    Ofertas Plan PLUS
                                </h3>
                                <p className="text-slate-500 mt-2">Para negocios que necesitan hasta 100 productos.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                                {plusOffers.map((offer) => (
                                    <div key={offer.period} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center flex flex-col justify-center gap-1">
                                        <p className="text-sm text-slate-500 font-medium">{offer.period}</p>
                                        <p className="text-2xl font-bold text-primary-600 leading-none">{offer.price}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{offer.total}</p>
                                        {offer.savings && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                                                {offer.savings}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full mb-8" />

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Zap className="text-amber-500" />
                                    Ofertas Plan PRO
                                </h3>
                                <p className="text-slate-500 mt-2">Para inventarios grandes de hasta 500 productos.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                                {proOffers.map((offer) => (
                                    <div key={offer.period} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center flex flex-col justify-center gap-1">
                                        <p className="text-sm text-slate-500 font-medium">{offer.period}</p>
                                        <p className="text-2xl font-bold text-amber-600 leading-none">{offer.price}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{offer.total}</p>
                                        {offer.savings && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                                                {offer.savings}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`relative flex flex-col bg-white rounded-3xl shadow-lg border ${plan.badge ? 'border-primary-200 ring-2 ring-primary-50' : plan.isSpecial ? 'border-amber-200 ring-2 ring-amber-50' : 'border-slate-100'}`}>
                            {plan.badge && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    {plan.badge}
                                </div>
                            )}
                            <div className="p-8 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-slate-50 rounded-xl">
                                        {plan.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                                </div>
                                <div className="mt-4 flex items-baseline">
                                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">{plan.price}</span>
                                    {plan.period && <span className="ml-1 text-xl font-semibold text-slate-500">{plan.period}</span>}
                                </div>
                                <p className="mt-4 text-slate-500 text-sm">{plan.description}</p>

                                <ul className="mt-8 space-y-4 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <div className="flex-shrink-0">
                                                {feature.included ? (
                                                    <Check className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <X className="h-5 w-5 text-slate-300" />
                                                )}
                                            </div>
                                            <p className={`ml-3 text-sm ${feature.included ? 'text-slate-600' : 'text-slate-400 line-through'}`}>
                                                {feature.text}
                                            </p>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-10">
                                    {plan.isExternal ? (
                                        <a href={plan.link} target="_blank" rel="noopener noreferrer">
                                            <Button
                                                variant={plan.variant}
                                                className="w-full h-12 text-lg font-bold rounded-xl"
                                            >
                                                {plan.cta}
                                            </Button>
                                        </a>
                                    ) : (
                                        <Link to={plan.link}>
                                            <Button
                                                variant={plan.variant}
                                                className="w-full h-12 text-lg font-bold rounded-xl"
                                            >
                                                {plan.cta}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-slate-500">¿Tienes dudas? Consulta nuestra sección de <Link to="/ayuda" className="text-primary-600 font-bold hover:underline">Ayuda</Link></p>
                </div>
            </div>
        </div>
    );
}
