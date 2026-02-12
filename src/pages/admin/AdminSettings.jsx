import { Settings, Globe, Shield, Bell, Cloud, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export default function AdminSettings() {
    const { showToast } = useToast();

    const handleSave = () => {
        showToast('Configuraciones guardadas correctamente.', 'success');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Configuración del Sistema</h1>
                <Button className="gap-2" onClick={handleSave}>
                    <Save size={18} />
                    Guardar Cambios
                </Button>
            </div>

            <div className="space-y-6">
                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Globe size={20} className="text-primary-600" />
                            <CardTitle>General</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Plataforma</label>
                                <Input defaultValue="ktaloog" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email de Soporte</label>
                                <Input defaultValue="soporte@ktaloog.cl" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">URL Base</label>
                                <Input defaultValue="https://ktaloog.cl" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Versión del Sistema</label>
                                <Input defaultValue="v1.2.0-stable" disabled />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Shield size={20} className="text-primary-600" />
                            <CardTitle>Seguridad & Planes</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Registro de Usuarios</p>
                                <p className="text-xs text-slate-500">Permitir que nuevos usuarios se registren de forma autónoma.</p>
                            </div>
                            <div className="h-6 w-11 bg-primary-600 rounded-full relative">
                                <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Verificación de Email</p>
                                <p className="text-xs text-slate-500">Requerir verificación de email antes de activar la tienda.</p>
                            </div>
                            <div className="h-6 w-11 bg-slate-200 rounded-full relative">
                                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Cloud size={20} className="text-primary-600" />
                            <CardTitle>Integraciones</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4 text-center py-12">
                        <p className="text-slate-400 text-sm">No hay integraciones activas en este momento.</p>
                        <Button variant="secondary" size="sm">Configurar Webhooks</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
