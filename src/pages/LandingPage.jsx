import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Smartphone, Zap, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';

export default function LandingPage() {
    const benefits = [
        {
            title: 'Mobile First',
            description: 'Diseñado específicamente para verse increíble en teléfonos móviles.',
            icon: <Smartphone className="text-primary-600" />,
        },
        {
            title: 'Carga Rápida',
            description: 'Optimizado para conexiones móviles lentas. Tus clientes no esperan.',
            icon: <Zap className="text-primary-600" />,
        },
        {
            title: 'Venta por WhatsApp',
            description: 'Recibe cotizaciones detalladas directamente en tu chat.',
            icon: <ShoppingBag className="text-primary-600" />,
        },
    ];

    return (
        <div className="flex flex-col overflow-hidden">
            {/* Hero Section */}
            <section className="relative bg-slate-50 py-20 lg:py-32">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-3xl"
                        >
                            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
                                Crea tu catálogo digital <span className="text-primary-600">en minutos</span>
                            </h1>
                            <p className="mt-6 text-xl text-slate-600">
                                La forma más profesional de mostrar tus productos y recibir pedidos por WhatsApp. Sin comisiones, sin complicaciones.
                            </p>
                            <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                                <Link to="/registro">
                                    <Button size="lg" className="w-full sm:w-auto">
                                        Empezar gratis
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/catalogo/ecoverde-spa">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                        Ver ejemplo
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Background blobs */}
                <div className="absolute top-0 -z-10 h-full w-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary-300 blur-3xl"></div>
                    <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-emerald-300 blur-3xl"></div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Todo lo que necesitas para vender online</h2>
                        <p className="mt-4 text-slate-600">Simplifica tu proceso de venta y profesionaliza tu negocio.</p>
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
                                <Card className="h-full border-none shadow-none bg-slate-50">
                                    <CardContent className="pt-8">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                                            {benefit.icon}
                                        </div>
                                        <h3 className="mt-6 text-xl font-bold text-slate-900">{benefit.title}</h3>
                                        <p className="mt-2 text-slate-600">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA section */}
            <section className="bg-primary-600 py-16">
                <div className="container mx-auto px-4 text-center">
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
