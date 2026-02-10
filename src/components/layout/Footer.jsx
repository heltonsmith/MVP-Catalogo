import { Link } from 'react-router-dom';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-200 bg-white py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/" className="flex items-center">
                            <img
                                src="/logo-transparente.png"
                                alt="ktaloog"
                                className="h-8 w-auto"
                            />
                        </Link>
                        <p className="mt-4 max-w-xs text-slate-500">
                            La plataforma más rápida para crear tu catálogo digital y vender por WhatsApp.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900">Explorar</h4>
                        <ul className="mt-4 space-y-2 text-sm text-slate-500">
                            <li><Link to="/" className="hover:text-primary-600">Inicio</Link></li>
                            <li><Link to="/explorar" className="hover:text-primary-600">Catálogos</Link></li>
                            <li><Link to="/beneficios" className="hover:text-primary-600">Beneficios</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900">Soporte</h4>
                        <ul className="mt-4 space-y-2 text-sm text-slate-500">
                            <li><Link to="#" className="hover:text-primary-600">Ayuda</Link></li>
                            <li><Link to="#" className="hover:text-primary-600">Contacto</Link></li>
                            <li><Link to="#" className="hover:text-primary-600">Términos</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-slate-100 pt-8 text-center text-sm text-slate-400">
                    <p>© {currentYear} ktaloog. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
