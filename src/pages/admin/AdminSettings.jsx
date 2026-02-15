import { useState, useEffect } from 'react';
import { Globe, Shield, Cloud, Save, Loader2, Package, Camera, Zap, Sparkles, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';

export default function AdminSettings() {
    const { showToast } = useToast();
    const { settings, loading: settingsLoading, refreshSettings } = useSettings();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        platform_name: 'ktaloog',
        support_email: 'soporte@ktaloog.cl',
        base_url: 'https://ktaloog.cl',
        free_plan_product_limit: '5',
        free_plan_image_limit: '1',
        plus_plan_product_limit: '100',
        plus_plan_image_limit: '5',
        pro_plan_product_limit: '500',
        pro_plan_image_limit: '5',
        custom_plan_product_limit: '1000',
        custom_plan_image_limit: '10'
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                platform_name: settings.platform_name || 'ktaloog',
                support_email: settings.support_email || 'soporte@ktaloog.cl',
                base_url: settings.base_url || 'https://ktaloog.cl',
                free_plan_product_limit: settings.free_plan_product_limit || '5',
                free_plan_image_limit: settings.free_plan_image_limit || '1',
                plus_plan_product_limit: settings.plus_plan_product_limit || '100',
                plus_plan_image_limit: settings.plus_plan_image_limit || '5',
                pro_plan_product_limit: settings.pro_plan_product_limit || '500',
                pro_plan_image_limit: settings.pro_plan_image_limit || '5',
                custom_plan_product_limit: settings.custom_plan_product_limit || '1000',
                custom_plan_image_limit: settings.custom_plan_image_limit || '10'
            });
        }
    }, [settings]);

    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(formData).map(([key, value]) => ({
                key,
                value: String(value),
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('system_config')
                .upsert(updates);

            if (error) throw error;

            await refreshSettings();
            showToast('Configuraciones guardadas correctamente.', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('No se pudieron guardar las configuraciones.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (settingsLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Configuración del Sistema</h1>
                <Button className="gap-2" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <div className="space-y-6 pb-12">
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
                                <Input
                                    value={formData.platform_name}
                                    onChange={(e) => handleInputChange('platform_name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email de Soporte</label>
                                <Input
                                    value={formData.support_email}
                                    onChange={(e) => handleInputChange('support_email', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">URL Base</label>
                                <Input
                                    value={formData.base_url}
                                    onChange={(e) => handleInputChange('base_url', e.target.value)}
                                />
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
                            <Shield size={20} className="text-secondary-600" />
                            <CardTitle>Límites Plan Gratis</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="font-bold text-slate-900 text-sm mb-4">Productos Máximos</p>
                                <Input
                                    type="number"
                                    value={formData.free_plan_product_limit}
                                    onChange={(e) => handleInputChange('free_plan_product_limit', e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="font-bold text-slate-900 text-sm mb-4">Imágenes por Producto</p>
                                <Input
                                    type="number"
                                    value={formData.free_plan_image_limit}
                                    onChange={(e) => handleInputChange('free_plan_image_limit', e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Zap size={20} className="text-primary-600" />
                            <CardTitle>Límites Plan Plus</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-primary-50/30 rounded-2xl border border-primary-100">
                                <p className="font-bold text-slate-900 text-sm mb-4">Productos Máximos</p>
                                <Input
                                    type="number"
                                    value={formData.plus_plan_product_limit}
                                    onChange={(e) => handleInputChange('plus_plan_product_limit', e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="p-4 bg-primary-50/30 rounded-2xl border border-primary-100">
                                <p className="font-bold text-slate-900 text-sm mb-4">Imágenes por Producto</p>
                                <Input
                                    type="number"
                                    value={formData.plus_plan_image_limit}
                                    onChange={(e) => handleInputChange('plus_plan_image_limit', e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Sparkles size={20} className="text-amber-500" />
                            <CardTitle>Límites Plan Pro</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                                <p className="font-bold text-slate-900 text-sm mb-4">Productos Máximos</p>
                                <Input
                                    type="number"
                                    value={formData.pro_plan_product_limit}
                                    onChange={(e) => handleInputChange('pro_plan_product_limit', e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100">
                                <p className="font-bold text-slate-900 text-sm mb-4">Imágenes por Producto</p>
                                <Input
                                    type="number"
                                    value={formData.pro_plan_image_limit}
                                    onChange={(e) => handleInputChange('pro_plan_image_limit', e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Crown size={20} className="text-purple-600" />
                            <CardTitle>Límites Plan Custom</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100">
                                <p className="font-bold text-slate-900 text-sm mb-4">Productos Máximos</p>
                                <Input
                                    type="number"
                                    value={formData.custom_plan_product_limit}
                                    onChange={(e) => handleInputChange('custom_plan_product_limit', e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100">
                                <p className="font-bold text-slate-900 text-sm mb-4">Imágenes por Producto</p>
                                <Input
                                    type="number"
                                    value={formData.custom_plan_image_limit}
                                    onChange={(e) => handleInputChange('custom_plan_image_limit', e.target.value)}
                                    className="bg-white"
                                />
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
                        <Button variant="secondary" size="sm" disabled>Configurar Webhooks</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
