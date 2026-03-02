import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Camera,
    Save,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    Shield,
    Smartphone,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { cn, formatRut as sharedFormatRut, validateRut as sharedValidateRut, formatPhone as sharedFormatPhone, validatePhone as sharedValidatePhone, resizeImage } from '../../utils';

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function CustomerProfile() {
    const navigate = useNavigate();
    const { user, profile, refreshProfile, signOut } = useAuth();
    const targetUserId = profile?.id || user?.id;
    const { showToast } = useToast();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: profile?.full_name || user?.user_metadata?.full_name || '',
        email: profile?.email || user?.email || '',
        rut: profile?.rut || '',
        phone: profile?.phone || '',
        address: profile?.shipping_address || '',
        newPassword: ''
    });

    const formatRUT = (value) => sharedFormatRut(value);
    const validateRUT = (value) => sharedValidateRut(value);
    const formatPhone = (value) => sharedFormatPhone(value);
    const validatePhone = (value) => sharedValidatePhone(value);

    // Auto-populate when profile loads
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                fullName: prev.fullName || profile.full_name || user?.user_metadata?.full_name || '',
                rut: prev.rut || profile.rut || '',
                phone: prev.phone || profile.phone || '',
                address: prev.address || profile.shipping_address || ''
            }));
        }
    }, [profile, user]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            showToast("La imagen debe ser menor a 50MB", "error");
            return;
        }

        setUploading(true);
        try {
            // Optimize image before upload (256x256, JPEG, 0.8 quality)
            const optimizedBlob = await resizeImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.8 });

            const fileExt = 'jpg';
            const fileName = `avatar-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${targetUserId}/${fileName}`;

            // 1. Upload new avatar
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, optimizedBlob);

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Keep track of old avatar URL to delete later
            const oldAvatarUrl = profile?.avatar_url;

            // 4. Update profile record
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: targetUserId,
                    avatar_url: publicUrl,
                    email: profile?.email || user?.email,
                    full_name: profile?.full_name || user?.user_metadata?.full_name || ''
                });

            if (updateError) {
                // ROLLBACK: Delete the newly uploaded avatar if DB update fails
                console.log('Rolling back avatar due to DB error:', filePath);
                await supabase.storage.from('avatars').remove([filePath]);
                throw updateError;
            }

            // 5. Cleanup OLD avatar file from storage if it exists
            if (oldAvatarUrl && oldAvatarUrl.includes('/avatars/')) {
                const parts = oldAvatarUrl.split('/avatars/');
                if (parts.length > 1) {
                    const rawPath = parts[1];
                    const cleanPath = rawPath.split('?')[0].split('#')[0];
                    if (cleanPath) {
                        console.log('Cleaning up old avatar (profile):', cleanPath);
                        supabase.storage.from('avatars').remove([cleanPath]).catch(console.error);
                    }
                }
            }

            await refreshProfile();
            showToast("Foto de perfil actualizada", "success");
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToast("Error al subir imagen", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (formData.rut && !validateRUT(formData.rut)) {
            showToast("El RUT ingresado no es válido", "error");
            return;
        }

        if (formData.phone && !validatePhone(formData.phone)) {
            showToast("El número de WhatsApp no es válido. Formato: +56XXXXXXXXX", "error");
            return;
        }

        setLoading(true);

        try {
            // 1. Update Profile Metadata
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: targetUserId,
                    email: profile?.email || user?.email,
                    full_name: String(formData.fullName || '').substring(0, 40),
                    rut: formData.rut,
                    phone: formData.phone,
                    shipping_address: String(formData.address || '').substring(0, 50)
                });

            if (profileError) throw profileError;

            // 2. Update Password if provided
            if (formData.newPassword) {
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: formData.newPassword
                });
                if (passwordError) throw passwordError;
                setFormData(prev => ({ ...prev, newPassword: '' }));
            }

            await refreshProfile();
            showToast("Perfil actualizado correctamente", "success");
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast("Error al actualizar perfil", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Shield size={28} className="text-primary-600" /> Mi Perfil y Seguridad
                </h2>

                {user?.app_metadata?.provider !== 'email' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm self-start">
                        <GoogleIcon />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            {user?.app_metadata?.provider === 'google' ? 'Autenticado con Google' : 'Cuenta Social'}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Avatar Section */}
                <Card className="lg:col-span-1 border-none bg-white rounded-[3rem] shadow-sm overflow-hidden h-fit">
                    <CardContent className="p-8 text-center">
                        <div className="relative inline-block group">
                            <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center overflow-hidden ring-4 ring-slate-100 shadow-xl group-hover:scale-105 transition-transform duration-500">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url.startsWith('http') && !profile.avatar_url.includes('supabase.co/storage')
                                            ? profile.avatar_url
                                            : `${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now()}`}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-16 w-16 text-slate-200" />
                                )}
                                {uploading ? (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                        <Loader2 className="animate-spin text-primary-600" size={24} />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                                        <Camera className="text-white mb-1" size={24} />
                                        <span className="text-[10px] text-white font-bold">Cambiar</span>
                                        <span className="text-[8px] text-white/80 mt-1 uppercase tracking-tighter">Máx 50MB</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors border-4 border-white"
                                disabled={uploading}
                            >
                                <Camera size={16} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <div className="mt-6">
                            <h3 className="font-black text-slate-900 truncate uppercase tracking-tight">
                                {profile?.full_name || user?.user_metadata?.full_name || 'Sin Nombre'}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cliente Miembro</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Form Section */}
                <Card className="lg:col-span-2 border-none bg-white rounded-[3rem] shadow-sm overflow-hidden">
                    <CardContent className="p-8 sm:p-10">
                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">1</span>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Información Personal</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Nombre Completo"
                                        placeholder="Tu nombre"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                        maxLength={40}
                                        showCounter
                                        required
                                        className="h-12 bg-slate-50 border-transparent focus:bg-white"
                                    />
                                    <Input
                                        label="RUT"
                                        placeholder="12.345.678-9"
                                        value={formData.rut}
                                        maxLength={12}
                                        onChange={(e) => {
                                            const formatted = formatRUT(e.target.value);
                                            setFormData(prev => ({ ...prev, rut: formatted }));
                                        }}
                                        error={formData.rut && !validateRUT(formData.rut) ? "RUT inválido" : null}
                                        className="h-12 bg-slate-50 border-transparent focus:bg-white"
                                    />
                                    <Input
                                        label="Teléfono"
                                        placeholder="+56..."
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                                        error={formData.phone && formData.phone.length > 3 && !validatePhone(formData.phone) ? "WhatsApp inválido" : null}
                                        className="h-12 bg-slate-50 border-transparent focus:bg-white"
                                        icon={<Smartphone size={16} />}
                                    />
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Correo Electrónico</label>
                                        <div className="relative">
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                disabled
                                                className="h-12 bg-slate-50/50 border-transparent cursor-not-allowed text-slate-400"
                                                icon={<Mail size={16} />}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-center">
                                    <Shield size={16} className="text-amber-600 shrink-0" />
                                    <p className="text-[10px] text-amber-800 font-medium leading-tight">
                                        <span className="font-black uppercase tracking-tighter mr-1">Nota:</span>
                                        Iniciaste con Google. Por seguridad, ellos no comparten tu **RUT, Teléfono o Dirección**. Por favor, complétalos manualmente.
                                    </p>
                                </div>
                                <Input
                                    label="Dirección de Envío"
                                    placeholder="Calle Ejemplo 123, Comuna, Región"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    maxLength={50}
                                    showCounter
                                    className="h-12 bg-slate-50 border-transparent focus:bg-white"
                                />
                            </div>

                            {user?.app_metadata?.provider === 'email' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">2</span>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Seguridad</h3>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            label="Nueva Contraseña (Opcional)"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Mínimo 6 caracteres"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            className="h-12 bg-slate-50 border-transparent focus:bg-white"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-14 text-sm font-black shadow-xl shadow-primary-200 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} /> Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} /> Guardar Cambios
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="pt-8 border-t border-slate-100 mt-8">
                                <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                                    <h4 className="text-sm font-black text-red-900 uppercase tracking-widest mb-2">Sesión</h4>
                                    <p className="text-xs text-red-600 mb-4 font-medium">¿Deseas salir de tu cuenta? Podrás volver a ingresar en cualquier momento.</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-12 border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest transition-all"
                                        onClick={async () => {
                                            await signOut();
                                            navigate('/login');
                                        }}
                                    >
                                        <LogOut size={18} /> Cerrar Sesión
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
