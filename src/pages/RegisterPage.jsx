import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Instagram, Twitter, Linkedin, Github, Globe, Phone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

const TikTokIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export default function RegisterPage() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate registration
        navigate('/dashboard');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-2 sm:px-4 py-8 sm:py-12 overflow-x-hidden">
            <Card className="w-full max-w-2xl border-none shadow-xl">
                <CardContent className="p-4 sm:p-8">
                    <div className="flex flex-col items-center text-center">
                        <Link to="/" className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200">
                            <Rocket size={24} />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-900">Crea tu cuenta de Emprendedor</h2>
                        <p className="mt-2 text-slate-500 text-sm">Regístrate para empezar a gestionar tu catálogo digital</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-10 space-y-8">
                        {/* Identidad */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Identidad</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Nombre completo" placeholder="Juan Pérez" required />
                                <Input label="RUT" placeholder="12.345.678-9" required />
                            </div>
                        </div>

                        {/* Emprendimiento */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">2. Tu Emprendimiento</h3>
                            <div className="space-y-4">
                                <Input label="Nombre de emprendimiento" placeholder="Mi Tienda Online" required />
                                <Input label="Dirección (Real u Online)" placeholder="Calle Falsa 123 o mitienda.cl" required />

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Tipo de emprendimiento</label>
                                    <div className="flex gap-4">
                                        <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50">
                                            <input type="radio" name="businessType" value="retail" className="sr-only" defaultChecked />
                                            <span className="text-sm font-semibold">Ventas Detalle</span>
                                        </label>
                                        <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50">
                                            <input type="radio" name="businessType" value="wholesale" className="sr-only" />
                                            <span className="text-sm font-semibold">Ventas Mayoristas</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Presencia Digital */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">3. Presencia Digital</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <Input label="Sitio Web" placeholder="https://..." icon={<Globe className="h-4 w-4" />} />
                                    <Input label="Instagram" placeholder="@tu_cuenta" icon={<Instagram className="h-4 w-4" />} />
                                    <Input label="TikTok" placeholder="@tu_cuenta" icon={<TikTokIcon />} />
                                </div>
                                <div className="space-y-4">
                                    <Input label="X (Twitter)" placeholder="@tu_cuenta" icon={<Twitter className="h-4 w-4" />} />
                                    <Input label="LinkedIn" placeholder="linkedin.com/in/..." icon={<Linkedin className="h-4 w-4" />} />
                                    <Input label="WhatsApp" placeholder="+569..." icon={<Phone className="h-4 w-4" />} required />
                                </div>
                            </div>
                        </div>

                        {/* Credenciales */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">4. Acceso</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Correo electrónico" placeholder="tu@email.com" type="email" required />
                                <Input label="Contraseña" placeholder="••••••••" type="password" required />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full h-14 text-lg font-bold shadow-lg shadow-primary-200">
                                Crear Catálogo Ahora
                            </Button>
                            <p className="mt-4 text-[11px] text-slate-400 text-center">
                                Al registrarte, aceptas nuestros términos y condiciones y políticas de privacidad.
                            </p>
                        </div>
                    </form>

                    <div className="mt-10 text-center text-sm text-slate-500">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700">
                            Inicia sesión
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
