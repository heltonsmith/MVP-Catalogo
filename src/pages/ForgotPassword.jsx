import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Rocket, Mail, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { translateAuthError } from '../utils/authErrors';
import { CAPTCHA_ICONS } from '../constants/auth';
import { cn } from '../utils';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { resetPasswordForEmail } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [captcha, setCaptcha] = useState({ target: null, options: [] });
    const [selectedIconId, setSelectedIconId] = useState(null);

    const generateCaptcha = () => {
        const shuffled = [...CAPTCHA_ICONS].sort(() => 0.5 - Math.random());
        const options = shuffled.slice(0, 5);
        const target = options[Math.floor(Math.random() * options.length)];
        setCaptcha({ target, options });
        setSelectedIconId(null);
    };

    useState(() => {
        generateCaptcha();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedIconId) {
            showToast("Por favor selecciona el ícono solicitado", "error");
            return;
        }

        if (selectedIconId !== captcha.target.id) {
            showToast("Ícono incorrecto. Inténtalo de nuevo.", "error");
            generateCaptcha();
            return;
        }

        setLoading(true);

        try {
            const { error } = await resetPasswordForEmail(email);
            if (error) throw error;
            setSubmitted(true);
            showToast("Correo de recuperación enviado", "success");
        } catch (error) {
            showToast(translateAuthError(error), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
                        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
                <Card className="w-full max-w-md border-none shadow-xl rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8 sm:p-12">
                        <div className="flex flex-col items-center text-center">
                            <Link to="/login" className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200 transition-transform hover:scale-110">
                                <Rocket size={24} />
                            </Link>

                            {submitted ? (
                                <div className="space-y-6">
                                    <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto animate-bounce">
                                        <Mail size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Correo enviado!</h2>
                                        <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                            Hemos enviado instrucciones para recuperar tu acceso a <span className="text-slate-900 font-bold">{email}</span>.
                                        </p>
                                    </div>
                                    <div className="pt-6">
                                        <Button
                                            onClick={() => navigate('/login')}
                                            className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary-200"
                                        >
                                            VOLVER AL INICIO
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Recuperar acceso</h2>
                                    <p className="mt-3 text-slate-500 font-medium text-sm leading-relaxed max-w-xs mx-auto">
                                        Ingresa tu correo y te enviaremos un enlace para cambiar tu contraseña.
                                    </p>

                                    <form onSubmit={handleSubmit} className="mt-10 w-full space-y-6">
                                        <div className="text-left relative">
                                            <Input
                                                label="Correo electrónico"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="tu@email.com"
                                                className="pl-12 h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary-600 transition-all"
                                            />
                                            <Mail className="absolute left-4 top-[46px] h-5 w-5 text-slate-400" />
                                        </div>

                                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 text-left">
                                            <Shield size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-800 font-medium leading-tight">
                                                <span className="font-black uppercase tracking-tighter mr-1">Importante:</span>
                                                Si te registraste con Google, debes iniciar sesión usando ese botón. Esta opción es solo para correos propios.
                                            </p>
                                        </div>

                                        {/* CAPTCHA Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    Verificación: Selecciona el <span className="text-primary-600">{captcha.target?.label}</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={generateCaptcha}
                                                    className="text-[10px] font-black text-primary-600 uppercase tracking-tighter hover:underline"
                                                >
                                                    Cambiar
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-5 gap-2">
                                                {captcha.options.map((option) => {
                                                    const Icon = option.component;
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            onClick={() => setSelectedIconId(option.id)}
                                                            className={cn(
                                                                "flex aspect-square items-center justify-center rounded-xl border-2 transition-all",
                                                                selectedIconId === option.id
                                                                    ? "border-primary-600 bg-primary-50 text-primary-600 shadow-md"
                                                                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <Icon size={20} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                type="submit"
                                                className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary-200 transition-all hover:-translate-y-1 active:scale-95"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        ENVIANDO...
                                                    </>
                                                ) : (
                                                    'ENVIAR ENLACE'
                                                )}
                                            </Button>
                                        </div>

                                        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary-600 transition-colors">
                                            <ArrowLeft size={14} /> Volver al Inicio
                                        </Link>
                                    </form>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
