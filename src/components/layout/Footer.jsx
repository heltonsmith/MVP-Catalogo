import { Link } from 'react-router-dom';
import { LifeBuoy, ShieldCheck } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-200 bg-white py-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-50 rounded-full -ml-16 -mb-16 opacity-30" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:grid-cols-4">
                    <div className="col-span-1 md:col-span-1 lg:col-span-2">
                        <Link to="/" className="flex items-center">
                            <img
                                src="/logo-transparente.png"
                                alt="ktaloog"
                                className="h-10 w-auto"
                            />
                        </Link>
                        <p className="mt-6 max-w-xs text-slate-500 text-sm leading-relaxed">
                            La plataforma más rápida y potente para crear tu catálogo digital y profesionalizar tus ventas por WhatsApp.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-6">Explorar</h4>
                        <ul className="space-y-4 text-sm text-slate-500 font-medium">
                            <li><Link to="/" className="hover:text-primary-600 transition-colors">Inicio</Link></li>
                            <li><Link to="/precios" className="hover:text-primary-600 transition-colors">Planes y Precios</Link></li>
                            <li><Link to="/explorar" className="hover:text-primary-600 transition-colors">Directorio de Tiendas</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-6">Soporte</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link
                                    to="/ayuda"
                                    className="inline-flex items-center gap-2 group"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                                        <LifeBuoy size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors">Centro de Ayuda</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/terminos" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
                                    <ShieldCheck size={14} />
                                    Aspectos Legales
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
                    <p>© {currentYear} ktaloog. Hecho con ❤️ para emprendedores.</p>
                    <div className="flex items-center gap-6">
                        <Link to="/privacidad" className="hover:text-slate-600">Privacidad</Link>
                        <Link to="/terminos" className="hover:text-slate-600">Términos</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
