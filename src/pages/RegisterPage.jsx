import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Instagram, Twitter, Linkedin, Github, Globe, Phone, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { translateAuthError } from '../utils/authErrors';
import { LocationSelector } from '../components/ui/LocationSelector';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { cn } from '../utils';

const TikTokIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export default function RegisterPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [captcha, setCaptcha] = useState({ q: '', a: null });
    const [userCaptcha, setUserCaptcha] = useState('');
    const { user, profile, signUp, loading: authLoading } = useAuth();

    // Handle redirection once we have the user and their profile
    useEffect(() => {
        if (!authLoading && user && profile) {
            console.log('RegisterPage: Auth ready, redirecting to Home');
            navigate('/');
        }
    }, [user, profile, authLoading, navigate]);

    const generateCaptcha = () => {
        const n1 = Math.floor(Math.random() * 10) + 1;
        const n2 = Math.floor(Math.random() * 10) + 1;
        setCaptcha({ q: `${n1} + ${n2}`, a: n1 + n2 });
        setUserCaptcha('');
    };

    useEffect(() => {
        generateCaptcha();

        // Handle role from query params
        const params = new URLSearchParams(window.location.search);
        const roleParam = params.get('role');
        if (roleParam === 'owner' || roleParam === 'client') {
            setFormData(prev => ({ ...prev, role: roleParam }));
        }
    }, []);

    const [formData, setFormData] = useState({
        fullName: '',
        rut: '',
        businessName: '',
        description: '',
        address: '',
        businessType: 'retail',
        website: '',
        instagram: '',
        tiktok: '',
        twitter: '',
        linkedin: '',
        whatsapp: '+56',
        email: '',
        password: '',
        location: '',
        isOnline: false,
        role: 'owner' // 'owner' or 'client'
    });

    const validateRut = (rut) => {
        if (!rut) return false;
        let clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
        if (clean.length < 8) return false;

        let dv = clean.slice(-1);
        let num = clean.slice(0, -1);

        let sum = 0;
        let mul = 2;

        for (let i = num.length - 1; i >= 0; i--) {
            sum += parseInt(num.charAt(i)) * mul;
            mul = mul === 7 ? 2 : mul + 1;
        }

        let res = 11 - (sum % 11);
        let expectedDv = res === 11 ? '0' : res === 10 ? 'K' : res.toString();

        return dv === expectedDv;
    };

    const formatRut = (rut) => {
        let clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
        if (!clean) return '';

        let dv = clean.slice(-1);
        let num = clean.slice(0, -1);

        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + '-' + dv;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'rut') {
            const clean = value.replace(/\./g, '').replace(/-/g, '').toUpperCase();
            if (clean.length <= 9) {
                setFormData(prev => ({ ...prev, [name]: formatRut(value) }));
            }
            return;
        }

        if (name === 'whatsapp') {
            if (!value.startsWith('+56')) {
                setFormData(prev => ({ ...prev, [name]: '+56' }));
                return;
            }
        }

        if (name === 'isOnline') {
            setFormData(prev => ({ ...prev, [name]: e.target.checked }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const normalizeUrl = (url) => {
        if (!url) return '';
        let cleanUrl = url.trim();
        if (!/^https?:\/\//i.test(cleanUrl)) {
            cleanUrl = `https://${cleanUrl}`;
        }
        return cleanUrl;
    };

    const normalizeSocial = (handle, platform) => {
        if (!handle) return '';
        let clean = handle.trim();

        // If it's already a URL, return it (but ensure https)
        if (/^https?:\/\//i.test(clean)) return clean;
        if (/^www\./i.test(clean)) return `https://${clean}`;

        // Remove @ if present
        clean = clean.replace(/^@/, '');

        const bases = {
            instagram: 'https://instagram.com/',
            tiktok: 'https://tiktok.com/@',
            twitter: 'https://twitter.com/',
            linkedin: 'https://linkedin.com/in/',
        };

        return bases[platform] ? `${bases[platform]}${clean}` : clean;
    };

    const normalizePhone = (phone) => {
        if (!phone) return '';
        let clean = phone.replace(/\D/g, ''); // Keep only digits

        // If it starts with 56, ensure it has the + 
        if (clean.startsWith('56') && clean.length >= 11) {
            return `+${clean}`;
        }

        // If it starts with 9 and has 9 digits (common in Chile), add +56
        if (clean.startsWith('9') && clean.length === 9) {
            return `+56${clean}`;
        }

        // If it doesn't have a country code but is 9 digits, assume +56
        if (clean.length === 9) {
            return `+56${clean}`;
        }

        return clean.startsWith('+') ? clean : `+${clean}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateRut(formData.rut)) {
            showToast("RUT inválido. Por favor verifica los datos.", "error");
            return;
        }

        if (parseInt(userCaptcha) !== captcha.a) {
            showToast("Por favor resuelve el captcha correctamente.", "error");
            return;
        }

        if (formData.role === 'owner' && !formData.location) {
            showToast("La ubicación (Región y Comuna) es obligatoria.", "error");
            return;
        }

        setLoading(true);

        try {
            // 1. Sign up user
            const { data: authData, error: authError } = await signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: formData.role
                    }
                }
            });

            if (authError) throw authError;

            if (authData?.user) {
                // Check if this is the designated admin account
                const isAdmin = formData.email.toLowerCase() === 'heltonsmith@hotmail.com';

                if (!isAdmin) {
                    // Update user metadata with role if it wasn't set correctly during signup (Supabase specific)
                    // Note: In a real app we might want to use a trigger or edge function, 
                    // but for now we'll rely on the profile creation trigger or initial metadata.

                    // IF ENTREPRENEUR -> Create Company
                    if (formData.role === 'owner') {
                        const slug = formData.businessName
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '');

                        const { error: companyError } = await supabase
                            .from('companies')
                            .insert([{
                                user_id: authData.user.id,
                                name: formData.businessName,
                                slug: slug,
                                whatsapp: normalizePhone(formData.whatsapp),
                                business_type: formData.businessType,
                                description: formData.description || `Bienvenidos a ${formData.businessName}`,
                                features: {
                                    cartEnabled: formData.businessType !== 'restaurant'
                                },
                                socials: {
                                    instagram: normalizeSocial(formData.instagram, 'instagram'),
                                    tiktok: normalizeSocial(formData.tiktok, 'tiktok'),
                                    twitter: normalizeSocial(formData.twitter, 'twitter'),
                                    linkedin: normalizeSocial(formData.linkedin, 'linkedin'),
                                    website: normalizeUrl(formData.website)
                                },
                                // Add geographic data
                                region: formData.location.includes(',') ? formData.location.split(',')[1].trim() : formData.location,
                                city: formData.location.includes(',') ? formData.location.split(',')[0].trim() : '',
                                commune: formData.location.includes(',') ? formData.location.split(',')[0].trim() : '',
                                is_online: formData.isOnline
                            }]);

                        if (companyError) throw companyError;
                    }
                    // IF CLIENT -> Update profile role if needed (handled by trigger usually, else manual update)
                    else {
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .update({ role: 'client' })
                            .eq('id', authData.user.id);

                        if (profileError) {
                            console.error("Error updating profile role:", profileError);
                            // continue anyway, default might be null or user
                        }
                    }
                }

                showToast(isAdmin ? "Cuenta de Administrador creada exitosamente." : "Cuenta creada exitosamente. ¡Bienvenido!", "success");

                // We DON'T navigate here. useEffect will handle it once profile is loaded.
                console.log('RegisterPage: Registration successful, waiting for profile...');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast(translateAuthError(error), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-2 sm:px-4 py-8 sm:py-12 overflow-x-hidden">
            <Card className="w-full max-w-2xl border-none shadow-xl">
                <CardContent className="p-4 sm:p-8">
                    <div className="flex flex-col items-center text-center">
                        <Link to="/" className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200">
                            <Rocket size={24} />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {formData.role === 'owner' ? 'Crea tu cuenta de Emprendedor' : 'Crea tu cuenta de Cliente'}
                        </h2>
                        <p className="mt-2 text-slate-500 text-sm">
                            {formData.role === 'owner'
                                ? 'Regístrate para empezar a gestionar tu catálogo digital'
                                : 'Regístrate para guardar favoritos, valorar tiendas y chatear'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                        {/* Role Selector with Radio Buttons */}
                        <div className="flex gap-6 justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <label className={cn(
                                "flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all",
                                formData.role === 'owner'
                                    ? "border-primary-500 bg-primary-50"
                                    : "border-transparent hover:bg-slate-100"
                            )}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="owner"
                                    checked={formData.role === 'owner'}
                                    onChange={() => setFormData(prev => ({ ...prev, role: 'owner' }))}
                                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                                />
                                <span className="font-bold text-slate-700">Soy Emprendedor</span>
                            </label>

                            <label className={cn(
                                "flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all",
                                formData.role === 'client'
                                    ? "border-primary-500 bg-primary-50"
                                    : "border-transparent hover:bg-slate-100"
                            )}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="client"
                                    checked={formData.role === 'client'}
                                    onChange={() => setFormData(prev => ({ ...prev, role: 'client' }))}
                                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                                />
                                <span className="font-bold text-slate-700">Soy Cliente</span>
                            </label>
                        </div>
                        {/* Identidad */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Identidad</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nombre completo"
                                    name="fullName"
                                    placeholder="Juan Pérez"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    autoComplete="name"
                                />
                                <Input
                                    label="RUT"
                                    name="rut"
                                    placeholder="12.345.678-9"
                                    required
                                    value={formData.rut}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Emprendimiento - Block hidden for clients */}
                        {formData.role === 'owner' && (
                            <>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">2. Tu Emprendimiento</h3>
                                    <div className="space-y-4">
                                        <Input
                                            label="Nombre de emprendimiento"
                                            name="businessName"
                                            placeholder="Mi Tienda Online"
                                            required={formData.role === 'owner'}
                                            value={formData.businessName}
                                            onChange={handleChange}
                                        />
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Descripción de la tienda</label>
                                            <textarea
                                                name="description"
                                                placeholder="Cuéntanos brevemente sobre tu negocio..."
                                                className="w-full min-h-[100px] rounded-lg border border-slate-200 p-3 text-sm focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-all resize-none"
                                                value={formData.description}
                                                onChange={handleChange}
                                            ></textarea>
                                        </div>
                                        <Input
                                            label="Dirección (Real u Online)"
                                            name="address"
                                            placeholder="Calle Falsa 123 o mitienda.cl"
                                            required={formData.role === 'owner'}
                                            value={formData.address}
                                            onChange={handleChange}
                                        />

                                        <div className="space-y-3">
                                            <LocationSelector
                                                value={formData.location}
                                                onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
                                                className="gap-4"
                                            />
                                            <div className="flex items-center gap-2 bg-primary-50 p-3 rounded-xl border border-primary-100">
                                                <input
                                                    type="checkbox"
                                                    id="isOnline"
                                                    name="isOnline"
                                                    checked={formData.isOnline}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <label htmlFor="isOnline" className="text-xs font-black text-primary-700 cursor-pointer">
                                                    Mi tienda es 100% Online (No publicar ubicación)
                                                </label>
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">Es obligatorio elegir ubicación para fines administrativos, pero si marcas Online, no será pública.</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Tipo de emprendimiento</label>
                                            <div className="flex gap-4">
                                                <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50">
                                                    <input
                                                        type="radio"
                                                        name="businessType"
                                                        value="retail"
                                                        className="sr-only"
                                                        checked={formData.businessType === 'retail'}
                                                        onChange={handleChange}
                                                    />
                                                    <span className="text-sm font-semibold">Minorista</span>
                                                </label>
                                                <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50">
                                                    <input
                                                        type="radio"
                                                        name="businessType"
                                                        value="wholesale"
                                                        className="sr-only"
                                                        checked={formData.businessType === 'wholesale'}
                                                        onChange={handleChange}
                                                    />
                                                    <span className="text-sm font-semibold">Mayorista</span>
                                                </label>
                                                <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50">
                                                    <input
                                                        type="radio"
                                                        name="businessType"
                                                        value="restaurant"
                                                        className="sr-only"
                                                        checked={formData.businessType === 'restaurant'}
                                                        onChange={handleChange}
                                                    />
                                                    <span className="text-sm font-semibold">Restaurante</span>
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
                                            <Input
                                                label="Sitio Web"
                                                name="website"
                                                placeholder="https://..."
                                                icon={<Globe className="h-4 w-4" />}
                                                value={formData.website}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="Instagram"
                                                name="instagram"
                                                placeholder="@tu_cuenta"
                                                icon={<Instagram className="h-4 w-4" />}
                                                value={formData.instagram}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="TikTok"
                                                name="tiktok"
                                                placeholder="@tu_cuenta"
                                                icon={<TikTokIcon />}
                                                value={formData.tiktok}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <Input
                                                label="X (Twitter)"
                                                name="twitter"
                                                placeholder="@tu_cuenta"
                                                icon={<Twitter className="h-4 w-4" />}
                                                value={formData.twitter}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="LinkedIn"
                                                name="linkedin"
                                                placeholder="linkedin.com/in/..."
                                                icon={<Linkedin className="h-4 w-4" />}
                                                value={formData.linkedin}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                label="WhatsApp"
                                                name="whatsapp"
                                                placeholder="+569..."
                                                icon={<Phone className="h-4 w-4" />}
                                                value={formData.whatsapp}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Credenciales */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                                {formData.role === 'owner' ? '4. Acceso' : '2. Acceso'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Correo electrónico"
                                    name="email"
                                    placeholder="tu@email.com"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                />
                                <Input
                                    label="Contraseña"
                                    name="password"
                                    placeholder="••••••••"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {/* Bot Protection */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-700 mb-3">Protección contra Bots</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-24 items-center justify-center rounded-lg bg-white border-2 border-slate-200 text-lg font-mono font-bold text-primary-600 select-none">
                                    {captcha.q} =
                                </div>
                                <div className="flex-1">
                                    <Input
                                        placeholder="?"
                                        type="number"
                                        required
                                        value={userCaptcha}
                                        onChange={(e) => setUserCaptcha(e.target.value)}
                                        className="text-center font-bold"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={generateCaptcha}
                                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                                >
                                    Cambiar
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full h-14 text-lg font-bold shadow-lg shadow-primary-200" disabled={loading || (user && !profile && authLoading)}>
                                {loading || (user && !profile && authLoading) ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {loading ? 'Creando cuenta...' : 'Iniciando sesión...'}
                                    </>
                                ) : (
                                    formData.role === 'owner' ? 'Crear Catálogo Ahora' : 'Crear Cuenta Cliente'
                                )}
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
