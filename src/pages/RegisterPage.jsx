import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Mail, Instagram, Twitter, Linkedin, Globe, Phone, Loader2, BadgeCheck, TrendingUp, User, Search, Heart, Star, Smile, Cloud, Moon, Sun, Zap, Music, Camera, Coffee, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { translateAuthError } from '../utils/authErrors';
import { LocationSelector } from '../components/ui/LocationSelector';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { cn, formatRut as sharedFormatRut, validateRut as sharedValidateRut, formatPhone as sharedFormatPhone, validatePhone as sharedValidatePhone, isValidUrl as sharedIsValidUrl, titleCase, cleanTextInput, slugify } from '../utils';
import { CAPTCHA_ICONS } from '../constants/auth';
import { SEO } from '../components/layout/SEO';

// --- Branded SVG Icons for Social Providers ---
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const TikTokIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);


export default function RegisterPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [captcha, setCaptcha] = useState({ target: null, options: [] });
    const [selectedIconId, setSelectedIconId] = useState(null);
    const { user, profile, signUp, signInWithSocial, resendConfirmationEmail, loading: authLoading } = useAuth();
    const [socialLoading, setSocialLoading] = useState(null);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    // Handle redirection once we have the user and their profile
    useEffect(() => {
        if (!authLoading && user && profile) {
            const role = profile.role || user?.user_metadata?.role;
            console.log('RegisterPage: Auth ready, redirecting based on role:', role);
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

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    useEffect(() => {
        if (registrationSuccess) {
            setCountdown(60);
        }
    }, [registrationSuccess]);

    const generateCaptcha = () => {
        // Shuffle and pick 5
        const shuffled = [...CAPTCHA_ICONS].sort(() => 0.5 - Math.random());
        const options = shuffled.slice(0, 5);
        // Pick one as target
        const target = options[Math.floor(Math.random() * options.length)];

        setCaptcha({ target, options });
        setSelectedIconId(null);
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
        businessType: '', // Changed to empty to force selection
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
        role: 'client' // Default to client as requested
    });

    const validateRut = (rut) => sharedValidateRut(rut);
    const formatRut = (rut) => sharedFormatRut(rut);
    const validatePhone = (phone) => sharedValidatePhone(phone);
    const formatPhone = (phone) => sharedFormatPhone(phone);
    const isValidUrl = (url) => sharedIsValidUrl(url);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'rut') {
            const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
            if (clean.length <= 9) {
                setFormData(prev => ({ ...prev, [name]: formatRut(value) }));
            }
            return;
        }

        if (name === 'whatsapp') {
            setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
            return;
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
        if (e) e.preventDefault();

        // 0. Clean and Capitalize Data
        const cleanedData = {
            ...formData,
            fullName: titleCase(cleanTextInput(formData.fullName, 100)),
            email: cleanTextInput(formData.email, 100).toLowerCase(),
            password: formData.password, // Don't clean password
            businessName: titleCase(cleanTextInput(formData.businessName, 100)),
            description: cleanTextInput(formData.description, 80),
            address: titleCase(cleanTextInput(formData.address, 255)),
            website: cleanTextInput(formData.website, 255),
            instagram: cleanTextInput(formData.instagram, 255),
            tiktok: cleanTextInput(formData.tiktok, 255),
            twitter: cleanTextInput(formData.twitter, 255),
            linkedin: cleanTextInput(formData.linkedin, 255),
            whatsapp: cleanTextInput(formData.whatsapp, 20)
        };

        if (selectedIconId !== captcha.target?.id) {
            showToast("Por favor selecciona la figura correcta.", "error");
            return;
        }

        // 1. Mandatory Fields Validation (BEFORE SIGNUP)
        if (!cleanedData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedData.email)) {
            showToast("Por favor ingresa un correo electrónico válido.", "error");
            return;
        }

        if (!cleanedData.password || cleanedData.password.length < 6) {
            showToast("La contraseña debe tener al menos 6 caracteres.", "error");
            return;
        }

        if (!cleanedData.fullName) {
            showToast("El nombre completo es obligatorio.", "error");
            return;
        }

        if (cleanedData.role === 'owner') {
            if (!cleanedData.rut || !validateRut(cleanedData.rut)) {
                showToast("El RUT es obligatorio y debe ser válido.", "error");
                return;
            }
            if (!cleanedData.businessName) {
                showToast("El nombre de emprendimiento es obligatorio.", "error");
                return;
            }
            if (!cleanedData.description) {
                showToast("La descripción de la tienda es obligatoria.", "error");
                return;
            }
            if (!cleanedData.address) {
                showToast("La dirección física es obligatoria.", "error");
                return;
            }
            if (!cleanedData.location) {
                showToast("La ubicación (Región y Comuna) es obligatoria.", "error");
                return;
            }
            if (!cleanedData.businessType) {
                showToast("Debes seleccionar un tipo de venta o negocio.", "error");
                return;
            }
            const isEmptyWhatsapp = !cleanedData.whatsapp || cleanedData.whatsapp === '+56' || cleanedData.whatsapp.trim() === '';
            if (!isEmptyWhatsapp && !validatePhone(cleanedData.whatsapp)) {
                showToast("El número de WhatsApp no es válido. Formato: +56XXXXXXXXX", "error");
                return;
            }
            if (isEmptyWhatsapp) {
                cleanedData.whatsapp = '';
            }
            // URL Validations
            const urls = {
                website: cleanedData.website,
                instagram: cleanedData.instagram,
                tiktok: cleanedData.tiktok,
                twitter: cleanedData.twitter,
                linkedin: cleanedData.linkedin
            };
            for (const [key, val] of Object.entries(urls)) {
                if (val && !isValidUrl(val)) {
                    showToast(`El enlace de ${key} debe comenzar con https://`, "error");
                    return;
                }
            }
        }

        setLoading(true);

        try {
            // 1. Sign up user
            const { data: authData, error: authError } = await signUp({
                email: cleanedData.email,
                password: cleanedData.password,
                options: {
                    data: {
                        full_name: cleanedData.fullName,
                        role: cleanedData.role
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
                    if (cleanedData.role === 'owner') {
                        const slug = slugify(cleanedData.businessName);

                        const { error: companyError } = await supabase
                            .from('companies')
                            .insert([{
                                user_id: authData.user.id,
                                name: cleanedData.businessName,
                                slug: slug,
                                whatsapp: cleanedData.whatsapp,
                                business_type: cleanedData.businessType,
                                description: cleanedData.description || `Bienvenidos a ${cleanedData.businessName}`,
                                address: cleanedData.address,
                                features: {
                                    cartEnabled: cleanedData.businessType !== 'restaurant'
                                },
                                socials: {
                                    instagram: normalizeSocial(cleanedData.instagram, 'instagram'),
                                    tiktok: normalizeSocial(cleanedData.tiktok, 'tiktok'),
                                    twitter: normalizeSocial(cleanedData.twitter, 'twitter'),
                                    linkedin: normalizeSocial(cleanedData.linkedin, 'linkedin'),
                                    website: normalizeUrl(cleanedData.website)
                                },
                                // Add geographic data
                                region: cleanedData.location.includes(',') ? cleanedData.location.split(',')[1].trim() : cleanedData.location,
                                city: cleanedData.location.includes(',') ? cleanedData.location.split(',')[0].trim() : '',
                                commune: cleanedData.location.includes(',') ? cleanedData.location.split(',')[0].trim() : '',
                                is_online: cleanedData.isOnline
                            }]);

                        if (companyError) throw companyError;

                        // Also save RUT to profiles table
                        const { error: rutError } = await supabase
                            .from('profiles')
                            .update({ rut: cleanedData.rut })
                            .eq('id', authData.user.id);
                        if (rutError) console.error('Error saving RUT to profile:', rutError);
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

                // If there is no session but registration was successful, 
                // it means confirmation is required
                if (!authData.session) {
                    setRegistrationSuccess(true);
                    showToast("Por favor, revisa tu correo para confirmar tu cuenta.", "success");
                } else {
                    showToast(isAdmin ? "Cuenta de Administrador creada exitosamente." : "Cuenta creada exitosamente. ¡Bienvenido!", "success");
                }

                console.log('RegisterPage: Registration successful');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast(translateAuthError(error), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider) => {
        setSocialLoading(provider);
        try {
            const { error } = await signInWithSocial(provider);
            if (error) {
                console.error('RegisterPage: Social login error:', error);
                showToast(translateAuthError(error), "error");
                setSocialLoading(null);
            }
        } catch (error) {
            showToast("Error al conectar con el proveedor", "error");
            setSocialLoading(null);
        }
    };

    const socialProviders = [
        { id: 'google', name: 'Google', icon: GoogleIcon },
    ];

    return (
        <>
            <SEO
                title="Registra tu Tienda o Crea tu Cuenta"
                description="Únete a Ktaloog.com: registra tu tienda y publica tu catálogo digital gratis, o crea tu cuenta como cliente para descubrir las mejores tiendas de Chile."
                url="https://www.ktaloog.com/registro"
                keywords="registrar tienda online, crear catálogo digital gratis, registro cliente ktaloog, abrir tienda chile, vender por whatsapp"
            />
            <div className="flex-1 flex flex-col lg:flex-row bg-white">
                {/* Left Side: Form Section */}
                <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-slate-50/50">
                    <div className="mx-auto w-full max-w-xl lg:w-[500px]">
                        {registrationSuccess ? (
                            <div className="flex flex-col items-center text-center space-y-6 py-12">
                                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                                    <Mail size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Casi listo!</h2>
                                    <p className="text-slate-500 font-medium">
                                        Hemos enviado un enlace de confirmación a <span className="text-slate-900 font-bold">{formData.email}</span>.
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm max-w-sm">
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Para proteger tu privacidad, necesitamos verificar que este correo te pertenece antes de habilitar tu acceso.
                                    </p>
                                </div>
                                <div className="pt-6 w-full space-y-4">
                                    <Button
                                        onClick={() => navigate('/login')}
                                        className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary-200"
                                    >
                                        IR AL INICIO DE SESIÓN
                                    </Button>

                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (countdown > 0 || resendLoading) return;
                                                setResendLoading(true);
                                                try {
                                                    const { error } = await resendConfirmationEmail(formData.email);
                                                    if (error) throw error;
                                                    showToast("Correo de confirmación re-enviado", "success");
                                                    setCountdown(60);
                                                } catch (error) {
                                                    showToast("Error al reenviar: " + error.message, "error");
                                                } finally {
                                                    setResendLoading(false);
                                                }
                                            }}
                                            disabled={countdown > 0 || resendLoading}
                                            className={cn(
                                                "text-xs font-bold uppercase tracking-widest transition-colors",
                                                countdown > 0 || resendLoading
                                                    ? "text-slate-300 cursor-not-allowed"
                                                    : "text-primary-600 hover:text-primary-700"
                                            )}
                                        >
                                            {resendLoading ? "Enviando..." : countdown > 0 ? `Reenviar en ${countdown}s` : "¿No recibiste el correo? Reenviar"}
                                        </button>

                                        <button
                                            onClick={() => setRegistrationSuccess(false)}
                                            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary-600 transition-colors"
                                        >
                                            ¿Te equivocaste de correo? Volver
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                                    <Link to="/" className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-xl shadow-primary-200 ring-4 ring-white transition-transform hover:scale-110">
                                        <Rocket size={24} />
                                    </Link>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                        {formData.role === 'owner' ? 'Emprende con Ktaloog' : 'Únete a la Comunidad'}
                                    </h2>
                                    <p className="mt-3 text-slate-500 font-medium text-sm leading-relaxed max-w-sm">
                                        {formData.role === 'owner'
                                            ? 'Crea tu catálogo profesional en minutos y llega a miles de clientes.'
                                            : 'Guarda tus tiendas favoritas, gestiona pedidos y obtén atención personalizada.'}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-10 space-y-8 pb-12">
                                    {/* Role Selector with Radio Buttons */}
                                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <label className={cn(
                                            "flex flex-col items-center justify-center gap-2 cursor-pointer p-4 rounded-xl border-2 transition-all",
                                            formData.role === 'client'
                                                ? "border-primary-500 bg-primary-50/50"
                                                : "border-transparent hover:bg-slate-50"
                                        )}>
                                            <input
                                                type="radio"
                                                name="role"
                                                value="client"
                                                checked={formData.role === 'client'}
                                                onChange={() => setFormData(prev => ({ ...prev, role: 'client' }))}
                                                className="sr-only"
                                            />
                                            <div className={cn("p-2 rounded-lg", formData.role === 'client' ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400")}>
                                                <User size={20} />
                                            </div>
                                            <span className={cn("text-xs font-black uppercase tracking-widest", formData.role === 'client' ? "text-primary-700" : "text-slate-400")}>Cliente</span>
                                        </label>

                                        <label className={cn(
                                            "flex flex-col items-center justify-center gap-2 cursor-pointer p-4 rounded-xl border-2 transition-all",
                                            formData.role === 'owner'
                                                ? "border-primary-500 bg-primary-50/50"
                                                : "border-transparent hover:bg-slate-50"
                                        )}>
                                            <input
                                                type="radio"
                                                name="role"
                                                value="owner"
                                                checked={formData.role === 'owner'}
                                                onChange={() => setFormData(prev => ({ ...prev, role: 'owner' }))}
                                                className="sr-only"
                                            />
                                            <div className={cn("p-2 rounded-lg", formData.role === 'owner' ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400")}>
                                                <Rocket size={20} />
                                            </div>
                                            <span className={cn("text-xs font-black uppercase tracking-widest", formData.role === 'owner' ? "text-primary-700" : "text-slate-400")}>Emprendedor</span>
                                        </label>
                                    </div>

                                    {/* Social Registration for Clients */}
                                    {formData.role === 'client' && (
                                        <div className="space-y-4">
                                            {/* Social Sign Up */}
                                            <div className="space-y-3 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                                                    onClick={() => handleSocialLogin('google')}
                                                    disabled={!!socialLoading || loading}
                                                >
                                                    {socialLoading === 'google' ? (
                                                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                                    ) : (
                                                        <>
                                                            <GoogleIcon />
                                                            Registrarse con Google
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="relative my-6">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-slate-200" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-slate-50 px-3 text-slate-400 font-bold">o regístrate con email</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Datos Personales */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">1</span>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Identidad</h3>
                                        </div>
                                        <div className={cn("grid gap-4", formData.role === 'owner' ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                                            <Input
                                                label={<span>Nombre completo <span className="text-red-500">*</span></span>}
                                                name="fullName"
                                                placeholder="Juan Pérez"
                                                required
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                maxLength={100}
                                                autoComplete="name"
                                                className="bg-white"
                                            />
                                            {formData.role === 'owner' && (
                                                <Input
                                                    label={<span>RUT <span className="text-red-500">*</span></span>}
                                                    name="rut"
                                                    placeholder="12.345.678-9"
                                                    required
                                                    value={formData.rut}
                                                    onChange={handleChange}
                                                    maxLength={12}
                                                    error={formData.rut && !validateRut(formData.rut) ? "RUT inválido" : null}
                                                    className="bg-white"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Emprendimiento - Block hidden for clients */}
                                    {formData.role === 'owner' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">2</span>
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tu Emprendimiento</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <Input
                                                    label={<span>Nombre de emprendimiento <span className="text-red-500">*</span></span>}
                                                    name="businessName"
                                                    placeholder="Mi Tienda Online"
                                                    required={formData.role === 'owner'}
                                                    value={formData.businessName}
                                                    onChange={handleChange}
                                                    maxLength={100}
                                                    className="bg-white"
                                                />
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-bold text-slate-700">Descripción de la tienda <span className="text-red-500">*</span></label>
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                            formData.description.length >= 80
                                                                ? "text-red-600 bg-red-50 border-red-100"
                                                                : "text-slate-400 bg-slate-50 border-slate-100"
                                                        )}>
                                                            {formData.description.length} / 80
                                                        </span>
                                                    </div>
                                                    <textarea
                                                        name="description"
                                                        placeholder="Cuéntanos brevemente sobre tu negocio..."
                                                        required
                                                        className="w-full min-h-[100px] rounded-2xl border border-slate-200 p-4 text-sm focus:border-primary-600 focus:ring-4 focus:ring-primary-50 outline-none transition-all resize-none shadow-sm bg-white"
                                                        value={formData.description}
                                                        onChange={handleChange}
                                                        maxLength={80}
                                                    ></textarea>
                                                </div>
                                                <Input
                                                    label={<span>Dirección Física <span className="text-red-500">*</span></span>}
                                                    name="address"
                                                    placeholder="Av. Principal 123, Local 5"
                                                    required={formData.role === 'owner'}
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    maxLength={255}
                                                    className="bg-white"
                                                />

                                                <div className="space-y-3">
                                                    <LocationSelector
                                                        value={formData.location}
                                                        onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
                                                        className="gap-4"
                                                        showRequired
                                                    />
                                                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                        <input
                                                            type="checkbox"
                                                            id="isOnline"
                                                            name="isOnline"
                                                            checked={formData.isOnline}
                                                            onChange={handleChange}
                                                            className="h-5 w-5 rounded-lg border-slate-300 text-primary-600 focus:ring-primary-500"
                                                        />
                                                        <label htmlFor="isOnline" className="text-xs font-bold text-slate-600 cursor-pointer">
                                                            Mi tienda es 100% Online (No publicar ubicación)
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <div className="flex flex-col gap-1">
                                                            <label className="text-sm font-bold text-slate-700">Tienda de Ventas</label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                {[
                                                                    { id: 'retail', label: 'Detalle' },
                                                                    { id: 'wholesale', label: 'Mayorista' },
                                                                    { id: 'mixed', label: 'Detalle y Mayorista' }
                                                                ].map((type) => (
                                                                    <label key={type.id} className={cn(
                                                                        "flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all",
                                                                        formData.businessType === type.id
                                                                            ? "border-primary-600 bg-primary-50/50 ring-1 ring-primary-600"
                                                                            : "border-slate-200"
                                                                    )}>
                                                                        <input
                                                                            type="radio"
                                                                            name="businessType"
                                                                            value={type.id}
                                                                            className="sr-only"
                                                                            checked={formData.businessType === type.id}
                                                                            onChange={handleChange}
                                                                        />
                                                                        <span className={cn(
                                                                            "text-[10px] font-black uppercase tracking-widest text-center",
                                                                            formData.businessType === type.id ? "text-primary-700" : "text-slate-500"
                                                                        )}>
                                                                            {type.label}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-1">
                                                            <label className="text-sm font-bold text-slate-700">Negocios</label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                {[
                                                                    { id: 'restaurant', label: 'Restaurante' }
                                                                ].map((type) => (
                                                                    <label key={type.id} className={cn(
                                                                        "flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all",
                                                                        formData.businessType === type.id
                                                                            ? "border-primary-600 bg-primary-50/50 ring-1 ring-primary-600"
                                                                            : "border-slate-200"
                                                                    )}>
                                                                        <input
                                                                            type="radio"
                                                                            name="businessType"
                                                                            value={type.id}
                                                                            className="sr-only"
                                                                            checked={formData.businessType === type.id}
                                                                            onChange={handleChange}
                                                                        />
                                                                        <span className={cn(
                                                                            "text-[10px] font-black uppercase tracking-widest text-center",
                                                                            formData.businessType === type.id ? "text-primary-700" : "text-slate-500"
                                                                        )}>
                                                                            {type.label}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Presencia Digital */}
                                    {formData.role === 'owner' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">3</span>
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Presencia Digital</h3>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Input
                                                    label="Web"
                                                    name="website"
                                                    placeholder="https://su-tienda.com"
                                                    icon={<Globe size={16} />}
                                                    value={formData.website}
                                                    onChange={handleChange}
                                                    maxLength={255}
                                                    error={formData.website && !isValidUrl(formData.website) ? "Debe usar https://" : null}
                                                    className="bg-white"
                                                />
                                                <Input
                                                    label="Instagram"
                                                    name="instagram"
                                                    placeholder="https://instagram.com/su-cuenta"
                                                    icon={<Instagram size={16} />}
                                                    value={formData.instagram}
                                                    onChange={handleChange}
                                                    maxLength={255}
                                                    error={formData.instagram && !isValidUrl(formData.instagram) ? "Debe usar https://" : null}
                                                    className="bg-white"
                                                />
                                                <Input
                                                    label="TikTok"
                                                    name="tiktok"
                                                    placeholder="https://tiktok.com/@su-cuenta"
                                                    icon={<TikTokIcon />}
                                                    value={formData.tiktok}
                                                    onChange={handleChange}
                                                    maxLength={255}
                                                    error={formData.tiktok && !isValidUrl(formData.tiktok) ? "Debe usar https://" : null}
                                                    className="bg-white"
                                                />
                                                <Input
                                                    label="WhatsApp"
                                                    name="whatsapp"
                                                    placeholder="+56..."
                                                    icon={<Phone size={16} />}
                                                    value={formData.whatsapp}
                                                    onChange={handleChange}
                                                    error={formData.whatsapp && formData.whatsapp.length > 3 && !validatePhone(formData.whatsapp) ? "WhatsApp inválido" : null}
                                                    className="bg-white"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Credenciales */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
                                                {formData.role === 'owner' ? '4' : '2'}
                                            </span>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Credenciales</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input
                                                label={<span>Email <span className="text-red-500">*</span></span>}
                                                name="email"
                                                placeholder="tu@email.com"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                maxLength={100}
                                                autoComplete="email"
                                                className="bg-white"
                                            />
                                            <Input
                                                label={<span>Contraseña <span className="text-red-500">*</span></span>}
                                                name="password"
                                                placeholder="••••••••"
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={handleChange}
                                                autoComplete="new-password"
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Bot Protection */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Protección</h3>
                                                <p className="text-[10px] font-bold text-slate-400">Toca el/la <span className="text-primary-600 underline">{captcha.target?.label}</span></p>
                                            </div>
                                            <button type="button" onClick={generateCaptcha} className="text-[10px] font-black text-primary-600 hover:underline">REGENERAR</button>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2">
                                            {captcha.options.map((item) => {
                                                const Icon = item.component;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setSelectedIconId(item.id)}
                                                        className={cn(
                                                            "h-14 flex items-center justify-center rounded-xl border-2 transition-all active:scale-95",
                                                            selectedIconId === item.id
                                                                ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200"
                                                                : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300"
                                                        )}
                                                    >
                                                        <Icon size={24} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <Button type="submit" className="w-full h-14 text-lg font-black shadow-xl shadow-primary-200 rounded-2xl transition-all hover:-translate-y-1 active:scale-95" disabled={loading || (user && !profile && authLoading)}>
                                            {loading || (user && !profile && authLoading) ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Iniciando...
                                                </>
                                            ) : (
                                                formData.role === 'owner' ? 'CREAR MI CATÁLOGO' : 'UNIRME AHORA'
                                            )}
                                        </Button>

                                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <Link to="/login" className="hover:text-primary-600 transition-colors">¿Ya tienes cuenta? Inicia Sesión</Link>
                                            <span>•</span>
                                            <Link to="/" className="hover:text-primary-600 transition-colors">Volver al Inicio</Link>
                                        </div>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side: Info Panel (Desktop Only) */}
                <div className="hidden lg:flex relative flex-1 bg-slate-900 overflow-hidden items-center justify-center lg:justify-start lg:items-start p-20 lg:pt-32 xl:pt-40">
                    {/* Background Decoration */}
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-600/20 blur-[120px] rounded-full" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full" />
                    </div>

                    <div className="relative z-10 max-w-lg w-full">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-widest mb-8">
                            <BadgeCheck size={12} /> Ecosistema de confianza
                        </div>

                        {formData.role === 'client' ? (
                            <>
                                <h2 className="text-5xl font-black text-white leading-tight mb-8">
                                    Encuentra y conecta con tus <span className="text-primary-500">tiendas favoritas</span>.
                                </h2>

                                <div className="space-y-8">
                                    <FeatureItem
                                        icon={<Search className="text-primary-400" />}
                                        title="Busca tiendas locales"
                                        desc="Descubre los mejores negocios cerca de ti y sus catálogos actualizados."
                                    />
                                    <FeatureItem
                                        icon={<Heart className="text-rose-400" />}
                                        title="Guarda en favoritos"
                                        desc="Ten tus tiendas preferidas siempre a mano y no te pierdas sus ofertas."
                                    />
                                    <FeatureItem
                                        icon={<Star className="text-amber-400" />}
                                        title="Opinión de la comunidad"
                                        desc="Conoce lo que otros dicen y comparte tu experiencia con valoraciones reales."
                                    />
                                    <FeatureItem
                                        icon={<ShoppingBag className="text-blue-400" />}
                                        title="Cotizaciones rápidas"
                                        desc="Pregunta por productos y precios en segundos directamente por WhatsApp."
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-5xl font-black text-white leading-tight mb-8">
                                    Lleva tu negocio al <span className="text-primary-500">siguiente nivel</span> digital.
                                </h2>

                                <div className="space-y-8">
                                    <FeatureItem
                                        icon={<Rocket className="text-primary-400" />}
                                        title="Despliegue Instantáneo"
                                        desc="Sube tus productos y comparte tu catálogo por WhatsApp en segundos."
                                    />
                                    <FeatureItem
                                        icon={<Globe className="text-blue-400" />}
                                        title="Sin Comisiones"
                                        desc="Tus ventas son tuyas. No cobramos comisiones por transacción."
                                    />
                                    <FeatureItem
                                        icon={<TrendingUp size={24} className="text-emerald-400" />}
                                        title="Analíticas Reales"
                                        desc="Conoce cuántas personas visitan tu catálogo y qué productos prefieren."
                                    />
                                </div>
                            </>
                        )}

                        <div className="mt-16 p-8 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-slate-300">+500 emprendedores ya confían</span>
                            </div>
                            <p className="text-slate-400 text-sm italic">
                                "Ktaloog cambió la forma en que atiendo a mis clientes. El catálogo es rápido, elegante y muy fácil de usar."
                            </p>
                        </div>
                    </div>
                </div>
            </div >
        </>
    );
}

function FeatureItem({ icon, title, desc }) {
    return (
        <div className="flex gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-white mb-1">{title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
