import { useState, useEffect, useMemo } from 'react';
import { Settings, User, Bell, Shield, Smartphone, Save, Image as ImageIcon, Camera, Crown, Sparkles, QrCode, Download, Loader2, Zap, Rocket, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import QRCode from "react-qr-code";
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils';
import { PlanUpgradeModal } from '../components/dashboard/PlanUpgradeModal';

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { COMPANIES } from '../data/mock';
import { useSettings } from '../hooks/useSettings';

export default function DashboardProfile() {
    const { showToast } = useToast();
    const { getSetting } = useSettings();
    const { company: authCompany, refreshCompany } = useAuth();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Check for demo mode
    const isDemo = location.pathname.includes('/demo') || searchParams.get('demo') === 'true';

    // Detect which demo type - use useMemo to prevent recreation on every render
    const isDemoRestaurant = location.pathname.includes('/demo/restaurante');
    const demoCompany = useMemo(() =>
        isDemoRestaurant ? COMPANIES[2] : COMPANIES[0],
        [isDemoRestaurant]
    );

    // Use mock company if in demo mode
    const company = isDemo ? demoCompany : authCompany;

    const [activeTab, setActiveTab] = useState('profile');
    const isPro = company?.plan !== 'free';
    const [loading, setLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeHistory, setUpgradeHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        whatsapp: '',
        businessType: 'retail',
        instagram: '',
        tiktok: '',
        website: ''
    });
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                slug: company.slug || '',
                description: company.description || '',
                whatsapp: company.whatsapp || '',
                businessType: company.business_type || 'retail',
                instagram: company.socials?.instagram || '',
                tiktok: company.socials?.tiktok || '',
                website: company.socials?.website || company.website || ''
            });
        }
    }, [company?.id, demoCompany.id]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!company?.id || isDemo) return;
            setLoadingHistory(true);
            try {
                const { data, error } = await supabase
                    .from('upgrade_requests')
                    .select('*')
                    .eq('company_id', company.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setUpgradeHistory(data || []);
            } catch (error) {
                console.error('Error fetching upgrade history:', error);
            } finally {
                setLoadingHistory(false);
            }
        };

        if (activeTab === 'messages') {
            fetchHistory();
        }
    }, [activeTab, company?.id, isDemo]);

    if (!company && !isDemo) return null;
    if (!company && isDemo) return <div className="p-8 text-center">Cargando datos de demostración...</div>;

    const downloadQR = () => {
        const svg = document.getElementById("QRCode");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QRCode-${company.slug}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handleDemoAction = (e) => {
        if (e) e.preventDefault();
        showToast("Funcionalidad próximamente disponible", "info");
    };

    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();
        if (isDemo) {
            showToast("Esta es una demostración. En la versión real podrás guardar cambios.", "info");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description,
                    whatsapp: formData.whatsapp,
                    business_type: formData.businessType,
                    socials: {
                        instagram: formData.instagram,
                        tiktok: formData.tiktok,
                        website: formData.website
                    }
                })
                .eq('id', company.id);

            if (error) throw error;

            await refreshCompany();
            showToast("Información actualizada correctamente", "success");
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast("Error al guardar los cambios", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (isDemo) {
            showToast("Esta es una demostración. No se pueden subir imágenes.", "info");
            return;
        }

        // Limit file size to 2MB
        if (file.size > 2 * 1024 * 1024) {
            showToast("La imagen debe ser menor a 2MB", "error");
            return;
        }

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${company.id}/${type}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('store-assets')
                .upload(filePath, file);

            if (uploadError) {
                if (uploadError.message.includes('bucket not found')) {
                    throw new Error("El sistema de almacenamiento no está configurado. Contacta al soporte.");
                }
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('store-assets')
                .getPublicUrl(filePath);

            // Update Company
            const { error: updateError } = await supabase
                .from('companies')
                .update({ [type]: publicUrl })
                .eq('id', company.id);

            if (updateError) throw updateError;

            await refreshCompany();
            showToast("Imagen actualizada correctamente", "success");
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast(error.message || "Error al subir la imagen", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (isDemo) {
            showToast("Esta es una demostración. No se puede cambiar la contraseña.", "info");
            return;
        }
        if (passwords.new !== passwords.confirm) {
            showToast("Las contraseñas no coinciden", "error");
            return;
        }
        if (passwords.new.length < 6) {
            showToast("La contraseña debe tener al menos 6 caracteres", "error");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });
            if (error) throw error;
            showToast("Contraseña actualizada correctamente", "success");
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            console.error('Error updating password:', error);
            showToast("Error al actualizar la contraseña", "error");
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'messages':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                                <MessageSquare size={18} className="text-primary-500" />
                                Mensajes del Sistema
                            </div>
                            <CardContent className="p-6">
                                {loadingHistory ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="animate-spin text-primary-500" size={32} />
                                    </div>
                                ) : upgradeHistory.length > 0 ? (
                                    <div className="space-y-4">
                                        {upgradeHistory.map((req) => (
                                            <div key={req.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-10 w-10 rounded-lg flex items-center justify-center border",
                                                            req.status === 'pending' ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                                req.status === 'approved' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                                    "bg-red-50 border-red-100 text-red-600"
                                                        )}>
                                                            {req.status === 'pending' ? <Clock size={20} /> :
                                                                req.status === 'approved' ? <CheckCircle2 size={20} /> :
                                                                    <XCircle size={20} />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-sm">
                                                                Solicitud Plan {req.requested_plan.toUpperCase()}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={cn(
                                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                                                    req.status === 'pending' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                                        req.status === 'approved' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                                            "bg-red-100 text-red-700 border-red-200"
                                                                )}>
                                                                    {req.status === 'pending' ? 'Pendiente' : req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(req.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {req.admin_message ? (
                                                    <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                        <p className="text-[11px] font-bold text-primary-600 mb-1">Respuesta del Administrador:</p>
                                                        <p className="text-xs text-slate-600 italic">
                                                            "{req.admin_message}"
                                                        </p>
                                                    </div>
                                                ) : req.status === 'pending' ? (
                                                    <p className="text-[11px] text-slate-500 italic">
                                                        Estamos revisando tu solicitud. Te avisaremos pronto.
                                                    </p>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-6">
                                        <div className="h-12 w-12 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <MessageSquare size={24} />
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">No hay mensajes del sistema.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'notifications':
                return (
                    <Card className="border-none shadow-sm bg-white animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                            <Bell size={18} className="text-primary-500" />
                            Preferencias de Notificaciones
                        </div>
                        <CardContent className="p-6 space-y-6">
                            {[
                                { title: 'Nuevos Pedidos', desc: 'Recibir un email cuando llegue un nuevo pedido.', default: true },
                                { title: 'Resumen Semanal', desc: 'Recibir estadísticas de rendimiento cada lunes.', default: true },
                                { title: 'Alertas de Stock', desc: 'Notificar cuando un producto tenga bajo stock (< 5 unidades).', default: false },
                                { title: 'Novedades de la Plataforma', desc: 'Enterarme de nuevas funciones y actualizaciones.', default: true }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                                    </div>
                                    <div className="h-6 w-11 bg-primary-100 rounded-full relative cursor-pointer" onClick={handleDemoAction}>
                                        <div className={cn("absolute top-1 h-4 w-4 bg-primary-600 rounded-full shadow-sm transition-all", item.default ? "right-1" : "left-1 bg-slate-400")} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            case 'security':
                return (
                    <Card className="border-none shadow-sm bg-white animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                            <Shield size={18} className="text-primary-500" />
                            Seguridad de la Cuenta
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <form className="space-y-4" onSubmit={handleUpdatePassword}>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nueva Contraseña</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="bg-slate-50 border-slate-100"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Confirmar Contraseña</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="bg-slate-50 border-slate-100"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="font-bold" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                                        Actualizar Contraseña
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                );
            case 'whatsapp':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="border-none shadow-sm overflow-hidden bg-white">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Smartphone size={18} className="text-emerald-500" />
                                    Conexión WhatsApp
                                </div>
                                {!isPro && (
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 uppercase tracking-widest">
                                        Planes de Pago
                                    </span>
                                )}
                            </div>
                            <CardContent className="p-6 relative">
                                <div className={cn("transition-all duration-500", !isPro && "blur-[2px] opacity-50 pointer-events-none")}>
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                <Smartphone size={20} className="text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-emerald-800">
                                                    {company.whatsapp ? `Conectado a ${company.whatsapp}` : "WhatsApp no configurado"}
                                                </p>
                                                <p className="text-[10px] text-emerald-600 font-medium">Recibiendo cotizaciones activamente.</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 text-xs font-bold" onClick={handleDemoAction}>
                                            Desconectar
                                        </Button>
                                    </div>
                                </div>

                                {!isPro && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowUpgradeModal(true)}
                                            className="bg-white/80 backdrop-blur-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold rounded-xl"
                                        >
                                            <Sparkles size={16} className="mr-2" />
                                            Habilitar conexión WhatsApp
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'profile':
            default:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="border-none shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800">
                                Información General
                            </div>
                            <CardContent className="p-6">
                                <form className="space-y-6" onSubmit={handleSaveProfile}>
                                    {/* Logos & Images */}
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Logo de Tienda</label>
                                            <div
                                                className="relative group cursor-pointer"
                                                onClick={() => document.getElementById('logo-upload').click()}
                                            >
                                                <div className="h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-slate-50 group-hover:ring-primary-50 transition-all">
                                                    {company.logo ? (
                                                        <img src={company.logo} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                                    ) : (
                                                        <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                                                            <ImageIcon className="text-slate-300" size={32} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl font-bold text-white text-[10px] uppercase">
                                                    <Camera size={16} className="mr-1" />
                                                    Cambiar
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                id="logo-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'logo')}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Banner del Catálogo</label>
                                            <div
                                                className="relative h-24 w-full rounded-2xl overflow-hidden ring-4 ring-slate-50 group cursor-pointer"
                                                onClick={() => document.getElementById('banner-upload').click()}
                                            >
                                                {company.banner ? (
                                                    <img src={company.banner} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-300 gap-2">
                                                        <ImageIcon size={32} />
                                                        <span className="text-sm font-bold uppercase tracking-widest">Sin Banner</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-white text-[10px] uppercase">
                                                    <ImageIcon size={16} className="mr-1" />
                                                    Cambiar Banner
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                id="banner-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, 'banner')}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Comercial</label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => {
                                                    const name = e.target.value;
                                                    const slug = name.toLowerCase()
                                                        .replace(/[^a-z0-9]+/g, '-')
                                                        .replace(/(^-|-$)+/g, '');
                                                    setFormData({ ...formData, name, slug });
                                                }}
                                                className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Slug de URL (Automático)</label>
                                            <Input
                                                value={formData.slug}
                                                readOnly
                                                disabled
                                                className="bg-slate-100 border-transparent text-slate-500 font-mono text-xs cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción corta</label>
                                            <Input
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">WhatsApp</label>
                                            <Input
                                                value={formData.whatsapp}
                                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                                placeholder="+56 9 1234 5678"
                                                className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Social Media Links */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Presencia Digital</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-medium text-slate-500 pl-1">Instagram</label>
                                                <Input
                                                    value={formData.instagram}
                                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                                    placeholder="@tu_cuenta"
                                                    className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-medium text-slate-500 pl-1">TikTok</label>
                                                <Input
                                                    value={formData.tiktok}
                                                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                                                    placeholder="@tu_cuenta"
                                                    className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-medium text-slate-500 pl-1">Web</label>
                                                <Input
                                                    value={formData.website}
                                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                    placeholder="https://..."
                                                    className="bg-slate-50/50 border-slate-100 focus:bg-white transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo de Negocio</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                            {[
                                                { id: 'retail', label: 'Detalle' },
                                                { id: 'wholesale', label: 'Mayorista' },
                                                { id: 'mixed', label: 'Detalle y Mayorista' },
                                                { id: 'restaurant', label: 'Restaurante' }
                                            ].map((type) => (
                                                <label key={type.id} className="flex items-center justify-center p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50/50">
                                                    <input
                                                        type="radio"
                                                        name="businessType"
                                                        value={type.id}
                                                        className="sr-only"
                                                        checked={formData.businessType === type.id}
                                                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                                    />
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {type.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex justify-end">
                                        <Button type="submit" disabled={loading} className="font-bold">
                                            {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                                            Guardar información
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm overflow-hidden bg-white">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <QrCode size={18} className="text-slate-500" />
                                    Código QR de tu Tienda
                                </div>
                                {!isPro && (
                                    <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-1 rounded-full border border-primary-200 uppercase tracking-widest">
                                        Planes de Pago
                                    </span>
                                )}
                            </div>
                            <CardContent className="p-6 relative">
                                <div className={cn("flex flex-col sm:flex-row items-center gap-8 transition-all duration-500", !isPro && "blur-sm grayscale opacity-40 pointer-events-none select-none")}>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                        <div style={{ height: "auto", margin: "0 auto", maxWidth: 150, width: "100%" }}>
                                            <QRCode
                                                size={256}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                value={`${window.location.origin}/catalogo/${company.slug}`}
                                                viewBox={`0 0 256 256`}
                                                id="QRCode"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h4 className="font-bold text-slate-900 mb-2">Comparte tu tienda</h4>
                                        <p className="text-sm text-slate-500 mb-4">
                                            Descarga este código QR y colócalo en tu local, mesas o tarjetas de presentación para que tus clientes accedan rápido a tu catálogo.
                                        </p>
                                        <Button onClick={downloadQR} className="w-full sm:w-auto">
                                            <Download size={16} className="mr-2" />
                                            Descargar QR
                                        </Button>
                                    </div>
                                </div>

                                {!isPro && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
                                        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-primary-100 shadow-xl max-w-sm">
                                            <div className="h-12 w-12 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Sparkles className="text-primary-600" size={24} />
                                            </div>
                                            <h4 className="font-bold text-slate-900 mb-2">Función Exclusiva de Planes Pagados</h4>
                                            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                                Genera códigos QR personalizados para que tus clientes accedan a tu catálogo al instante.
                                            </p>
                                            <Button
                                                onClick={() => setShowUpgradeModal(true)}
                                                className="w-full bg-primary-600 hover:bg-primary-700 font-bold shadow-lg shadow-primary-100"
                                            >
                                                Mejorar Plan
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Marca Blanca Section */}
                        <Card className="border-none shadow-sm overflow-hidden bg-white">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-primary-500" />
                                    Marca Propia (White Label)
                                </div>
                                {!isPro && (
                                    <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-1 rounded-full border border-primary-200 uppercase tracking-widest">
                                        Planes de Pago
                                    </span>
                                )}
                            </div>
                            <CardContent className="p-6 relative">
                                <div className={cn("flex items-center justify-between transition-all duration-500", !isPro && "blur-[2px] opacity-50 pointer-events-none select-none")}>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">Ocultar logotipo de la plataforma</h4>
                                        <p className="text-xs text-slate-500 mt-1">Remueve la mención "Catálogo por ktaloog" al final de tu tienda.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-11 bg-slate-100 rounded-full relative cursor-not-allowed">
                                            <div className="absolute left-1 top-1 h-4 w-4 bg-slate-400 rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                </div>

                                {!isPro && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowUpgradeModal(true)}
                                            className="bg-white/80 backdrop-blur-sm border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 font-bold rounded-xl"
                                        >
                                            <Sparkles size={16} className="mr-2" />
                                            Mejorar Plan
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
                    <p className="text-slate-500">Gestiona la información de tu tienda y preferencias de cuenta.</p>
                </div>
                {activeTab === 'profile' && (
                    <Button
                        onClick={handleSaveProfile}
                        disabled={loading || isDemo}
                        className="shadow-lg shadow-primary-100 h-10 px-4 shrink-0 font-bold"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        <span>{isDemo ? 'Modo Demo (Solo Lectura)' : 'Guardar Cambios'}</span>
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Navigation */}
                <div className="space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm">
                        {[
                            { id: 'profile', name: 'Perfil de Tienda', icon: <User size={18} /> },
                            { id: 'messages', name: 'Mensajes Sistema', icon: <MessageSquare size={18} /> },
                            { id: 'notifications', name: 'Notificaciones', icon: <Bell size={18} /> },
                            { id: 'security', name: 'Seguridad', icon: <Shield size={18} /> },
                            { id: 'whatsapp', name: 'Integración WhatsApp', icon: <Smartphone size={18} /> },
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                    activeTab === item.id
                                        ? "bg-primary-50 text-primary-600 shadow-sm ring-1 ring-primary-100"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                {item.icon}
                                {item.name}
                            </button>
                        ))}
                    </div>

                    <Card className="bg-white border-none overflow-hidden relative shadow-lg shadow-slate-200/50 group ring-1 ring-slate-100">
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform duration-500",
                                    company.plan === 'free' ? "bg-slate-50 border-slate-100" :
                                        company.plan === 'plus' ? "bg-blue-50 border-blue-100" :
                                            company.plan === 'pro' ? "bg-amber-50 border-amber-100" :
                                                "bg-emerald-50 border-emerald-100"
                                )}>
                                    {company.plan === 'free' && <Rocket size={24} className="text-secondary-500 fill-secondary-500/10" />}
                                    {company.plan === 'plus' && <Zap size={24} className="text-blue-500 fill-blue-500/10" />}
                                    {company.plan === 'pro' && <Sparkles size={24} className="text-amber-500 fill-amber-500/10" />}
                                    {company.plan === 'custom' && <Shield size={24} className="text-slate-800 fill-slate-800/10" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-lg leading-tight text-slate-900">
                                            Plan {company.plan === 'free' ? 'Gratuito' : company.plan.charAt(0).toUpperCase() + company.plan.slice(1)}
                                        </h4>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                            company.plan === 'free' ? "bg-slate-100 text-slate-600 border-slate-200" :
                                                company.plan === 'plus' ? "bg-blue-100 text-blue-800 border-blue-200" :
                                                    company.plan === 'pro' ? "bg-amber-100 text-amber-800 border-amber-200" :
                                                        "bg-emerald-100 text-emerald-800 border-emerald-200"
                                        )}>
                                            {company.plan.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-[11px] font-medium mt-0.5">
                                        Límite de productos activo
                                    </p>
                                </div>
                            </div>

                            <p className="text-slate-600 text-xs mb-6 leading-relaxed border-t border-slate-100 pt-4">
                                Mejora tu plan para desbloquear más productos, fotos y analíticas avanzadas.
                            </p>

                            <Button
                                className={cn(
                                    "w-full font-bold shadow-lg",
                                    company.plan === 'free' ? "bg-primary-600 hover:bg-primary-700 shadow-primary-100" :
                                        company.plan === 'plus' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" :
                                            "bg-slate-900 hover:bg-slate-800 shadow-slate-200"
                                )}
                                onClick={() => setShowUpgradeModal(true)}
                            >
                                <Sparkles size={16} className="mr-2 text-yellow-300" />
                                {company.plan === 'free' ? 'Mejorar Plan' : 'Gestionar Plan'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Areas */}
                <div className="lg:col-span-2">
                    {renderContent()}
                </div>
            </div>
            <PlanUpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                companyId={company.id}
            />
        </div>
    );
}
