import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Smartphone, Zap, ShoppingBag, Store, Utensils } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';

export default function LandingPage() {
    const benefits = [
        {
            title: 'Plan Gratis de por vida',
            description: 'Sube hasta 5 productos y ten tu catálogo profesional sin pagar un peso.',
            icon: <CheckCircle className="text-primary-600" />,
        },
        {
            title: 'Mobile First',
            description: 'Diseñado específicamente para verse increíble en teléfonos móviles.',
            icon: <Smartphone className="text-primary-600" />,
        },
        {
            title: 'Venta por WhatsApp',
            description: 'Recibe cotizaciones y pedidos directamente en tu chat personal.',
            icon: <ShoppingBag className="text-primary-600" />,
        },
    ];

    return (
        <div className="flex flex-col overflow-hidden">
            {/* Hero Section */}
            <section className="relative bg-slate-50 py-20 lg:py-32 overflow-x-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-3xl"
                        >
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
                                Tu catálogo digital <span className="text-primary-600">profesional</span>
                            </h1>
                            <p className="mt-6 text-xl text-slate-600">
                                La forma más rápida de mostrar tus productos y recibir pedidos por WhatsApp. <strong>Sin comisiones</strong>. Registrate gratis y sube tus primeros 5 productos hoy.
                            </p>
                            <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                                <Link to="/registro">
                                    <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold">
                                        Empezar gratis
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
                                    <Link to="/catalogo/ecoverde-spa?mode=demo" className="group w-full sm:w-auto">
                                        <Button variant="outline" size="lg" className="h-14 w-full bg-white border-slate-200 text-slate-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all shadow-sm group-hover:shadow-md">
                                            <Store className="mr-2 h-5 w-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
                                            Demo Tienda
                                        </Button>
                                    </Link>
                                    <Link to="/catalogo/restaurante-delicias?mode=demo" className="group w-full sm:w-auto">
                                        <Button variant="outline" size="lg" className="h-14 w-full bg-white border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all shadow-sm group-hover:shadow-md">
                                            <Utensils className="mr-2 h-5 w-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                                            Demo Restaurante
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="absolute top-0 -z-10 h-full w-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary-300 blur-3xl"></div>
                    <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-emerald-300 blur-3xl"></div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-24 bg-white overflow-x-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">¿Por qué elegir ktaloog?</h2>
                        <p className="mt-4 text-slate-600">Brindamos las herramientas que los emprendedores realmente necesitan.</p>
                    </div>

                    <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Card className="h-full border-none shadow-none bg-slate-50 rounded-3xl overflow-hidden hover:bg-slate-100 transition-colors">
                                    <CardContent className="pt-8 p-8">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 mb-6">
                                            {benefit.icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">{benefit.title}</h3>
                                        <p className="mt-3 text-slate-600 leading-relaxed">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Launch Section */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-600 rounded-full opacity-10" />
                <div className="mx-auto max-w-7xl px-4 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="flex flex-col justify-center">
                            <h2 className="text-4xl font-extrabold sm:text-6xl mb-6 tracking-tight leading-tight">
                                <span className="text-white">Lleva tu negocio al</span>
                                <br />
                                <span className="text-primary-400 bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-emerald-400">siguiente nivel</span>
                            </h2>
                            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-xl">
                                Nuestro plan Pro incluye productos ilimitados, fotos infinitas, chat integrado y mucho más. Además, podrás <span className="text-white font-semibold underline decoration-primary-500/30">ocultar el branding de ktaloog en móviles</span> para una experiencia 100% propia.
                            </p>
                            <div className="flex flex-col gap-4">
                                <Link to="/precios">
                                    <Button variant="primary" size="lg" className="h-14 px-8 font-bold gap-2">
                                        Ver todos los planes y precios
                                        <ArrowRight size={20} />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-emerald-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-slate-800/50 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] border border-slate-700/50 shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
                                        <div className="bg-primary-500/20 p-2 rounded-xl">
                                            <Zap className="text-primary-400" size={24} />
                                        </div>
                                        Planes Pro
                                    </h3>
                                    <span className="px-3 py-1 bg-primary-500/10 text-primary-400 text-xs font-bold rounded-full border border-primary-500/20">OFERTA DE LANZAMIENTO</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-slate-700/30 hover:border-slate-600/50 transition-colors group/item">
                                        <span className="font-semibold text-slate-300">Mensual</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">$9.990</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary-500/10 to-emerald-500/10 rounded-2xl border-2 border-primary-500/50 relative overflow-hidden group/best shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                        <div className="absolute top-0 right-0">
                                            <div className="bg-primary-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">MÁS POPULAR</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white text-lg">Semestral</span>
                                            <span className="text-[10px] text-primary-400 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">Ahorra $8.940</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl font-black text-white">$8.500</span>
                                            <span className="text-sm text-slate-400 font-medium ml-1">/mes</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-slate-700/30 hover:border-slate-600/50 transition-colors group/item">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-300">Anual</span>
                                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Mejor relación calidad-precio</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">$6.500</span>
                                            <span className="text-sm text-slate-400 font-medium ml-1">/mes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA section */}
            <section className="bg-primary-600 py-16 overflow-x-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">¿Listo para subir tus productos?</h2>
                    <p className="mt-4 text-primary-100 italic">Únete a cientos de emprendedores que ya están vendiendo más.</p>
                    <div className="mt-8">
                        <Link to="/registro">
                            <Button variant="secondary" size="lg" className="bg-white text-primary-600 hover:bg-slate-100">
                                Crear mi catálogo ahora
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
