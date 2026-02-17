import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { translateAuthError } from '../utils/authErrors';

export default function LoginPage() {
    const navigate = useNavigate();
    const { signIn, user, profile, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [localLoading, setLocalLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // Handle redirection once we have the user and their profile
    useEffect(() => {
        if (!authLoading && user && profile) {
            const role = profile.role || user?.user_metadata?.role;
            console.log('LoginPage: Auth ready, redirecting based on role:', role);
            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'owner') {
                navigate('/dashboard');
            } else if (role === 'client' || role === 'user') {
                // 'user' is the default in profiles table, usually redirect to client dashboard
                navigate('/dashboard/cliente');
            } else {
                navigate('/');
            }
        }
    }, [user, profile, authLoading, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalLoading(true);

        try {
            console.log('LoginPage: Attempting login for:', formData.email);
            const { data, error } = await signIn({
                email: formData.email,
                password: formData.password
            });

            if (error) {
                console.error('LoginPage: Login error:', error);
                setLocalLoading(false); // Reset only on error
                throw error;
            }

            if (data?.user) {
                console.log('LoginPage: Sign-in successful, waiting for profile...');
                showToast("Sesión iniciada correctamente", "success");

                // If the user is logging in, we check if we should override redirection 
                // but the useEffect already handles this based on profile.role
            }
        } catch (error) {
            showToast(translateAuthError(error), "error");
            setLocalLoading(false);
        }
    };

    // Show loading state if we are logging in OR if we are waiting for the profile
    const isActuallyLoading = localLoading || (user && !profile && authLoading);

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
                                name="email"
                                placeholder="tu@email.com"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                className="pl-10"
                            />
                            <Mail className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
                        </div>
                        <div className="relative">
                            <Input
                                label="Contraseña"
                                name="password"
                                placeholder="••••••••"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                className="pl-10"
                            />
                            <Lock className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
                        </div>

                        <div className="flex items-center justify-end">
                            <button type="button" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg" disabled={isActuallyLoading}>
                            {isActuallyLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Iniciando...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
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
