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
                    full_name: formData.fullName,
                    rut: formData.rut,
                    phone: formData.phone,
                    shipping_address: formData.address
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
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Shield size={28} className="text-primary-600" /> Mi Perfil y Seguridad
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Avatar Section */}
                <Card className="lg:col-span-1 border-none bg-white rounded-[3rem] shadow-sm overflow-hidden h-fit">
                    <CardContent className="p-8 text-center">
                        <div className="relative inline-block group">
                            <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center overflow-hidden ring-4 ring-slate-100 shadow-xl group-hover:scale-105 transition-transform duration-500">
                                {profile?.avatar_url ? (
                                    <img
                                        src={`${profile.avatar_url}?t=${profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now()}`}
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
                                    <Input
                                        label="Correo Electrónico"
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="h-12 bg-slate-50/50 border-transparent cursor-not-allowed text-slate-400"
                                        icon={<Mail size={16} />}
                                    />
                                </div>
                                <Input
                                    label="Dirección de Envío"
                                    placeholder="Calle Ejemplo 123, Comuna, Región"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    className="h-12 bg-slate-50 border-transparent focus:bg-white"
                                />
                            </div>

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
