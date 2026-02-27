import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { translateAuthError } from '../utils/authErrors';
import { SEO } from '../components/layout/SEO';

export default function ResetPassword() {
    const { updatePassword, session } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);

    // If the user lands here without a session (handled by Supabase recovery flow)
    // we should ideally show an error, but Supabase sets the session automatically
    // via the link hash.

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast("Las contraseñas no coinciden", "error");
            return;
        }

        if (password.length < 6) {
            showToast("La contraseña debe tener al menos 6 caracteres", "error");
            return;
        }

        setLoading(true);

        try {
            const { error } = await updatePassword(password);
            if (error) throw error;
            setSuccess(true);
            showToast("Contraseña actualizada correctamente", "success");

            // Wait 3 seconds then redirect to login
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            showToast(translateAuthError(error), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SEO
                title="Restablecer Contraseña | Ktaloog"
                description="Establece una nueva contraseña para tu cuenta de Ktaloog."
                noindex={true}
            />
            <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
                <Card className="w-full max-w-md border-none shadow-xl rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8 sm:p-12">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-200">
                                <Rocket size={24} />
                            </div>

                            {success ? (
                                <div className="space-y-6">
                                    <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Éxito!</h2>
                                        <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                            Tu contraseña ha sido actualizada. Te redirigiremos al inicio de sesión en unos segundos...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nueva contraseña</h2>
                                    <p className="mt-3 text-slate-500 font-medium text-sm leading-relaxed max-w-xs mx-auto">
                                        Establece una contraseña segura para tu cuenta.
                                    </p>

                                    <form onSubmit={handleSubmit} className="mt-10 w-full space-y-6">
                                        <div className="text-left relative">
                                            <Input
                                                label="Contraseña nueva"
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="pl-12 h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary-600 transition-all"
                                            />
                                            <Lock className="absolute left-4 top-[46px] h-5 w-5 text-slate-400" />
                                        </div>

                                        <div className="text-left relative">
                                            <Input
                                                label="Confirmar contraseña"
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="pl-12 h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary-600 transition-all"
                                            />
                                            <Lock className="absolute left-4 top-[46px] h-5 w-5 text-slate-400" />
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                type="submit"
                                                className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary-200"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        ACTUALIZANDO...
                                                    </>
                                                ) : (
                                                    'CAMBIAR CONTRASEÑA'
                                                )}
                                            </Button>
                                        </div>
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
