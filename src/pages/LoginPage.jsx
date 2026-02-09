import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

export default function LoginPage() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate login
        navigate('/dashboard');
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md border-none shadow-xl">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                        <Link to="/" className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200">
                            <Rocket size={24} />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-900">Bienvenido de nuevo</h2>
                        <p className="mt-2 text-slate-500">Ingresa a tu cuenta para gestionar tu catálogo</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <div className="relative">
                            <Input
                                label="Correo electrónico"
                                placeholder="tu@email.com"
                                type="email"
                                required
                                className="pl-10"
                            />
                            <Mail className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
                        </div>
                        <div className="relative">
                            <Input
                                label="Contraseña"
                                placeholder="••••••••"
                                type="password"
                                required
                                className="pl-10"
                            />
                            <Lock className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
                        </div>

                        <div className="flex items-center justify-end">
                            <button type="button" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg">
                            Iniciar Sesión
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/registro" className="font-bold text-primary-600 hover:text-primary-700">
                            Regístrate gratis
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
