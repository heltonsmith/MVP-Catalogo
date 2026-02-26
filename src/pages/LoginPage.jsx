import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { translateAuthError } from '../utils/authErrors';

// --- Branded SVG Icons for Social Providers ---
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function LoginPage() {
    const navigate = useNavigate();
    const { signIn, signInWithSocial, user, profile, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [localLoading, setLocalLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(null); // Track which provider is loading
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
                setLocalLoading(false);
                throw error;
            }

            if (data?.user && !error) {
                console.log('LoginPage: Sign-in successful, waiting for profile...');
                showToast("Sesión iniciada correctamente", "success");
            }
        } catch (error) {
            showToast(translateAuthError(error), "error");
            setLocalLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        setSocialLoading(provider);
        try {
            const { error } = await signInWithSocial(provider);
            if (error) {
                console.error('LoginPage: Social login error:', error);
                showToast(translateAuthError(error), "error");
                setSocialLoading(null);
            }
            // If no error, the user will be redirected to the provider's page
            // On return, the useEffect will handle redirection
        } catch (error) {
            showToast("Error al conectar con el proveedor", "error");
            setSocialLoading(null);
        }
    };

    const isActuallyLoading = localLoading || (user && !profile && authLoading);

    const socialProviders = [
        { id: 'google', name: 'Google', icon: GoogleIcon },
    ];

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md border-none shadow-xl">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                        <Link to="/" className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200">
                            <Rocket size={24} />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-900">Inicia Sesión</h2>
                        <p className="mt-2 text-slate-500">Accede a tu cuenta como cliente o tienda</p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="mt-8 space-y-3">
                        {socialProviders.map(({ id, name, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => handleSocialLogin(id)}
                                disabled={!!socialLoading || isActuallyLoading}
                                className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                {socialLoading === id ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                ) : (
                                    <>
                                        <Icon />
                                        Continuar con {name}
                                    </>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-slate-400 font-semibold">o inicia con email</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
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
