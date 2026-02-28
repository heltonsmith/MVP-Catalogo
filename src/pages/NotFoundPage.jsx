import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
    return (
        <>
                        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="mb-4 flex flex-col items-center">
                        <img
                            src="/favicon-transparente.png"
                            alt="ktaloog mascot"
                            className="h-24 w-auto animate-bounce"
                        />
                        <h1 className="text-8xl font-black text-slate-200 leading-none mt-2">404</h1>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-900 mb-4">¡Página no encontrada!</h2>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        Parece que el producto o la tienda que buscas ha cambiado de estante o ya no existe.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/">
                            <Button className="w-full sm:w-auto h-12 font-bold gap-2">
                                <Home size={18} />
                                Ir al inicio
                            </Button>
                        </Link>
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto h-12 font-bold gap-2"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft size={18} />
                            Volver atrás
                        </Button>
                    </div>

                    <div className="mt-12 text-slate-400 text-sm">
                        ¿Crees que esto es un error? <Link to="/ayuda" className="text-primary-600 font-medium hover:underline">Contáctanos</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
