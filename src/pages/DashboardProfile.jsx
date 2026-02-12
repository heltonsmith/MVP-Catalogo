import { Settings, User, Bell, Shield, Smartphone, Save, Image as ImageIcon, Camera, Crown, Sparkles, QrCode, Download } from 'lucide-react';
import QRCode from "react-qr-code";
import { COMPANIES } from '../data/mock';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { cn } from '../utils';

export default function DashboardProfile() {
    const { showToast } = useToast();
    const company = COMPANIES[0];

    const handleDemoAction = (e) => {
        if (e) e.preventDefault();
        showToast("Los ajustes del perfil están bloqueados en la versión de demostración.", "demo");
    };

    const downloadQR = () => {
        const svg = document.getElementById("QRCode");
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
            downloadLink.download = "qr-tienda.png";
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
                    <p className="text-slate-500">Gestiona la información de tu tienda y preferencias de cuenta.</p>
                </div>
                <Button onClick={handleDemoAction} className="shadow-lg shadow-primary-100 h-10 w-10 p-0 md:h-10 md:w-auto md:px-4 shrink-0">
                    <Save className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">Guardar Cambios</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Navigation */}
                <div className="space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm">
                        {[
                            { name: 'Perfil de Tienda', icon: <User size={18} />, active: true },
                            { name: 'Notificaciones', icon: <Bell size={18} /> },
                            { name: 'Seguridad', icon: <Shield size={18} /> },
                            { name: 'Integración WhatsApp', icon: <Smartphone size={18} /> },
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => !item.active && handleDemoAction()}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                                    item.active
                                        ? "bg-primary-50 text-primary-600 shadow-sm ring-1 ring-primary-100"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon />
                                {item.name}
                            </button>
                        ))}
                    </div>

                    <Card className="bg-white border-none overflow-hidden relative shadow-lg shadow-slate-200/50 group ring-1 ring-slate-100">
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                    <Crown size={24} className="text-emerald-600 fill-emerald-600/20" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-lg leading-tight text-slate-900">Plan Premium</h4>
                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">PRO</span>
                                    </div>
                                    <p className="text-slate-500 text-[11px] font-medium mt-0.5">Renueva en 15 días</p>
                                </div>
                            </div>

                            <p className="text-slate-600 text-xs mb-6 leading-relaxed border-t border-slate-100 pt-4">
                                Acceso total a <span className="font-bold text-slate-900">Catálogo Ilimitado</span>, <span className="font-bold text-slate-900">Analíticas IA</span> y soporte prioritario 24/7.
                            </p>

                            <Button
                                className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-lg shadow-slate-200"
                                onClick={handleDemoAction}
                            >
                                <Sparkles size={16} className="mr-2 text-yellow-300" />
                                Ver Facturación
                            </Button>
                        </CardContent>

                        {/* Decorative Background Effects */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50/50 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </Card>
                </div>

                {/* Main Content: Store Profile */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 font-bold text-slate-800">
                            Información General
                        </div>
                        <CardContent className="p-6">
                            <form className="space-y-6" onSubmit={handleDemoAction}>
                                {/* Logos & Images */}
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Logo de Tienda</label>
                                        <div className="relative group cursor-pointer" onClick={handleDemoAction}>
                                            <div className="h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-slate-50 group-hover:ring-primary-50 transition-all">
                                                <img src={company.logo} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                                <Camera size={20} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Banner del Catálogo</label>
                                        <div className="relative h-24 w-full rounded-2xl overflow-hidden ring-4 ring-slate-50 group cursor-pointer" onClick={handleDemoAction}>
                                            <img src={company.banner} className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ImageIcon size={20} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Comercial</label>
                                        <Input defaultValue={company.name} className="bg-slate-50/50 border-slate-100" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Slug de URL</label>
                                        <Input defaultValue={company.slug} className="bg-slate-50/50 border-slate-100" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción corta</label>
                                    <Input defaultValue={company.description} className="bg-slate-50/50 border-slate-100" />
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex justify-end">
                                    <Button type="submit" className="font-bold">
                                        Guardar información
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                            <QrCode size={18} className="text-slate-500" />
                            Código QR de tu Tienda
                        </div>
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-center gap-8">
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
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 font-bold text-slate-800 flex items-center gap-2">
                            <Smartphone size={18} className="text-emerald-500" />
                            Conexión WhatsApp
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                        <Smartphone size={20} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800">Conectado a +{company.whatsapp}</p>
                                        <p className="text-[10px] text-emerald-600 font-medium">Recibiendo cotizaciones activamente.</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 text-xs font-bold" onClick={handleDemoAction}>
                                    Desconectar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
