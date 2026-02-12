import { Check, X, Rocket, Shield, Zap, MessageCircle, QrCode, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function PricingPage() {
    const plans = [
        {
            name: 'Gratis',
            price: '$0',
            description: 'Ideal para probar la plataforma y empezar tu presencia digital.',
            features: [
                { text: 'Máximo 5 productos', included: true },
                { text: '1 foto por producto', included: true },
                { text: 'Redes sociales vinculadas', included: true },
                { text: 'Dashboard básico', included: true },
                { text: 'Chat interno', included: false },
                { text: 'Enlaces a tu web propia', included: false },
                { text: 'Cotizaciones por WhatsApp', included: false },
                { text: 'Código QR para compartir', included: false },
                { text: 'Sistema de mensajería interna', included: false },
                { text: 'Ocultar branding en móvil', included: false },
            ],
            cta: 'Empezar ya',
            link: '/registro',
            variant: 'secondary'
        },
        {
            name: 'Pro',
            price: '$9.990',
            period: '/mes',
            badge: 'Más popular',
            description: 'Todas las herramientas para escalar tu negocio y profesionalizar tu marca.',
            features: [
                { text: 'Productos ilimitados', included: true },
                { text: 'Fotos ilimitadas por producto', included: true },
                { text: 'Redes sociales vinculadas', included: true },
                { text: 'Dashboard avanzado', included: true },
                { text: 'Chat interno integrado', included: true },
                { text: 'Enlace a tu sitio web', included: true },
                { text: 'Cotizaciones directas WhatsApp', included: true },
                { text: 'Código QR personalizado', included: true },
                { text: 'Mensajería interna con clientes', included: true },
                { text: 'Modo Landing Page (vía /landing)', included: true },
            ],
            cta: 'Subir a Pro',
            link: '/registro',
            variant: 'primary'
        }
    ];

    const launchOffers = [
        { period: 'Mensual', price: '$9.990', savings: null },
        { period: 'Cada 6 meses', price: '$8.500', savings: 'Ahorras 15%' },
        { period: 'Por 1 año', price: '$6.500', savings: 'Ahorras 35%' },
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

                {/* Launch Offers Banner */}
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-16 border border-primary-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-50 rounded-full opacity-50" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Rocket className="text-primary-600" />
                                Ofertas de Lanzamiento PRO
                            </h3>
                            <p className="text-slate-500 mt-2">Aprovecha nuestras tarifas especiales por tiempo limitado.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                            {launchOffers.map((offer) => (
                                <div key={offer.period} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-sm text-slate-500 font-medium">{offer.period}</p>
                                    <p className="text-2xl font-bold text-primary-600">{offer.price}</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`relative flex flex-col bg-white rounded-3xl shadow-lg border ${plan.badge ? 'border-primary-200 ring-2 ring-primary-50' : 'border-slate-100'}`}>
                            {plan.badge && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    {plan.badge}
                                </div>
                            )}
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                                <div className="mt-4 flex items-baseline">
                                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">{plan.price}</span>
                                    {plan.period && <span className="ml-1 text-xl font-semibold text-slate-500">{plan.period}</span>}
                                </div>
                                <p className="mt-4 text-slate-500">{plan.description}</p>

                                <ul className="mt-8 space-y-4">
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
                                    <Link to={plan.link}>
                                        <Button
                                            variant={plan.variant}
                                            className="w-full h-12 text-lg font-bold rounded-xl"
                                        >
                                            {plan.cta}
                                        </Button>
                                    </Link>
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
