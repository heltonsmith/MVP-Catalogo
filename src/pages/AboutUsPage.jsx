import { Target, Users, Sparkles, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function AboutUsPage() {
    const values = [
        { icon: <Target className="text-primary-600" />, title: 'Misión', desc: 'Digitalizar a los emprendedores de Chile con herramientas profesionales y accesibles.' },
        { icon: <Users className="text-primary-600" />, title: 'Comunidad', desc: 'Creamos un ecosistema donde negocios y clientes conectan de forma humana y eficiente.' },
        { icon: <Sparkles className="text-primary-600" />, title: 'Innovación', desc: 'Buscamos simplificar la tecnología para que tú solo te preocupes de vender.' },
    ];

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <div className="relative py-24 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <img
                        src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2000&auto=format&fit=crop"
                        alt="Nosotros"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="relative max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
                        Impulsando el comercio <span className="text-primary-400">local</span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        ktaloog nació en el corazón de Chile con un propósito claro: que ningún emprendedor se quede atrás en la era digital.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Nuestra Historia</h2>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                            Observamos que miles de negocios tenían productos increíbles pero no tenían una vitrina digital profesional. Muchos se sentían abrumados por la complejidad de los e-commerce tradicionales o el costo de las comisiones en apps de delivery.
                        </p>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Por eso creamos ktaloog: una herramienta que en menos de 5 minutos te permite tener un catálogo hermoso, compartible por WhatsApp y con todas las funciones que necesitas para brillar.
                        </p>
                        <div className="flex gap-4">
                            <Link to="/registro">
                                <Button size="lg">Crea tu catálogo ahora</Button>
                            </Link>
                            <Link to="/precios">
                                <Button variant="secondary" size="lg">Ver planes</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {values.map((v, i) => (
                            <div key={i} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                                <div className="mb-4">{v.icon}</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{v.title}</h3>
                                <p className="text-slate-500">{v.desc}</p>
                            </div>
                        ))}
                        <div className="p-8 bg-primary-600 rounded-3xl text-white flex flex-col justify-center text-center">
                            <Heart className="mx-auto mb-2 text-white/50" fill="currentColor" />
                            <p className="font-bold text-xl">+1,000</p>
                            <p className="text-white/90 text-sm">Emprendedores confiando en nosotros</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
